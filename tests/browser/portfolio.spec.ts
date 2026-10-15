import { expect, test } from "@playwright/test";

// Every photograph on the page comes from the collected Shega Events archive.
// The gallery must show exactly the photos we hold, with working credits, and the
// filter counts must be derived from those photos rather than hard-coded.
const PHOTO_COUNT = 24;
const CATEGORY_COUNTS = { "Bermel Fest": 4, Rophnan: 4, "Shega Events": 16 } as const;
const categoryTab = (page: import("@playwright/test").Page, label: string, count: number) =>
  page.locator("#gallery").getByRole("tab", { name: `${label} ${count}`, exact: true });

test("the gallery publishes every collected photograph with derived filter counts", async ({ page }, testInfo) => {
  await page.goto("/");
  const gallery = page.locator("#gallery");
  await gallery.scrollIntoViewIfNeeded();
  await expect(gallery.getByRole("tab", { name: `All moments ${PHOTO_COUNT}`, exact: true })).toBeVisible();
  for (const [label, count] of Object.entries(CATEGORY_COUNTS)) {
    await expect(categoryTab(page, label, count)).toBeVisible();
  }
  await expect(gallery.locator(".cf__counter")).toContainText(`/ ${PHOTO_COUNT}`);
  await expect(gallery.locator(".cf__crumb")).toContainText(`${PHOTO_COUNT} moments`);
  await page.screenshot({ path: testInfo.outputPath("gallery.png") });
});

test("carousel arrows step forward, stop at the last photo and wrap to the first", async ({ page }) => {
  await page.goto("/");
  const gallery = page.locator("#gallery");
  await gallery.scrollIntoViewIfNeeded();
  const caption = gallery.locator(".cf__caption");
  const next = gallery.getByRole("button", { name: "Next" });
  const previous = gallery.getByRole("button", { name: "Previous" });

  const first = await caption.innerText();
  await previous.click();
  await expect(caption).toHaveText(first); // wraps backwards to the last, then forward to the first

  const seen = new Set<string>([first]);
  for (let step = 0; step < PHOTO_COUNT - 2; step++) {
    await next.click();
    seen.add(await caption.innerText());
  }
  expect(seen.size).toBe(PHOTO_COUNT - 1); // every photo other than the last was distinct
  await next.click();
  await expect(caption).not.toHaveText(first);
  await next.click();
  await expect(caption).toHaveText(first);
});

test("every filter shows only its own photos and never an empty carousel", async ({ page }) => {
  await page.goto("/");
  const gallery = page.locator("#gallery");
  await gallery.scrollIntoViewIfNeeded();
  for (const [label, count] of Object.entries(CATEGORY_COUNTS)) {
    await categoryTab(page, label, count).click();
    await expect(gallery.locator(".cf__counter")).toContainText(`/ ${String(count).padStart(2, "0")}`);
    await expect(gallery.locator(".cf__crumb")).toContainText(String(count).padStart(2, "0"));
    await expect(gallery.locator(".cf__card.is-active")).toHaveCount(1);
  }
  await gallery.getByRole("tab", { name: `All moments ${PHOTO_COUNT}`, exact: true }).click();
  await expect(gallery.locator(".cf__counter")).toContainText(`/ ${PHOTO_COUNT}`);
});

test("the visible photo matches the credited original post", async ({ page }) => {
  await page.goto("/");
  const gallery = page.locator("#gallery");
  await gallery.scrollIntoViewIfNeeded();
  const card = gallery.locator(".cf__card.is-active");
  const image = card.locator("img");
  await expect.poll(() => image.evaluate((el) => el instanceof HTMLImageElement && el.naturalWidth > 100)).toBe(true);
  await expect(image).toHaveAttribute("src", /^\/events\//);
  const link = card.locator(".cf__foot");
  await expect(link).toHaveAttribute("href", /^https:\/\/www\.instagram\.com\//);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(card.locator(".cf__badge")).toContainText("@");
});

test("contact routes and footer point at the confirmed account only", async ({ page }) => {
  await page.goto("/");
  const contact = page.locator("#contact");
  await contact.scrollIntoViewIfNeeded();
  await expect(contact.locator(".shega-contact-info-row")).toHaveCount(1);
  await expect(contact.locator(".shega-contact-link")).toHaveAttribute("href", "https://www.instagram.com/shega_events/");
  // No invented email or phone may appear anywhere on the page.
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  const footer = page.locator(".shega-footer");
  await expect(footer.locator(".brand img")).toHaveAttribute("src", /shega-events-black\.jpg/);
  await expect(footer).not.toContainText(/Logo|Socials|other footers|Privacy policy/);
  await expect(footer.getByRole("link", { name: /@shega_events/ })).toHaveAttribute("href", "https://www.instagram.com/shega_events/");
});
