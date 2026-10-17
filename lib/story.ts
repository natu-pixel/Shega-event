import { OLD_SEQUENCE_FRAMES, NEW_SEQUENCE_FRAMES, THIRD_SEQUENCE_FRAMES } from "./frames-manifest.ts";

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

const FIRST_SEQUENCE_COUNT = THIRD_SEQUENCE_FRAMES.length;
const NEW_SEQUENCE_COUNT = NEW_SEQUENCE_FRAMES.length;
const OLD_SEQUENCE_COUNT = OLD_SEQUENCE_FRAMES.length;
const TOTAL_FRAMES = FIRST_SEQUENCE_COUNT + NEW_SEQUENCE_COUNT + OLD_SEQUENCE_COUNT;
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
    const frameNum = THIRD_SEQUENCE_FRAMES[i];
    const frame = String(frameNum).padStart(4, "0");
    return `${FRAMES_DIRECTORY}/${frame}.webp${revisionQuery(chapter)}`;
  }
  const newOffset = i - FIRST_SEQUENCE_COUNT;
  if (newOffset < NEW_SEQUENCE_COUNT) {
    const frameNum = NEW_SEQUENCE_FRAMES[newOffset];
    const frame = String(frameNum).padStart(5, "0");
    return `${FRAMES_DIRECTORY}/Shega%20Website%20Video%20${frame}.webp${revisionQuery(chapter)}`;
  }
  const frameNum = OLD_SEQUENCE_FRAMES[newOffset - NEW_SEQUENCE_COUNT];
  const frame = String(frameNum).padStart(4, "0");
  return `${FRAMES_DIRECTORY}/frame_${frame}.webp${revisionQuery(chapter)}`;
}

export function posterUrl(chapter: Chapter): string {
  const frame = String(THIRD_SEQUENCE_FRAMES[0]).padStart(4, "0");
  return `${FRAMES_DIRECTORY}/${frame}.webp${revisionQuery(chapter)}`;
}

export const TOTAL_HERO_FRAMES = TOTAL_FRAMES;

function revisionQuery(chapter: Chapter): string {
  return chapter.assetRevision ? `?v=${encodeURIComponent(chapter.assetRevision)}` : "";
}
