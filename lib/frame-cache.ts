import { ETFC_SEQUENCE_END_FRAME, FIRST_SEQUENCE_END_FRAME, OPENING_STILLS_END_FRAME, frameUrl, type Chapter } from "./story";

type FrameImage = ImageBitmap | HTMLImageElement;
export type DecodedFrame = {
  image: FrameImage;
  chapter: string;
  index: number;
  width: number;
  height: number;
  bytes: number;
};
type Job = { key: string; chapter: Chapter; index: number; decode: boolean };
type Focus = { chapter: Chapter; current: number; target: number; next?: Chapter };

const MIB = 1024 * 1024;
const DECODED_BUDGET = 64 * MIB;
const ENCODED_BUDGET = 48 * MIB;
const DEFAULT_DECODE_RADIUS = 4;
const PREFETCH_AHEAD = 12;
const keyFor = (chapter: Chapter, index: number) => `${chapter.id}:${index}`;

function lowDataStride(): number {
  if (typeof navigator === "undefined") return 1;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (connection?.saveData) return 3;
  if (connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") return 3;
  return 1;
}

export class FrameCache {
  private encoded = new Map<string, Blob>();
  private decoded = new Map<string, DecodedFrame>();
  private fetched = new Set<string>();
  private jobs = new Map<string, Job>();
  private inFlight = new Map<string, AbortController>();
  private attempts = new Map<string, number>();
  private failures = new Set<string>();
  private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private wanted = new Set<string>();
  private protectedKeys = new Set<string>();
  private focus?: Focus;
  private signature = "";
  private disposed = false;
  private active = true;
  private readonly frameStride = lowDataStride();
  private readonly decodeRadius = this.frameStride > 1 ? 2 : DEFAULT_DECODE_RADIUS;
  private encodedBytes = 0;
  private decodedBytes = 0;
  private concurrency = 3;

  constructor(
    private onChange: () => void,
    private onError: (message: string | null) => void,
  ) {}

  request(chapter: Chapter, current: number, target: number, next?: Chapter) {
    current = this.normalizeIndex(chapter, Math.round(current));
    target = this.normalizeIndex(chapter, Math.round(target));
    const signature = `${chapter.id}:${current}:${target}:${next?.id ?? ""}`;
    if (signature === this.signature || this.disposed) return;
    this.signature = signature;
    this.focus = { chapter, current: Math.round(current), target: Math.round(target), next };
    this.refresh();
  }

  setActive(active: boolean) {
    this.active = active;
    if (active) this.refresh();
    else this.jobs.clear();
  }

  private enqueue(chapter: Chapter, index: number, decode: boolean) {
    index = this.normalizeIndex(chapter, index);
    if (index < 0 || index >= chapter.frames) return;
    const key = keyFor(chapter, index);
    if (decode) this.wanted.add(key);
    if (this.inFlight.has(key) || this.failures.has(key) || this.retryTimers.has(key)) return;
    if (decode && this.decoded.has(key)) return;
    if (!decode && this.fetched.has(key)) return;
    const existing = this.jobs.get(key);
    this.jobs.set(key, { key, chapter, index, decode: decode || !!existing?.decode });
  }

  private refresh() {
    if (!this.focus || this.disposed || !this.active) return;
    const { chapter, current, target, next } = this.focus;
    this.jobs.clear();
    this.wanted.clear();
    this.protectedKeys = new Set([keyFor(chapter, current), keyFor(chapter, target)]);
    this.enqueue(chapter, current, true);
    this.enqueue(chapter, target, true);
    for (let offset = 1; offset <= this.decodeRadius; offset++) {
      this.enqueue(chapter, current + offset, true);
      this.enqueue(chapter, current - offset, true);
    }
    const direction = Math.sign(target - current) || 1;
    if (this.frameStride === 1) {
      for (let offset = this.decodeRadius + 1; offset <= this.decodeRadius + PREFETCH_AHEAD; offset++) {
        this.enqueue(chapter, current + direction * offset, false);
      }
    }
    if (next) this.enqueue(next, 0, false);
    this.pump();
  }

  private normalizeIndex(chapter: Chapter, index: number): number {
    if (this.frameStride === 1 || chapter.id !== "shega") return index;
    if (index < OPENING_STILLS_END_FRAME) return 0;
    const start = index < ETFC_SEQUENCE_END_FRAME
      ? OPENING_STILLS_END_FRAME
      : index < FIRST_SEQUENCE_END_FRAME
        ? ETFC_SEQUENCE_END_FRAME
        : FIRST_SEQUENCE_END_FRAME;
    return start + Math.floor((index - start) / this.frameStride) * this.frameStride;
  }

  private pump() {
    if (!this.active || this.disposed) return;
    while (this.inFlight.size < this.concurrency && this.jobs.size) {
      const job = this.jobs.values().next().value as Job | undefined;
      if (!job) break;
      this.jobs.delete(job.key);
      const controller = new AbortController();
      this.inFlight.set(job.key, controller);
      void this.run(job, controller);
    }
  }

  private async run(job: Job, controller: AbortController) {
    try {
      let blob = this.encoded.get(job.key);
      if (!blob) {
        const response = await fetch(frameUrl(job.chapter, job.index), {
          signal: controller.signal,
          cache: "force-cache",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!response.headers.get("content-type")?.startsWith("image/")) {
          throw new Error("Expected an image response");
        }
        blob = await response.blob();
        if (this.disposed) return;
        this.encoded.set(job.key, blob);
        this.encodedBytes += blob.size;
        this.fetched.add(job.key);
        this.trimEncoded();
      }
      if (this.wanted.has(job.key) && !this.decoded.has(job.key)) {
        const image = await this.decode(blob);
        if (this.disposed) {
          this.close(image);
          return;
        }
        const width = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
        const height = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
        const frame = { image, chapter: job.chapter.id, index: job.index, width, height, bytes: width * height * 4 };
        this.decoded.set(job.key, frame);
        this.decodedBytes += frame.bytes;
        this.trimDecoded();
      }
      this.attempts.delete(job.key);
      this.onChange();
    } catch (error) {
      if (this.disposed || controller.signal.aborted) return;
      const attempt = (this.attempts.get(job.key) ?? 0) + 1;
      this.attempts.set(job.key, attempt);
      if (attempt < 2) {
        this.retryTimers.set(job.key, setTimeout(() => {
          this.retryTimers.delete(job.key);
          this.refresh();
        }, 450));
      } else {
        this.failures.add(job.key);
        console.warn(`[Shega frames] ${frameUrl(job.chapter, job.index)} failed after ${attempt} attempts`, error);
        this.onError("Some frames could not load. Available images are still shown.");
      }
    } finally {
      this.inFlight.delete(job.key);
      this.refresh();
    }
  }

  private async decode(blob: Blob): Promise<FrameImage> {
    if (typeof createImageBitmap === "function") return createImageBitmap(blob);
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private close(image: FrameImage) {
    if ("close" in image) image.close();
  }

  private trimEncoded() {
    for (const [key, blob] of this.encoded) {
      if (this.encodedBytes <= ENCODED_BUDGET) break;
      if (this.protectedKeys.has(key)) continue;
      this.encoded.delete(key);
      this.encodedBytes -= blob.size;
    }
  }

  private trimDecoded() {
    for (const [key, frame] of this.decoded) {
      if (this.decodedBytes <= DECODED_BUDGET) break;
      if (this.protectedKeys.has(key)) continue;
      this.decoded.delete(key);
      this.decodedBytes -= frame.bytes;
      this.close(frame.image);
    }
  }

  nearest(chapter: Chapter, index: number, direction: -1 | 0 | 1 = 0): DecodedFrame | undefined {
    const desiredIndex = this.normalizeIndex(chapter, Math.round(index));
    let nearest: DecodedFrame | undefined;
    let nearestKey = "";
    for (const [key, frame] of this.decoded) {
      if (frame.chapter !== chapter.id) continue;
      // Do not reveal a future fallback, then jump backward when an earlier frame decodes.
      if (direction > 0 && frame.index > desiredIndex) continue;
      if (direction < 0 && frame.index < desiredIndex) continue;
      if (!nearest || Math.abs(frame.index - desiredIndex) < Math.abs(nearest.index - desiredIndex)) {
        nearest = frame;
        nearestKey = key;
      }
    }
    if (nearest) {
      this.decoded.delete(nearestKey);
      this.decoded.set(nearestKey, nearest);
    }
    return nearest;
  }

  stats() {
    const prefix = `${this.focus?.chapter.id}:`;
    return {
      decodedBytes: this.decodedBytes,
      encodedBytes: this.encodedBytes,
      loaded: Array.from(this.fetched).filter((key) => key.startsWith(prefix)).length,
      failures: this.failures.size,
      inFlight: this.inFlight.size,
    };
  }

  retryFailures() {
    for (const key of this.failures) {
      const blob = this.encoded.get(key);
      if (blob) this.encodedBytes -= blob.size;
      this.encoded.delete(key);
      this.fetched.delete(key);
      this.attempts.delete(key);
    }
    this.failures.clear();
    this.onError(null);
    this.refresh();
  }

  dispose() {
    this.disposed = true;
    this.jobs.clear();
    for (const controller of this.inFlight.values()) controller.abort();
    for (const timer of this.retryTimers.values()) clearTimeout(timer);
    for (const frame of this.decoded.values()) this.close(frame.image);
    this.decoded.clear();
    this.encoded.clear();
  }
}
