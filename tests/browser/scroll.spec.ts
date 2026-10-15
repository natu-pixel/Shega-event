import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { CHAPTERS, frameUrl, posterUrl } from "../../lib/story";

const chapter = CHAPTERS[0];

async function scrollToScreen(page: import("@playwright/test").Page, screens: number) {
  await page.locator(".scroll-story").evaluate((element, distance) => {
    const stage = element.querySelector<HTMLElement>(".story-stage");
    if (!stage) throw new Error("Story stage missing");
    // Reach the requested frame boundary even when scroll offsets round to whole CSS pixels.
    const top = Math.ceil(element.getBoundingClientRect().top + window.scrollY + stage.clientHeight * distance);
    window.scrollTo({ top, behavior: "instant" });
  }, screens);
}

async function waitForFrame(page: import("@playwright/test").Page, frame: number) {
  const story = page.locator(".scroll-story");
  await expect(story).toHaveAttribute("data-rendered-chapter", "shega");
  await expect(story).toHaveAttribute("data-rendered-frame", String(frame));
}

async function canvasHash(page: import("@playwright/test").Page) {
  return page.locator("canvas").evaluate((source) => {
    if (!(source instanceof HTMLCanvasElement)) throw new Error("Story canvas missing");
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 18;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Test canvas context missing");
    context.drawImage(source, 0, 0, 32, 18);
    return context.getImageData(0, 0, 32, 18).data.reduce((hash, value) => ((hash << 5) - hash + value) | 0, 0);
  });
}

test("the hero plays the supplied sequence from first frame to last and back", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  const hashes: number[] = [];
  for (const [distance, frame] of [[0, 1], [1.5, 852], [3, 1703], [1.5, 852]] as const) {
    await scrollToScreen(page, distance);
    await waitForFrame(page, frame);
    hashes.push(await canvasHash(page));
  }
  expect(new Set(hashes.slice(0, 3)).size).toBe(3);
  expect(hashes[3]).toBe(hashes[1]);
  expect(await page.locator(".story-stage").evaluate((el) => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(2);
});

test("served frames are the exact files the story asks for", async ({ page }) => {
  await page.goto("/");
  for (const index of [0, 968, 969, chapter.frames - 1]) {
    const response = await page.request.get(frameUrl(chapter, index));
    expect(response.ok(), frameUrl(chapter, index)).toBe(true);
    const served = createHash("sha256").update(await response.body()).digest("hex");
    const local = readFileSync(new URL(`../../public/frames/PNG Sequence/${decodeURIComponent(frameUrl(chapter, index).split("/").pop() ?? "")}`, import.meta.url));
    expect(served).toBe(createHash("sha256").update(local).digest("hex"));
  }
  const poster = page.locator(".story-poster img");
  await expect.poll(() => poster.evaluate((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await poster.evaluate((image) => {
    if (!(image instanceof HTMLImageElement)) throw new Error("Poster image missing");
    return new URL(image.currentSrc).pathname.endsWith("/frame_0032.webp");
  })).toBe(true);
  expect(decodeURIComponent(posterUrl(chapter))).toContain("frame_0032.webp");
});

test("frame loading stays inside the declared memory budgets", async ({ page }) => {
  await page.goto("/");
  await scrollToScreen(page, 1.5);
  await waitForFrame(page, 852);
  const stats = await page.locator(".scroll-story").evaluate((el) => ({
    loops: Number((el as HTMLElement).dataset.activeLoops),
    decoded: Number((el as HTMLElement).dataset.decodedBytes),
    encoded: Number((el as HTMLElement).dataset.encodedBytes),
    loaded: Number((el as HTMLElement).dataset.loadedFrames),
  }));
  expect(stats.loops).toBe(1);
  expect(stats.loaded).toBeGreaterThan(0);
  expect(stats.decoded).toBeLessThanOrEqual(64 * 1024 * 1024);
  expect(stats.encoded).toBeLessThanOrEqual(48 * 1024 * 1024);
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect(page.locator(".scroll-story")).toHaveAttribute("data-active-loops", "0");
});

test("mobile retina resize keeps the current frame and never overflows", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto("/");
  await scrollToScreen(page, 1.5);
  await waitForFrame(page, 852);
  const sizing = await page.locator("canvas").evaluate((el) => {
    if (!(el instanceof HTMLCanvasElement)) throw new Error("Story canvas missing");
    return { width: el.width, css: el.clientWidth };
  });
  expect(sizing.width).toBe(sizing.css * 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  await scrollToScreen(page, 1.5);
  await waitForFrame(page, 852);
  await page.reload();
  await expect(page.locator(".scroll-story")).not.toHaveAttribute("data-target-frame", "1");
  await waitForFrame(page, 852);
  await context.close();
});

test("reduced motion shows a still frame, fetches nothing and keeps the copy readable", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const frameRequests: string[] = [];
  page.on("request", (request) => { if (/%20Sequence\/.*\.webp/.test(request.url())) frameRequests.push(request.url()); });
  await page.goto("/");
  const story = page.locator(".scroll-story");
  await expect(story).toHaveAttribute("data-reduced-motion", "true");
  expect(await story.evaluate((el) => el.getBoundingClientRect().height)).toBe(844);
  await expect(page.locator("canvas")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Shega Events");
  expect(frameRequests).toHaveLength(0);
  await context.close();
});

test("a failed frame reports a recoverable error instead of pretending to load", async ({ page }) => {
  // Frame index 851 is the mid-sequence playhead the test scrolls to.
  const broken = frameUrl(chapter, 851);
  await page.route(`**${broken}`, (route) => route.fulfill({ status: 404, body: "Missing test frame" }));
  await page.goto("/preview/shega");
  await scrollToScreen(page, 1.5);
  await expect(page.locator(".frame-error")).toBeVisible();
  await expect(page.locator(".scroll-story")).toHaveAttribute("data-active-loops", "1");
  await page.unroute(`**${broken}`);
  await page.getByRole("button", { name: "Retry frames" }).click();
  await waitForFrame(page, 852);
  await expect(page.locator(".frame-error")).toHaveCount(0);
});

test("the intro title clears without clipping and the preview renders its details", async ({ page }, testInfo) => {
  await page.goto("/");
  await waitForFrame(page, 1);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1920, height: 650 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await scrollToScreen(page, 0);
    await waitForFrame(page, 1);
    await expect(page.getByRole("heading", { name: "SHEGA EVENTS", exact: true })).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`hero-${viewport.width}x${viewport.height}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/preview/shega");
  await waitForFrame(page, 1);
  await expect(page.locator(".scroll-story")).toHaveAttribute("data-introduction", "false");
  const overview = page.locator(".event-details-overview");
  await overview.scrollIntoViewIfNeeded();
  await expect(overview.getByRole("heading", { name: chapter.details.title, exact: true })).toBeInViewport();
  await expect(overview.locator(".event-source")).toHaveAttribute("href", /^https:\/\//);
  await expect(overview.locator(".event-facts > div")).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath("preview-overview.png") });
});
