import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { launch, openPage } from "../scripts/lib/capture.mjs";
import { startSite } from "../scripts/lib/site-server.mjs";

describe("mobile-first presentation interactions", () => {
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
    return openPage(browser, { url: site.url, viewport, fx: "motion" });
  }

  test("hero is a focused story with an optional simulation console", async () => {
    const { page, context } = await pageFor();
    try {
      const hero = page.locator("#top");
      assert.match(
        (await hero.getByRole("heading", { level: 1 }).textContent())?.replace(/\s+/g, " ") ?? "",
        /WE TURN IP INTO\s*WORLDS PEOPLE CAN\s*PLAY, COLLECT, AND GROW\./,
      );
      assert.equal(await hero.locator(".hero-universe[aria-hidden='true']").count(), 1);
      assert.equal(await hero.locator(".front-particles[aria-hidden='true'] i").count(), 4);
      assert.equal(await hero.locator(".hero-enter, .hero-signals, .hero-scene-nav").count(), 0);

      const toggle = hero.locator(".simulation-toggle");
      assert.equal((await toggle.textContent())?.trim(), "PLAY WITH THE SIMULATION");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      await toggle.click();
      assert.equal(await toggle.getAttribute("aria-expanded"), "true");
      assert.equal(await hero.locator(".hero-controls input[type='range']").count() > 0, true);
      assert.equal((await toggle.textContent())?.trim(), "RETURN TO THE STORY");
      await toggle.click();
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    } finally {
      await context.close();
    }
  });

  test("wheel input advances the single presentation scroll root", async () => {
    const { page, context } = await pageFor();
    try {
      const deck = page.locator("main.presentation");
      assert.equal(await deck.evaluate((node) => node.scrollTop), 0);
      assert.equal(await page.evaluate(() => window.scrollY), 0);
      await page.mouse.move(195, 420);
      await page.mouse.wheel(0, 620);
      await page.waitForTimeout(450);
      assert.ok(await deck.evaluate((node) => node.scrollTop > 100), "wheel input did not advance the presentation");
      assert.equal(await page.evaluate(() => window.scrollY), 0, "the document should not become a second scroll root");
    } finally {
      await context.close();
    }
  });

  test("Explore rolls down beneath the persistent header and Connect lands on contact", async () => {
    const { page, context } = await pageFor();
    try {
      const header = page.locator(".topbar");
      const explore = header.getByRole("button", { name: /EXPLORE/ });
      await explore.click();
      assert.equal(await explore.getAttribute("aria-expanded"), "true");

      const panel = page.locator(".explore-rollout.is-open");
      await panel.waitFor({ state: "visible" });
      assert.equal(await panel.getByRole("navigation", { name: "Explore the presentation" }).getByRole("button").count(), 6);
      const geometry = await page.evaluate(() => {
        const headerBox = document.querySelector(".topbar")?.getBoundingClientRect();
        const panelBox = document.querySelector(".explore-rollout.is-open")?.getBoundingClientRect();
        return { headerBottom: headerBox?.bottom ?? 0, panelTop: panelBox?.top ?? -1 };
      });
      assert.ok(Math.abs(geometry.panelTop - geometry.headerBottom) <= 2, JSON.stringify(geometry));

      await page.keyboard.press("Escape");
      assert.equal(await explore.getAttribute("aria-expanded"), "false");
      await header.getByRole("button", { name: /CONNECT/ }).click();
      await page.waitForFunction(() => document.querySelector("#contact")?.getBoundingClientRect().top === 0);
      assert.match((await page.locator(".presentation-cue").textContent()) ?? "", /11 \/ 11/);
    } finally {
      await context.close();
    }
  });

  test("both leader cards are static, simultaneous, and use the current BRADD portrait", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#team").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const cards = page.locator("#team .leader-card");
      assert.equal(await cards.count(), 2);
      assert.deepEqual(await cards.locator("h3 b").allTextContents(), ["BRADD", "STONE"]);
      assert.match(await cards.first().locator("img").getAttribute("src"), /bradd-headshot-2026\.webp$/);
      assert.equal(await page.locator("#team .leader-deck, #team .leader-deck-cue").count(), 0);
      const grid = await page.locator("#team .leader-grid").evaluate((node) => ({
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
      }));
      assert.ok(grid.scrollWidth <= grid.clientWidth + 1, JSON.stringify(grid));
    } finally {
      await context.close();
    }
  });

  test("ecosystem tabs swap one stage without creating a horizontal route", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#range").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const tabs = page.getByRole("tablist", { name: "Ecosystem lenses" }).getByRole("tab");
      assert.equal(await tabs.count(), 3);
      await tabs.nth(1).click();
      assert.equal(await tabs.nth(1).getAttribute("aria-selected"), "true");
      assert.match(await page.locator("#range [role='tabpanel'] img").getAttribute("src"), /stone-raid-hires\.webp$/);
      await tabs.nth(2).click();
      assert.match(await page.locator("#range [role='tabpanel'] img").getAttribute("src"), /stone-chaotic-hires\.webp$/);
      assert.equal(await page.locator("#range").getByRole("button", { name: /HERE'S HOW/ }).count(), 1);
    } finally {
      await context.close();
    }
  });

  test("partner and case selectors are compact, complete, and update one detail stage", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#industry-proof").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const partners = page.locator("#industry-proof .partner-selector button");
      assert.equal(await partners.count(), 12);
      assert.equal(await partners.first().getAttribute("aria-pressed"), "true");
      await partners.nth(1).click();
      assert.equal(await partners.nth(1).getAttribute("aria-pressed"), "true");
      assert.notEqual((await page.locator(".partner-detail h3").textContent())?.trim(), "Apple");

      await page.locator("#work").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const cases = page.locator("#work .case-selector button");
      assert.equal(await cases.count(), 6);
      const firstTitle = (await page.locator(".featured-case h3").textContent())?.trim();
      await cases.nth(1).click();
      assert.equal(await cases.nth(1).getAttribute("aria-pressed"), "true");
      assert.notEqual((await page.locator(".featured-case h3").textContent())?.trim(), firstTitle);
      assert.equal(await page.locator("#work").getByRole("button", { name: /OPEN COMPLETE CASE FILE/ }).count(), 1);
    } finally {
      await context.close();
    }
  });

  test("detail article is history-aware, scrollable, and restores its opener", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#proof").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const opener = page.locator("#proof .proof-case-link");
      await opener.focus();
      await opener.click();
      const article = page.locator(".detail-surface[role='dialog'] .detail-article");
      await article.waitFor({ state: "visible" });
      assert.equal(await page.locator(".site-chrome").getAttribute("inert"), "");
      const dialog = page.locator(".detail-surface[role='dialog']");
      await dialog.focus();
      await page.keyboard.press("Shift+Tab");
      assert.equal(await dialog.evaluate((node) => node.contains(document.activeElement)), true);
      assert.ok(await article.evaluate((node) => node.scrollHeight > node.clientHeight));
      assert.equal(await page.evaluate(() => history.state?.braddStoneDetail), true);
      for (const heading of ["Situation", "How it was led", "Evidence and results", "Why it matters", "Source context"]) {
        assert.equal(await article.getByText(heading, { exact: true }).count(), 1);
      }

      await page.goBack({ waitUntil: "commit" }).catch(() => null);
      await page.locator(".detail-surface").waitFor({ state: "detached" });
      assert.equal(await opener.evaluate((node) => node === document.activeElement), true);
    } finally {
      await context.close();
    }
  });

  test("copy email reports a viewport-safe live status", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#contact").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      await page.getByRole("button", { name: /COPY EMAIL/ }).click();
      const status = page.locator(".notice[role='status']");
      await page.waitForFunction(() => document.querySelector(".notice")?.classList.contains("is-visible"));
      assert.match((await status.textContent()) ?? "", /EMAIL|OPENING/);
      const fits = await status.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
      });
      assert.equal(fits, true);
    } finally {
      await context.close();
    }
  });
});
