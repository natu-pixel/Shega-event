export type EventInfo = {
  title: string;
  description: string;
  facts: readonly { label: string; value: string }[];
  source: { url: string; label: string };
  attributionNote: string;
};

export type Chapter = {
  id: string;
  name: string;
  eyebrow: string;
  line: string;
  frames: number;
  assetRevision?: string;
  focalX: number;
  focalY: number;
  details: EventInfo;
};

// The supplied hero sequence has gaps in its first part. List only the frames
// present on disk so playback skips missing filenames and shows every image.
const FIRST_SEQUENCE_RANGES: readonly (readonly [number, number])[] = [
  [32, 951],
  [967, 986],
  [1000, 1000],
];
const FIRST_SEQUENCE_COUNT = FIRST_SEQUENCE_RANGES.reduce(
  (count, [start, end]) => count + end - start + 1,
  0,
);
const NEW_SEQUENCE_COUNT = 734;
const TOTAL_FRAMES = FIRST_SEQUENCE_COUNT + NEW_SEQUENCE_COUNT;
const FRAMES_DIRECTORY = "/frames/PNG%20Sequence";

export const CHAPTERS: readonly Chapter[] = [
  {
    id: "shega",
    name: "Shega",
    eyebrow: "THE EXPERIENCE",
    line: "A moment that stays.",
    frames: TOTAL_FRAMES,
    focalX: 0.5,
    focalY: 0.5,
    details: {
      title: "Made for the moment",
      description:
        "We bring people together through live experiences, creative production and moments that stay with you long after the lights go down.",
      facts: [
        { label: "What we create", value: "Live experiences" },
        { label: "What matters", value: "Real connection" },
      ],
      source: { url: "https://www.instagram.com/shega_events/", label: "Explore Shega Events" },
      attributionNote: "The scroll experience uses the supplied Shega Website Video PNG sequence.",
    },
  },
];

export function frameUrl(chapter: Chapter, index: number): string {
  const i = Math.min(Math.max(Math.round(index), 0), chapter.frames - 1);
  if (i < FIRST_SEQUENCE_COUNT) {
    const sourceFrame = firstSequenceFrame(i);
    const frame = String(sourceFrame).padStart(4, "0");
    return `${FRAMES_DIRECTORY}/frame_${frame}.webp${revisionQuery(chapter)}`;
  }
  const frame = String(i - FIRST_SEQUENCE_COUNT + 1000).padStart(5, "0");
  return `${FRAMES_DIRECTORY}/Shega%20Website%20Video%20${frame}.webp${revisionQuery(chapter)}`;
}

function firstSequenceFrame(index: number): number {
  let offset = index;
  for (const [start, end] of FIRST_SEQUENCE_RANGES) {
    const rangeLength = end - start + 1;
    if (offset < rangeLength) return start + offset;
    offset -= rangeLength;
  }
  throw new RangeError(`Hero frame index ${index} is outside the first sequence`);
}

export function posterUrl(chapter: Chapter): string {
  return `${FRAMES_DIRECTORY}/frame_0032.webp${revisionQuery(chapter)}`;
}

export const TOTAL_HERO_FRAMES = TOTAL_FRAMES;

function revisionQuery(chapter: Chapter): string {
  return chapter.assetRevision ? `?v=${encodeURIComponent(chapter.assetRevision)}` : "";
}
