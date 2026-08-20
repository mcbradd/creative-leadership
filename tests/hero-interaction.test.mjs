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

  test("four explicit chapter buttons select a complete opening argument", async () => {
    const { page, context } = await pageFor();
    try {
      const hero = page.locator(".hero");
      const buttons = page.locator(".hero-scene-nav button");
      assert.equal(await buttons.count(), 4);
      assert.equal(await hero.getAttribute("data-scene"), "proposition");

      for (const [index, expected] of [
        [0, ["proposition", "One accountable creative system."]],
        [1, ["partnership", "Two leaders. Equal weight."]],
        [2, ["translation", "Play. Collect. Grow."]],
        [3, ["proof", "Already proven under pressure."]],
      ]) {
        await buttons.nth(index).click();
        assert.equal(await hero.getAttribute("data-scene"), expected[0]);
        assert.equal(await buttons.nth(index).getAttribute("aria-pressed"), "true");
        assert.equal(await page.locator(".hero-art-caption strong").textContent(), expected[1]);
      }
    } finally {
      await context.close();
    }
  });

  test("chapter buttons support Arrow, Home, and End keyboard navigation", async () => {
    const { page, context } = await pageFor();
    try {
      const hero = page.locator(".hero");
      const buttons = page.locator(".hero-scene-nav button");
      await buttons.nth(0).focus();

      await page.keyboard.press("ArrowRight");
      assert.equal(await hero.getAttribute("data-scene"), "partnership");
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), await buttons.nth(1).getAttribute("aria-label"));

      await page.keyboard.press("ArrowDown");
      assert.equal(await hero.getAttribute("data-scene"), "translation");
      await page.keyboard.press("End");
      assert.equal(await hero.getAttribute("data-scene"), "proof");
      await page.keyboard.press("Home");
      assert.equal(await hero.getAttribute("data-scene"), "proposition");
      await page.keyboard.press("ArrowLeft");
      assert.equal(await hero.getAttribute("data-scene"), "proof");
      await page.keyboard.press("ArrowUp");
      assert.equal(await hero.getAttribute("data-scene"), "translation");
    } finally {
      await context.close();
    }
  });

  test("wheel input scrolls the page instead of being captured by the hero", async () => {
    const { page, context } = await pageFor();
    try {
      assert.equal(await page.locator(".hero").getAttribute("data-scene"), "proposition");
      assert.equal(await page.evaluate(() => window.scrollY), 0);
      await page.mouse.move(195, 420);
      await page.mouse.wheel(0, 520);
      await page.waitForTimeout(250);
      assert.ok(await page.evaluate(() => window.scrollY > 100), "wheel input did not move the document");
      assert.equal(await page.locator(".hero").getAttribute("data-scene"), "proposition");
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

  test("hero case affordance opens a complete, viewport-safe disclosure and restores focus", async () => {
    const { page, context } = await pageFor();
    try {
      const opener = page.getByRole("button", { name: "Open the complete Tetris Beat joint case file" }).first();
      await opener.click();
      const dialog = page.locator(".detail-dialog[open]");
      await dialog.waitFor({ state: "visible" });
      await page.waitForTimeout(320);

      assert.equal(await dialog.getAttribute("aria-modal"), "true");
      assert.equal(await dialog.getAttribute("aria-describedby"), "detail-summary");
      for (const heading of ["01 / The situation", "02 / Why it matters", "03 / How we lead it", "04 / Evidence in context"]) {
        assert.equal(await dialog.getByRole("heading", { name: heading }).count(), 1);
      }
      assert.match(await dialog.textContent(), /Attribution note/);

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
