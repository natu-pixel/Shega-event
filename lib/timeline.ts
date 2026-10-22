import { ETFC_SEQUENCE_END_FRAME, OPENING_STILLS_END_FRAME } from "./story";

export const PLAYBACK_SCREENS = 3;
export const OPENING_SEQUENCE_SCREENS = 0.5;
export const ETFC_SEQUENCE_SCREENS = 1.25;
export const BRIDGE_SCREENS = 0.6;
export const EXIT_SCREENS = 0.5;

export type StorySample = {
  chapter: number;
  frame: number;
  phase: "playback" | "bridge" | "exit";
  darkness: number;
  zoom: number;
  panX: number;
  panY: number;
  intro: number;
  bridgeTitle: number;
  titleChapter: number;
  exitTitle: number;
  progress: number;
};

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
export const smoothstep = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export function travelScreens(chapters: number): number {
  return chapters * PLAYBACK_SCREENS + Math.max(0, chapters - 1) * BRIDGE_SCREENS + EXIT_SCREENS;
}

export function chapterStart(index: number): number {
  return index * (PLAYBACK_SCREENS + BRIDGE_SCREENS);
}

export function frameAtProgress(progress: number, count: number): number {
  return Math.round(clamp(progress) * Math.max(0, count - 1) * 1e9) / 1e9;
}

export function easeFrame(current: number, target: number, deltaMs: number): number {
  if (Math.abs(target - current) < 0.015) return target;
  return lerp(current, target, 1 - Math.exp(-clamp(deltaMs, 0, 64) / 75));
}

export function sampleStory(distance: number, counts: readonly number[]): StorySample {
  if (!counts.length || counts.some((count) => count < 1)) {
    throw new Error("A story requires chapters with at least one frame.");
  }
  const total = travelScreens(counts.length);
  const position = clamp(distance, 0, total);
  const base = {
    darkness: 0, zoom: 1.035, panX: 0, panY: 0,
    intro: 0, bridgeTitle: 0, exitTitle: 0,
    progress: position / total,
  };
  for (let chapter = 0; chapter < counts.length; chapter++) {
    const local = position - chapterStart(chapter);
    if (local <= PLAYBACK_SCREENS) {
      const progress = clamp(local / PLAYBACK_SCREENS);
      const frame = chapter === 0
        ? local <= OPENING_SEQUENCE_SCREENS
          ? frameAtProgress(local / OPENING_SEQUENCE_SCREENS, OPENING_STILLS_END_FRAME)
          : local <= OPENING_SEQUENCE_SCREENS + ETFC_SEQUENCE_SCREENS
            ? OPENING_STILLS_END_FRAME - 1 + frameAtProgress(
              (local - OPENING_SEQUENCE_SCREENS) / ETFC_SEQUENCE_SCREENS,
              ETFC_SEQUENCE_END_FRAME - OPENING_STILLS_END_FRAME + 1,
            )
            : ETFC_SEQUENCE_END_FRAME - 1 + frameAtProgress(
              (local - OPENING_SEQUENCE_SCREENS - ETFC_SEQUENCE_SCREENS) / (PLAYBACK_SCREENS - OPENING_SEQUENCE_SCREENS - ETFC_SEQUENCE_SCREENS),
              counts[chapter] - ETFC_SEQUENCE_END_FRAME + 1,
            )
        : frameAtProgress(progress, counts[chapter]);
      return {
        ...base, chapter, titleChapter: chapter, phase: "playback",
        frame,
        intro: chapter === 0 ? 1 - smoothstep(progress / 0.05) : 0,
        zoom: lerp(1.035, 1.065, progress),
      };
    }
    if (chapter < counts.length - 1 && local < PLAYBACK_SCREENS + BRIDGE_SCREENS) {
      const t = (local - PLAYBACK_SCREENS) / BRIDGE_SCREENS;
      const incoming = t >= 0.5;
      const half = smoothstep(incoming ? (t - 0.5) * 2 : t * 2);
      return {
        ...base,
        phase: "bridge",
        chapter: incoming ? chapter + 1 : chapter,
        titleChapter: chapter + 1,
        frame: incoming ? 0 : counts[chapter] - 1,
        darkness: incoming ? 1 - half : half,
        zoom: incoming ? lerp(1.075, 1.035, half) : lerp(1.065, 1.012, half),
        panX: incoming ? 0.018 * (1 - half) : -0.018 * half,
        panY: incoming ? -0.018 * (1 - half) : 0.018 * half,
        bridgeTitle: smoothstep(t / 0.35) * (1 - smoothstep((t - 0.65) / 0.35)),
      };
    }
  }
  const chapter = counts.length - 1;
  const exit = clamp((position - chapterStart(chapter) - PLAYBACK_SCREENS) / EXIT_SCREENS);
  return {
    ...base, chapter, titleChapter: chapter, phase: "exit",
    frame: counts[chapter] - 1, darkness: 0.65 * smoothstep(exit),
    zoom: lerp(1.065, 1.025, smoothstep(exit)), exitTitle: smoothstep(exit),
  };
}

export function coverRect(
  width: number, height: number, imageWidth: number, imageHeight: number,
  zoom: number, focalX: number, focalY: number, panX: number, panY: number,
) {
  const scale = Math.max(width / imageWidth, height / imageHeight) * Math.max(1, zoom);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  return {
    x: clamp((width - drawWidth) * focalX + panX * width, width - drawWidth, 0),
    y: clamp((height - drawHeight) * focalY + panY * height, height - drawHeight, 0),
    width: drawWidth,
    height: drawHeight,
  };
}
