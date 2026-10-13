import { expect, test, type Locator, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { CHAPTERS, frameUrl, posterUrl } from "../../lib/story";

const eventTitles = [
  ["etfc", "ETFC: fight night"],
  ["keberaf", "Ke Beraf, live"],
  ["lij-michael", "Kemen Lejemer"],
  ["yohana", "Halo Hawassa"],
  ["rophnan", "Rophnan live"],
] as const;

async function scrollToScreen(page: Page, screens: number) {
  await page.locator(".scroll-story").evaluate((element, distance) => {
    const stage = element.querySelector<HTMLElement>(".story-stage");
    if (!stage) throw new Error("Story stage missing");
    // Reach the requested frame boundary even when scroll offsets round to whole CSS pixels.
    const top = Math.ceil(element.getBoundingClientRect().top + window.scrollY + stage.clientHeight * distance);
    window.scrollTo({ top, behavior: "instant" });
  }, screens);
}

async function waitForFrame(page: Page, chapter: string, frame: number) {
  const story = page.locator(".scroll-story");
  await expect(story).toHaveAttribute("data-rendered-chapter", chapter);
  await expect(story).toHaveAttribute("data-rendered-frame", String(frame));
}

async function expectCompactBrand(brand: Locator, width: number) {
  const image = brand.getByRole("img", { name: "Shega Events", exact: true });
  await expect(brand).toHaveAttribute("href", "/#experience");
  await expect(brand).toHaveAccessibleName("Shega home");
  await expect(brand).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(image).toHaveAttribute("src", "/brand/shega-events-black.jpg");
  await expect(image).toHaveCSS("width", `${width}px`);
  await expect(image).toHaveCSS("height", `${width}px`);
  await expect.poll(() => image.evaluate((element) => {
    if (!(element instanceof HTMLImageElement)) throw new Error("Official logo image missing");
    return [element.naturalWidth, element.naturalHeight];
  })).toEqual([150, 150]);
  const bounds = await brand.boundingBox();
  if (!bounds) throw new Error("Brand link has no visible dimensions");
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
}

async function expectUnobstructedYohanna(page: Page) {
  const details = page.locator('.event-details-overlay[data-event-id="yohana"]');
  await expect(details.getByRole("heading", { name: "Halo Hawassa", exact: true })).toBeInViewport();
  await expect(details.locator(".event-artist")).toHaveCount(0);
  await expect(details).not.toHaveClass(/event-details-with-photo/);
  const bounds = await page.locator(".chapter-details").boundingBox();
  if (!bounds) throw new Error("Yohanna details panel missing");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Viewport size missing");
  expect(bounds.width).toBeLessThanOrEqual(viewport.height > 600 ? 455 : 600);
}

async function expectYohannaPhoto(page: Page) {
  const figure = page.locator(".event-details-overview .event-artist");
  await figure.scrollIntoViewIfNeeded();
  const image = figure.getByRole("img", { name: /Yohanna smiling on stage at Halo Hawassa/ });
  await expect(image).toBeInViewport({ ratio: 1 });
  await expect.poll(() => image.evaluate((element) => {
    if (!(element instanceof HTMLImageElement)) throw new Error("Artist photo missing");
    return element.complete && element.naturalWidth > 100;
  })).toBe(true);
  await expect(figure.getByRole("link", { name: "Photo: @yohanaoriginal" })).toHaveAttribute("href", "https://www.instagram.com/yohanaoriginal/p/DU6cP2yCkBV/?img_index=1");
  const bounds = await image.boundingBox();
  if (!bounds) throw new Error("Artist photo has no visible dimensions");
  expect(bounds.width / bounds.height).toBeCloseTo(1.5, 1);
}

async function canvasHash(page: Page) {
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

test("all five chapters render actual start, middle and last frames; reverse works", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  const hashes: number[] = [];
  for (const [index, [chapter, title]] of eventTitles.entries()) {
    const start = index * 3.6;
    await scrollToScreen(page, start);
    await waitForFrame(page, chapter, 1);
    const first = await canvasHash(page);
    await scrollToScreen(page, start + 1.5);
    await waitForFrame(page, chapter, 76);
    const details = page.locator(`.event-details-overlay[data-event-id="${chapter}"]`);
    await expect(page.locator(".chapter-details")).toHaveCSS("opacity", "1");
    await expect(page.locator(".chapter-details")).toHaveJSProperty("inert", false);
    await expect(details.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(details.locator(".event-description")).not.toBeEmpty();
    await expect(details.locator(".event-facts > div")).toHaveCount(2);
    await expect(details.locator(".event-source")).toHaveAttribute("href", /^https:\/\//);
    if (chapter === "yohana") await expectUnobstructedYohanna(page);
    else await expect(details.locator(".event-artist")).toHaveCount(0);
    const middle = await canvasHash(page);
    const settledFrames = await page.locator(".scroll-story").evaluate(async (el) => {
      const seen: (string | null)[] = [];
      for (let sample = 0; sample < 12; sample++) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        seen.push(el.getAttribute("data-rendered-frame"));
      }
      return seen;
    });
    expect(new Set(settledFrames)).toEqual(new Set(["76"]));
    await scrollToScreen(page, start + 3);
    await waitForFrame(page, chapter, 150);
    const last = await canvasHash(page);
    expect(new Set([first, middle, last]).size).toBeGreaterThan(1);
    hashes.push(middle);
    expect(await page.locator(".story-stage").evaluate((el) => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(2);
  }
  expect(new Set(hashes).size).toBe(5);
  await scrollToScreen(page, 0);
  await waitForFrame(page, "etfc", 1);
  const stats = await page.locator(".scroll-story").evaluate((el) => ({
    loops: Number((el as HTMLElement).dataset.activeLoops),
    decoded: Number((el as HTMLElement).dataset.decodedBytes),
    encoded: Number((el as HTMLElement).dataset.encodedBytes),
  }));
  expect(stats.loops).toBe(1);
  expect(stats.decoded).toBeLessThanOrEqual(64 * 1024 * 1024);
  expect(stats.encoded).toBeLessThanOrEqual(48 * 1024 * 1024);
  await page.locator("#work").scrollIntoViewIfNeeded();
  await expect(page.locator(".scroll-story")).toHaveAttribute("data-active-loops", "0");
});

test("mobile retina resize preserves the current scroll frame and no horizontal overflow", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto("/");
  await scrollToScreen(page, 1.5);
  await waitForFrame(page, "etfc", 76);
  const sizing = await page.locator("canvas").evaluate((el) => {
    if (!(el instanceof HTMLCanvasElement)) throw new Error("Story canvas missing");
    return { width: el.width, css: el.clientWidth };
  });
  expect(sizing.width).toBe(sizing.css * 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  await scrollToScreen(page, 1.5);
  await waitForFrame(page, "etfc", 76);
  await page.reload();
  await expect(page.locator(".scroll-story")).not.toHaveAttribute("data-target-frame", "1");
  await waitForFrame(page, "etfc", 76);
  await context.close();
});

test("Yohanna replacement footage loads fresh frames and poster in both experiences", async ({ page }, testInfo) => {
  const chapter = CHAPTERS.find((item) => item.id === "yohana");
  if (!chapter?.assetRevision) throw new Error("Yohanna asset revision missing");
  const requests: string[] = [];
  page.on("request", (request) => {
    if (/\/frames\/yohana\/frame-\d{3}\.webp/.test(request.url())) requests.push(request.url());
  });
  for (const [route, start] of [["/", 3 * 3.6], ["/preview/yohana", 0]] as const) {
    requests.length = 0;
    await page.goto(route);
    const hashes: number[] = [];
    for (const [distance, index] of [[0, 0], [1.5, 75], [3, 149], [1.5, 75]] as const) {
      await scrollToScreen(page, start + distance);
      await waitForFrame(page, "yohana", index + 1);
      hashes.push(await canvasHash(page));
      const response = await page.request.get(frameUrl(chapter, index));
      expect(response.ok()).toBe(true);
      const actual = createHash("sha256").update(await response.body()).digest("hex");
      const filename = `frame-${String(index + 1).padStart(3, "0")}.webp`;
      const expected = createHash("sha256").update(readFileSync(new URL(`../../public/frames/yohana/${filename}`, import.meta.url))).digest("hex");
      expect(actual).toBe(expected);
    }
    expect(new Set(hashes.slice(0, 3)).size).toBe(3);
    expect(hashes[3]).toBe(hashes[1]);
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every((url) => new URL(url).searchParams.get("v") === chapter.assetRevision)).toBe(true);
    await expectUnobstructedYohanna(page);
    const poster = page.locator(".story-poster img");
    await expect.poll(() => poster.evaluate((image) => {
      if (!(image instanceof HTMLImageElement)) throw new Error("Yohanna poster missing");
      return image.complete && image.naturalWidth > 0;
    })).toBe(true);
    expect(await poster.evaluate((image) => {
      if (!(image instanceof HTMLImageElement)) throw new Error("Yohanna poster missing");
      return new URL(image.currentSrc).searchParams.get("url");
    })).toBe(posterUrl(chapter));
    await expect(page.locator(".frame-error")).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(route === "/" ? "yohanna-updated-merged.png" : "yohanna-updated-preview.png") });
  }
});

test("reduced motion uses a static viewport, no frame requests and working chapter selection", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const frameRequests: string[] = [];
  page.on("request", (request) => { if (/frame-\d{3}\.webp/.test(request.url())) frameRequests.push(request.url()); });
  await page.goto("/");
  const story = page.locator(".scroll-story");
  await expect(story).toHaveAttribute("data-reduced-motion", "true");
  expect(await story.evaluate((el) => el.getBoundingClientRect().height)).toBe(844);
  await page.getByRole("button", { name: "Go to Keberaf" }).click();
  await expect(page.getByRole("button", { name: "Go to Keberaf" })).toHaveAttribute("aria-current", "step");
  await expect(page.locator(".event-details-overlay")).toContainText("Robel Mideksa");
  await expect(page.locator(".chapter-details")).toHaveJSProperty("inert", false);
  await page.getByRole("button", { name: "Go to Yohanna" }).click();
  await expectUnobstructedYohanna(page);
  const chapter = CHAPTERS.find((item) => item.id === "yohana");
  if (!chapter) throw new Error("Yohanna chapter missing");
  await expect(page.locator(".story-poster img")).toHaveAttribute("src", new RegExp(encodeURIComponent(posterUrl(chapter))));
  expect(frameRequests).toHaveLength(0);
  await expect(page.locator("canvas")).toBeHidden();
  await context.close();
});

test("failed frames report a recoverable error instead of pretending to load", async ({ page }) => {
  await page.route("**/frames/etfc/frame-076.webp", (route) => route.fulfill({ status: 404, body: "Missing test frame" }));
  await page.goto("/preview/etfc");
  await scrollToScreen(page, 1.5);
  await expect(page.locator(".frame-error")).toBeVisible();
  await expect(page.locator(".scroll-story")).toHaveAttribute("data-active-loops", "1");
  await page.unroute("**/frames/etfc/frame-076.webp");
  await page.getByRole("button", { name: "Retry frames" }).click();
  await waitForFrame(page, "etfc", 76);
  await expect(page.locator(".frame-error")).toHaveCount(0);
});

test("EVENTS sits below the right edge of SHEGA without covering hero controls", async ({ page }, testInfo) => {
  await page.goto("/");
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1331, height: 650 },
    { width: 1331, height: 601 },
    { width: 1331, height: 537 },
    { width: 1920, height: 650 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await scrollToScreen(page, 0);
    await waitForFrame(page, "etfc", 1);
    const heading = page.getByRole("heading", { name: "SHEGA EVENTS", exact: true });
    await expect(heading).toBeInViewport({ ratio: 1 });
    await expect(page.locator(".intro-top > p")).toBeInViewport({ ratio: 1 });
    await expect(page.locator(".intro-top > .eyebrow")).toBeInViewport({ ratio: 1 });
    const layout = await heading.evaluate((element) => {
      const name = element.querySelector(".hero-brand-name");
      const descriptor = element.querySelector(".hero-brand-descriptor");
      const links = document.querySelector(".intro-bottom");
      const navigation = document.querySelector(".chapter-nav");
      const introTop = document.querySelector(".intro-top");
      const header = document.querySelector(".site-header");
      if (!name || !descriptor || !links || !navigation || !introTop || !header) throw new Error("Hero branding layout missing");
      return {
        name: name.getBoundingClientRect().toJSON(),
        descriptor: descriptor.getBoundingClientRect().toJSON(),
        linksTop: links.getBoundingClientRect().top,
        navTop: navigation.getBoundingClientRect().top,
        introTop: introTop.getBoundingClientRect().toJSON(),
        headerBottom: header.getBoundingClientRect().bottom,
        nameFontSize: parseFloat(getComputedStyle(name).fontSize),
        descriptorFontSize: parseFloat(getComputedStyle(descriptor).fontSize),
        hasOverflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(layout.descriptor.top).toBeGreaterThanOrEqual(layout.name.bottom);
    expect(Math.abs(layout.descriptor.right - layout.name.right)).toBeLessThan(1);
    expect(layout.descriptor.bottom).toBeLessThanOrEqual(layout.linksTop);
    expect(layout.descriptor.bottom).toBeLessThan(layout.navTop);
    expect(layout.descriptorFontSize).toBeLessThan(layout.nameFontSize / 4);
    expect(layout.introTop.top).toBeGreaterThanOrEqual(layout.headerBottom + 8);
    expect(layout.introTop.bottom).toBeLessThan(layout.name.top);
    expect(layout.hasOverflow).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`shega-events-${viewport.width}x${viewport.height}.png`) });
  }
  await scrollToScreen(page, 1.5);
  await waitForFrame(page, "etfc", 76);
  await expect(page.locator(".hero-intro")).toHaveCSS("opacity", "0");
});

test("desktop and mobile compositions keep the brand and five chapter controls visible", async ({ page }, testInfo) => {
  await page.goto("/");
  await waitForFrame(page, "etfc", 1);
  await expectCompactBrand(page.locator(".site-header .brand"), 64);
  const favicon = page.locator('link[rel="icon"][type="image/png"]');
  await expect(favicon).toHaveAttribute("sizes", "128x128");
  const iconUrl = await favicon.getAttribute("href");
  if (!iconUrl) throw new Error("Official favicon URL missing");
  const iconResponse = await page.request.get(iconUrl);
  expect(iconResponse.ok()).toBe(true);
  const iconBytes = await iconResponse.body();
  expect([iconBytes.readUInt32BE(16), iconBytes.readUInt32BE(20)]).toEqual([128, 128]);
  await expect(page.locator(".brand-symbol, .brand-registration, .brand-asterisk")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("desktop-hero.png") });
  await page.locator(".site-footer .brand").scrollIntoViewIfNeeded();
  await expectCompactBrand(page.locator(".site-footer .brand"), 56);
  await page.screenshot({ path: testInfo.outputPath("desktop-footer.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await scrollToScreen(page, 0);
  await waitForFrame(page, "etfc", 1);
  await expectCompactBrand(page.locator(".site-header .brand"), 56);
  const layout = await page.locator(".story-stage").evaluate((stage) => {
    const title = stage.querySelector("h1")?.getBoundingClientRect();
    const navigation = stage.querySelector(".chapter-nav")?.getBoundingClientRect();
    if (!title || !navigation) throw new Error("Hero composition missing");
    return { titleRight: title.right, navRight: navigation.right, navBottom: navigation.bottom, width: innerWidth, height: innerHeight };
  });
  expect(layout.titleRight).toBeLessThanOrEqual(layout.width);
  expect(layout.navRight).toBeLessThanOrEqual(layout.width);
  expect(layout.navBottom).toBeLessThanOrEqual(layout.height);
  await page.screenshot({ path: testInfo.outputPath("mobile-hero.png") });
  await page.locator(".site-footer .brand").scrollIntoViewIfNeeded();
  await expectCompactBrand(page.locator(".site-footer .brand"), 56);
  await page.screenshot({ path: testInfo.outputPath("mobile-footer.png") });
  await page.setViewportSize({ width: 844, height: 390 });
  await scrollToScreen(page, 0);
  await waitForFrame(page, "etfc", 1);
  await expectCompactBrand(page.locator(".site-header .brand"), 56);
  await page.screenshot({ path: testInfo.outputPath("landscape-hero.png") });
  await page.setViewportSize({ width: 1440, height: 900 });
  await scrollToScreen(page, 3 * 3.6 + 1.5);
  await waitForFrame(page, "yohana", 76);
  await page.screenshot({ path: testInfo.outputPath("yohanna-sequence.png") });
  await scrollToScreen(page, 4 * 3.6 + 1.5);
  await waitForFrame(page, "rophnan", 76);
  await page.screenshot({ path: testInfo.outputPath("rophnan-sequence.png") });
});

test("all standalone concepts open with event descriptions and retain a readable overview", async ({ page }) => {
  for (const [chapter, title] of eventTitles) {
    await page.goto(`/preview/${chapter}`);
    await waitForFrame(page, chapter, 1);
    await expect(page.locator(".scroll-story")).toHaveAttribute("data-introduction", "false");
    await expectCompactBrand(page.locator(".preview-header .brand"), 64);
    await expect(page.locator(".chapter-details")).toHaveCSS("opacity", "1");
    await expect(page.locator(".chapter-details")).toHaveJSProperty("inert", false);
    const overlay = page.locator(".event-details-overlay");
    await expect(overlay.getByRole("heading", { name: title, exact: true })).toBeVisible();
    if (chapter === "yohana") await expectUnobstructedYohanna(page);
    const overview = page.locator(".event-details-overview");
    await overview.scrollIntoViewIfNeeded();
    await expect(overview.getByRole("heading", { name: title, exact: true })).toBeInViewport();
    await expect(overview.locator(".event-source")).toBeInViewport();
    expect(await overview.locator(".event-description").innerText()).toBe(await overlay.locator(".event-description").innerText());
    if (chapter === "yohana") await expectYohannaPhoto(page);
  }
});

test("small mobile event panels remain legible without covering navigation", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  for (const [index, [chapter]] of eventTitles.entries()) {
    await scrollToScreen(page, index * 3.6 + 1.5);
    await waitForFrame(page, chapter, 76);
    const layout = await page.locator(".chapter-details").evaluate((panel) => {
      const footer = document.querySelector(".story-footer");
      if (!footer) throw new Error("Chapter navigation missing");
      return {
        top: panel.getBoundingClientRect().top,
        bottom: panel.getBoundingClientRect().bottom,
        footerTop: footer.getBoundingClientRect().top,
        scrollHeight: panel.scrollHeight,
        clientHeight: panel.clientHeight,
        viewportWidth: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      };
    });
    expect(layout.top).toBeGreaterThanOrEqual(82);
    expect(layout.bottom).toBeLessThanOrEqual(layout.footerTop);
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.scrollHeight).toBeLessThanOrEqual(layout.clientHeight + 1);
    await expect(page.locator(".event-details-overlay .event-source")).toBeInViewport();
    if (chapter === "yohana") {
      await expectUnobstructedYohanna(page);
      await page.screenshot({ path: testInfo.outputPath("small-mobile-yohanna-animation.png") });
    }
  }
  await page.screenshot({ path: testInfo.outputPath("small-mobile-event-details.png") });
});

test("Yohanna animation stays photo-free on phones while overview and gallery retain the photo", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/yohana");
  await waitForFrame(page, "yohana", 1);
  await expectUnobstructedYohanna(page);
  await expect(page.locator(".event-details-overlay .event-source")).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("yohanna-animation-portrait.png") });
  await expectYohannaPhoto(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await scrollToScreen(page, 1.5);
  await waitForFrame(page, "yohana", 76);
  await expectUnobstructedYohanna(page);
  await page.screenshot({ path: testInfo.outputPath("yohanna-animation-landscape.png") });
  await page.goto("/");
  const galleryPhoto = page.locator(".moment-halo-hawassa");
  await galleryPhoto.scrollIntoViewIfNeeded();
  await expect(galleryPhoto.getByRole("img")).toHaveAttribute("alt", /Yohanna smiling on stage at Halo Hawassa/);
  await expect(galleryPhoto.getByRole("link")).toHaveAttribute("href", "https://www.instagram.com/yohanaoriginal/p/DU6cP2yCkBV/?img_index=1");
  await expect.poll(() => galleryPhoto.getByRole("img").evaluate((element) => element instanceof HTMLImageElement && element.naturalWidth > 100)).toBe(true);
});
