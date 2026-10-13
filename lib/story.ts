export type EventPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
  credit: string;
  source: string;
};

export const YOHANNA_CONCERT_PHOTO: EventPhoto = {
  src: "/events/yohanna-halo-hawassa.jpg",
  alt: "Yohanna smiling on stage at Halo Hawassa, wearing glasses and a textured jacket",
  width: 1188,
  height: 792,
  credit: "Photo: @yohanaoriginal",
  source: "https://www.instagram.com/yohanaoriginal/p/DU6cP2yCkBV/?img_index=1",
};

export type EventInfo = {
  title: string;
  description: string;
  facts: readonly { label: string; value: string }[];
  source: { url: string; label: string };
  attributionNote: string;
  photo?: EventPhoto;
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

export const CHAPTERS: readonly Chapter[] = [
  {
    id: "shega", name: "Shega", eyebrow: "THE EXPERIENCE", line: "A moment that stays.",
    frames: 734, focalX: 0.5, focalY: 0.5,
    details: {
      title: "Made for the moment",
      description: "We bring people together through live experiences, creative production and moments that stay with you long after the lights go down.",
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
  const frame = String(Math.round(index) + 1000).padStart(5, "0");
  return `/frames/PNG%20Sequence/Shega%20Website%20Video%20${frame}.webp${revisionQuery(chapter)}`;
}

export function posterUrl(chapter: Chapter): string {
  return `/frames/PNG%20Sequence/Shega%20Website%20Video%2001000.webp${revisionQuery(chapter)}`;
}

function revisionQuery(chapter: Chapter): string {
  return chapter.assetRevision ? `?v=${encodeURIComponent(chapter.assetRevision)}` : "";
}
