import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { CHAPTERS, frameUrl, posterUrl, YOHANNA_CONCERT_PHOTO } from "../lib/story.ts";

test("every chapter has specific event information and a documented source", () => {
  assert.equal(CHAPTERS.length, 5);
  assert.equal(new Set(CHAPTERS.map((chapter) => chapter.details.description)).size, 5);
  for (const chapter of CHAPTERS) {
    assert.ok(chapter.details.title.length > 5);
    assert.ok(chapter.details.description.length > 120);
    assert.equal(chapter.details.facts.length, 2);
    assert.equal(new URL(chapter.details.source.url).protocol, "https:");
    assert.ok(chapter.details.attributionNote.length > 50);
    assert.ok(!/\b202[0-9]\b/.test(chapter.details.description), "Do not assign unverified dates to local films");
  }
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

test("Yohanna's clear concert photo matches its official photo-post provenance", () => {
  const chapter = CHAPTERS.find((item) => item.id === "yohana");
  assert.equal(chapter?.details.photo, YOHANNA_CONCERT_PHOTO);
  const metadata = JSON.parse(readFileSync(new URL("../public/events/yohanna-photo-provenance.json", import.meta.url), "utf8"));
  const photo = YOHANNA_CONCERT_PHOTO;
  const image = readFileSync(new URL(`../public${photo.src}`, import.meta.url));
  assert.equal(createHash("sha256").update(image).digest("hex"), metadata.sha256);
  assert.equal(metadata.source_page_url, photo.source);
  assert.equal(metadata.source_account, "@yohanaoriginal");
  assert.equal(photo.src, `/events/${metadata.filename}`);
  assert.deepEqual([photo.width, photo.height], metadata.dimensions);
  assert.match(photo.alt, /Yohanna.*Halo Hawassa/);
  assert.ok(metadata.permission_status.includes("permission"));
  assert.equal(CHAPTERS.filter((item) => item.details.photo).length, 1);
});

test("chapter asset URLs match the generated revision and invalidate changed footage", () => {
  const manifest = JSON.parse(readFileSync(new URL("../public/asset-manifest.json", import.meta.url), "utf8"));
  for (const chapter of CHAPTERS) {
    const sequence = manifest.sequences.find((entry: { id: string }) => entry.id === chapter.id);
    assert.ok(sequence, `Missing generated sequence: ${chapter.id}`);
    assert.equal(chapter.assetRevision, sequence.asset_revision);
    if (chapter.assetRevision) {
      assert.equal(chapter.assetRevision, sequence.source_sha256);
      const video = readFileSync(new URL(`../${sequence.source}`, import.meta.url));
      assert.equal(createHash("sha256").update(video).digest("hex"), chapter.assetRevision);
    }
    const servedPattern = sequence.frame_url_pattern.replace(".png", ".webp");
    assert.equal(frameUrl(chapter, 0), servedPattern.replace("{index:03d}", "001"));
    assert.equal(frameUrl(chapter, 149), servedPattern.replace("{index:03d}", "150"));
    for (const index of ["001", "150"]) {
      assert.ok(existsSync(new URL(`../public/frames/${chapter.id}/frame-${index}.webp`, import.meta.url)),
        `Missing served WebP frame ${index} for ${chapter.id}; run scripts/optimize-frames.py`);
    }
    assert.equal(posterUrl(chapter), sequence.poster_url);
  }
});
