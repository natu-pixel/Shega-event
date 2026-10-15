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

// The hero is the supplied "Shega Website Video" PNG sequence. It was delivered
// in two parts that keep their own file names: frame_0032..frame_1000 and
// "Shega Website Video 01000..01733".
const OLD_SEQUENCE_START = 32;
const OLD_SEQUENCE_END = 1000;
const OLD_SEQUENCE_COUNT = OLD_SEQUENCE_END - OLD_SEQUENCE_START + 1;
// These source frames were absent from the supplied sequence. Hold the last
// available image across each gap so the browser never requests a missing file.
const MISSING_OLD_FRAME_RANGES: readonly (readonly [number, number])[] = [
  [952, 966],
  [987, 999],
];
const NEW_SEQUENCE_COUNT = 734;
const TOTAL_FRAMES = OLD_SEQUENCE_COUNT + NEW_SEQUENCE_COUNT;
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
  if (i < OLD_SEQUENCE_COUNT) {
    const sourceFrame = OLD_SEQUENCE_START + i;
    const missingRange = MISSING_OLD_FRAME_RANGES.find(
      ([start, end]) => sourceFrame >= start && sourceFrame <= end,
    );
    const availableFrame = missingRange ? missingRange[0] - 1 : sourceFrame;
    const frame = String(availableFrame).padStart(4, "0");
    return `${FRAMES_DIRECTORY}/frame_${frame}.webp${revisionQuery(chapter)}`;
  }
  const frame = String(i - OLD_SEQUENCE_COUNT + 1000).padStart(5, "0");
  return `${FRAMES_DIRECTORY}/Shega%20Website%20Video%20${frame}.webp${revisionQuery(chapter)}`;
}

export function posterUrl(chapter: Chapter): string {
  return `${FRAMES_DIRECTORY}/frame_0032.webp${revisionQuery(chapter)}`;
}

export const TOTAL_HERO_FRAMES = TOTAL_FRAMES;

function revisionQuery(chapter: Chapter): string {
  return chapter.assetRevision ? `?v=${encodeURIComponent(chapter.assetRevision)}` : "";
}
