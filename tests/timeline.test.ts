import { test } from "node:test";
import assert from "node:assert/strict";
import { chapterStart, coverRect, easeFrame, frameAtProgress, sampleStory, travelScreens } from "../lib/timeline.ts";

test("scroll maps the complete sequence, including both endpoints", () => {
  assert.equal(frameAtProgress(0, 150), 0);
  assert.equal(Math.round(frameAtProgress(0.5, 150)), 75);
  assert.equal(frameAtProgress(1, 150), 149);
  assert.equal(frameAtProgress(-3, 150), 0);
  assert.equal(frameAtProgress(3, 150), 149);
});

test("every chapter has its own complete playback interval", () => {
  for (let chapter = 0; chapter < 5; chapter++) {
    const start = chapterStart(chapter);
    assert.equal(sampleStory(start, [150, 150, 150, 150, 150]).chapter, chapter);
    assert.equal(sampleStory(start, [150, 150, 150, 150, 150]).frame, 0);
    assert.equal(sampleStory(start + 1.5, [150, 150, 150, 150, 150]).frame, 74.5);
    assert.equal(sampleStory(start + 3, [150, 150, 150, 150, 150]).frame, 149);
  }
});

test("the bridge conceals the image swap and is scroll-reversible", () => {
  const counts = [150, 150, 150];
  const before = sampleStory(3.2999, counts);
  const after = sampleStory(3.3001, counts);
  assert.equal(before.chapter, 0);
  assert.equal(before.frame, 149);
  assert.equal(after.chapter, 1);
  assert.equal(after.frame, 0);
  assert.ok(before.darkness > 0.999);
  assert.ok(after.darkness > 0.999);
  assert.deepEqual(sampleStory(2.4, counts), sampleStory(2.4, counts));
  assert.equal(sampleStory(-100, counts).frame, 0);
  assert.equal(sampleStory(100, counts).frame, 149);
  assert.equal(sampleStory(100, counts).phase, "exit");
  assert.equal(travelScreens(3), 10.7);
});

test("lerp settles exactly and is independent of display refresh rate", () => {
  let sixty = 0;
  let thirty = 0;
  for (let i = 0; i < 20; i++) sixty = easeFrame(sixty, 149, 1000 / 60);
  for (let i = 0; i < 10; i++) thirty = easeFrame(thirty, 149, 1000 / 30);
  assert.ok(Math.abs(sixty - thirty) < 0.000001);
  for (let i = 0; i < 100; i++) sixty = easeFrame(sixty, 149, 16.67);
  assert.equal(sixty, 149);
  for (let i = 0; i < 100; i++) sixty = easeFrame(sixty, 0, 16.67);
  assert.equal(sixty, 0);
});

test("cover geometry never reveals canvas edges, even with extreme focal points", () => {
  for (const [width, height] of [[1440, 900], [390, 844], [844, 390]]) {
    for (const pan of [-2, -0.02, 0, 0.02, 2]) {
      const rect = coverRect(width, height, 1280, 720, 1.035, 0.52, 0.5, pan, -pan);
      assert.ok(rect.x <= 0);
      assert.ok(rect.y <= 0);
      assert.ok(rect.x + rect.width >= width - 0.0001);
      assert.ok(rect.y + rect.height >= height - 0.0001);
    }
  }
});

test("invalid empty timelines fail explicitly", () => {
  assert.throws(() => sampleStory(0, []), /requires chapters/);
  assert.throws(() => sampleStory(0, [0]), /requires chapters/);
});
