import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { CHAPTERS, frameUrl, posterUrl } from "../lib/story.ts";

const FRAMES = new URL("../public/frames/PNG Sequence/", import.meta.url);
const eventSlugs = ["kemen-lejemer", "rophnan-finale", "keberaf", "halo-hawassa", "wazema", "great-arbaminch-run"] as const;

test("the hero is one chapter with documented, dateless copy", () => {
  assert.equal(CHAPTERS.length, 1);
  const [chapter] = CHAPTERS;
  assert.equal(new URL(chapter.details.source.url).protocol, "https:");
  assert.ok(chapter.details.attributionNote.length > 50);
  assert.ok(!/\b202[0-9]\b/.test(chapter.details.description), "Do not assign unverified dates to local films");
});

test("frame URLs play the opening stills and both remaining PNG sequences", () => {
  const [chapter] = CHAPTERS;
  // Opening stills: 1.webp..5.webp.
  assert.equal(frameUrl(chapter, 0), "/frames/PNG%20Sequence/1.webp?v=opening-photos-2");
  assert.equal(frameUrl(chapter, 4), "/frames/PNG%20Sequence/5.webp?v=opening-photos-2");
  // First remaining sequence: four-digit names 0001..0750.
  assert.equal(frameUrl(chapter, 5), "/frames/PNG%20Sequence/0001.webp");
  assert.equal(frameUrl(chapter, 754), "/frames/PNG%20Sequence/0750.webp");
  // Second remaining sequence: "Shega Website Video 01000..01733".
  assert.equal(frameUrl(chapter, 755), "/frames/PNG%20Sequence/Shega%20Website%20Video%2001000.webp");
  assert.equal(frameUrl(chapter, chapter.frames - 1), "/frames/PNG%20Sequence/Shega%20Website%20Video%2001733.webp");
  // Out-of-range indices clamp to the part boundaries rather than escaping the folder.
  assert.equal(frameUrl(chapter, -5), "/frames/PNG%20Sequence/1.webp?v=opening-photos-2");
  assert.equal(frameUrl(chapter, 5000), "/frames/PNG%20Sequence/Shega%20Website%20Video%2001733.webp");
  assert.equal(chapter.frames, 1489);
});

test("every first, last and sampled hero frame has a served WebP copy", () => {
  const [chapter] = CHAPTERS;
  const requested = new Set<number>([0, 1, chapter.frames - 1]);
  for (let index = 0; index < chapter.frames; index += 17) requested.add(index);
  for (const index of requested) {
    const file = decodeURIComponent(frameUrl(chapter, index).split("/").pop() ?? "");
    assert.ok(existsSync(new URL(file, FRAMES)), `Missing served frame: ${file}`);
  }
  assert.equal(posterUrl(chapter), "/frames/PNG%20Sequence/0001.webp");
  const poster = decodeURIComponent(posterUrl(chapter).split("/").pop() ?? "");
  assert.ok(existsSync(new URL(poster, FRAMES)), `Missing poster frame: ${poster}`);
});

test("a chapter revision invalidates both frame and poster URLs", () => {
  const [chapter] = CHAPTERS;
  const revised = { ...chapter, assetRevision: "abc123" };
  assert.equal(frameUrl(revised, 0), "/frames/PNG%20Sequence/1.webp?v=opening-photos-2&r=abc123");
  assert.equal(posterUrl(revised), "/frames/PNG%20Sequence/0001.webp?v=abc123");
  assert.equal(frameUrl(chapter, 0).includes("?"), false);
});

test("the displayed brand asset matches its original-source provenance", () => {
  const metadata = JSON.parse(readFileSync(new URL("../public/brand/shega-events-black-provenance.json", import.meta.url), "utf8"));
  const hash = (name: string) => createHash("sha256").update(readFileSync(new URL(`../public/brand/${name}`, import.meta.url))).digest("hex");
  assert.equal(metadata.source_page_url, "https://www.instagram.com/shega_events/");
  assert.equal(metadata.display_filename, "shega-events-black.jpg");
  assert.equal(hash(metadata.original_filename), metadata.original_sha256);
  assert.equal(hash(metadata.display_filename), metadata.display_sha256);
  assert.equal(metadata.original_sha256, metadata.display_sha256, "Use the original black artwork without recoloring");
  assert.deepEqual(metadata.display_dimensions, [150, 150]);
  const favicon = readFileSync(new URL("../app/icon.png", import.meta.url));
  assert.equal(createHash("sha256").update(favicon).digest("hex"), metadata.favicon_sha256);
  assert.deepEqual([favicon.readUInt32BE(16), favicon.readUInt32BE(20)], [128, 128]);
  assert.ok(!existsSync(new URL("../app/icon.svg", import.meta.url)), "Fabricated icon must not remain active");
});

test("every published event photograph keeps its source, credit and permission note", () => {
  const sources = JSON.parse(readFileSync(new URL("../public/events/sources.json", import.meta.url), "utf8"));
  let checked = 0;
  for (const slug of eventSlugs) {
    const event = sources.events.find((entry: { event_slug: string }) => entry.event_slug === slug);
    assert.ok(event, `Missing event record: ${slug}`);
    assert.equal(event.images.length, 4, `${slug} should publish exactly four credited photographs`);
    for (const image of event.images) {
      const file = readFileSync(new URL(`../public/events/${slug}/${image.filename}`, import.meta.url));
      assert.equal(file.readUInt32BE(16) > 0 && file.readUInt32BE(20) > 0, true, `Unreadable image: ${slug}/${image.filename}`);
      assert.ok(image.credit.length > 10, `Missing credit on ${slug}/${image.filename}`);
      assert.match(image.permission_status, /permission|licen[cs]/i, `Missing permission note on ${slug}/${image.filename}`);
      checked++;
    }
  }
  assert.equal(checked, eventSlugs.length * 4);
  assert.match(sources.publication_notice, /not a republication license/);
});
