import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { launch, openPage } from "../scripts/lib/capture.mjs";
import { startSite } from "../scripts/lib/site-server.mjs";

describe("mobile-first executive one-pager interactions", () => {
  let site;
  let browser;

  before(async () => {
    site = await startSite();
    browser = await launch("motion");
  });

  after(async () => {
    await browser?.close();
    await site?.close();
  });

  function pageFor(viewport = { width: 390, height: 844 }) {
    return openPage(browser, {
      url: site.url,
      viewport,
      fx: "motion",
    });
  }

  test("opening teaser stays focused and links into the partnership", async () => {
    const { page, context } = await pageFor();
    try {
      const hero = page.locator(".hero");
      assert.match((await hero.getByRole("heading", { level: 1 }).textContent()) ?? "", /We turn IP into worlds people can\s+play, collect, and grow\./);
      assert.equal(await hero.locator('.hero-orbit[aria-hidden="true"]').count(), 1);
      assert.equal(await hero.locator("img").count(), 0);
      assert.equal(await hero.locator("button").count(), 0);
      assert.equal(await hero.locator(".hero-scene-nav").count(), 0);
      assert.equal(await hero.getAttribute("data-scene"), null);
      assert.doesNotMatch((await hero.textContent()) ?? "", /Tetris|Apple Arcade|shipped together/i);

      const partnershipLink = hero.locator('a[href="#team"]');
      assert.equal(await partnershipLink.count(), 1);
      await partnershipLink.click();
      await page.waitForFunction(() => window.location.hash === "#team");
      assert.equal(await page.evaluate(() => window.location.hash), "#team");
      assert.equal(await page.locator("#team .leader-card").count(), 2);
    } finally {
      await context.close();
    }
  });

  test("wheel input scrolls the page instead of being captured by the hero", async () => {
    const { page, context } = await pageFor();
    try {
      assert.equal(await page.locator(".hero").getAttribute("data-scene"), null);
      assert.equal(await page.evaluate(() => window.scrollY), 0);
      await page.mouse.move(195, 420);
      await page.mouse.wheel(0, 520);
      await page.waitForTimeout(250);
      assert.ok(await page.evaluate(() => window.scrollY > 100), "wheel input did not move the document");
      assert.equal(await page.locator(".hero-scene-nav").count(), 0);
    } finally {
      await context.close();
    }
  });

  test("range tabs use roving focus and swap real evidence imagery", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#range").scrollIntoViewIfNeeded();
      const play = page.locator("#tab-play");
      await play.focus();

      await page.keyboard.press("ArrowRight");
      assert.equal(await page.evaluate(() => document.activeElement?.id), "tab-collect");
      assert.equal(await page.locator("#tab-collect").getAttribute("aria-selected"), "true");
      assert.match(await page.locator(".range-visual img").getAttribute("src"), /stone-raid-hires\.webp$/);

      await page.keyboard.press("End");
      assert.equal(await page.evaluate(() => document.activeElement?.id), "tab-grow");
      assert.match(await page.locator(".range-visual img").getAttribute("src"), /stone-chaotic-hires\.webp$/);

      await page.keyboard.press("Home");
      assert.equal(await page.evaluate(() => document.activeElement?.id), "tab-play");
      assert.match(await page.locator(".range-visual img").getAttribute("src"), /ultimate-rivals-hires\.webp$/);
      assert.ok(await page.locator(".range-visual img").getAttribute("alt"));
    } finally {
      await context.close();
    }
  });

  test("later Tetris proof opens a complete, viewport-safe disclosure and restores focus", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#proof").scrollIntoViewIfNeeded();
      const opener = page.locator("#proof").getByRole("button", { name: "Open the complete Tetris Beat joint case file" });
      assert.equal(await opener.count(), 1);
      await opener.click();
      const dialog = page.locator(".detail-dialog[open]");
      await dialog.waitFor({ state: "visible" });
      await page.waitForTimeout(320);

      assert.equal(await dialog.getAttribute("aria-modal"), "true");
      assert.equal(await dialog.getAttribute("aria-describedby"), "detail-summary");
      for (const heading of ["01 / The situation", "02 / Why it matters", "03 / How we lead it", "04 / Evidence in context"]) {
        assert.equal(await dialog.getByRole("heading", { name: heading }).count(), 1);
      }
      const dialogText = (await dialog.textContent()) ?? "";
      assert.doesNotMatch(dialogText, /Attribution note/i);
      assert.doesNotMatch(dialogText, /rather than independently audited product claims/i);

      const fits = await dialog.locator("[data-fit-check]").evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return rect.left >= 0 && rect.top >= 0 && rect.right <= window.innerWidth && rect.bottom <= window.innerHeight;
      });
      assert.equal(fits, true);

      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Open the complete Tetris Beat joint case file");
    } finally {
      await context.close();
    }
  });

  test("presentation navigation opens as a modal, navigates, and restores its trigger", async () => {
    const { page, context } = await pageFor();
    try {
      const trigger = page.getByRole("button", { name: "Open presentation navigation" });
      await trigger.click();
      const dialog = page.locator(".nav-dialog[open]");
      await dialog.waitFor({ state: "visible" });

      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      assert.equal(await dialog.getByRole("navigation", { name: "Presentation chapters" }).getByRole("link").count(), 5);
      assert.equal(await dialog.getByRole("link", { name: /Start a conversation/ }).count(), 1);

      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Open presentation navigation");
    } finally {
      await context.close();
    }
  });

  test("copy-email feedback is a dismissible viewport-safe live toast", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#contact").scrollIntoViewIfNeeded();
      await page.getByRole("button", { name: /Copy email/ }).click();
      const status = page.getByRole("status");
      await status.waitFor({ state: "visible" });
      assert.match(await status.textContent(), /Email/i);

      const toast = page.locator(".toast[data-fit-check]");
      const fits = await toast.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return rect.left >= 0 && rect.top >= 0 && rect.right <= window.innerWidth && rect.bottom <= window.innerHeight;
      });
      assert.equal(fits, true);

      await page.getByRole("button", { name: "Dismiss notification" }).click();
      await toast.waitFor({ state: "hidden" });
    } finally {
      await context.close();
    }
  });
});
