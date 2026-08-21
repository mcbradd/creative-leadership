import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { launch, openPage, settle } from "../scripts/lib/capture.mjs";
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
        /WE TURN IP INTO\s*WORLDS PEOPLE CAN\s*PLAY,\s*COLLECT,\s*AND GROW\./,
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
      assert.match((await page.locator(".presentation-cue").textContent()) ?? "", /Start a conversation/);
      assert.doesNotMatch((await page.locator(".presentation-cue").textContent()) ?? "", /\b\d{1,2}\s*\/\s*11\b/);
    } finally {
      await context.close();
    }
  });

  test("STONE leads the partnership sequence and each full card opens its profile", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#team").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const cards = page.locator("#team .leader-card");
      assert.equal(await cards.count(), 2);
      assert.deepEqual(await cards.locator("h3 b").allTextContents(), ["STONE", "BRADD"]);
      assert.match(await cards.first().locator("img").getAttribute("src"), /stone-portrait\.webp$/);
      assert.match(await cards.last().locator("img").getAttribute("src"), /bradd-headshot-2026\.webp$/);
      const triggers = cards.locator(":scope > .leader-card-trigger");
      assert.equal(await triggers.count(), 2);
      assert.deepEqual(await triggers.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label"))), [
        "Open complete profile for STONE Perales",
        "Open complete profile for BRADD McBrearty",
      ]);
      assert.equal(await cards.locator("button button, button a, a button").count(), 0);

      const stoneCard = cards.first();
      const stoneHit = stoneCard.getByRole("button", { name: "Open complete profile for STONE Perales" });
      const hitAreas = await triggers.evaluateAll((nodes) => nodes.map((node) => {
        const button = node.getBoundingClientRect();
        const card = node.parentElement.getBoundingClientRect();
        return {
          top: Math.abs(button.top - card.top),
          right: Math.abs(button.right - card.right),
          bottom: Math.abs(button.bottom - card.bottom),
          left: Math.abs(button.left - card.left),
        };
      }));
      assert.ok(hitAreas.every((area) => Object.values(area).every((delta) => delta <= 1)), JSON.stringify(hitAreas));
      await stoneHit.focus();
      const focusStyle = await stoneHit.evaluate((node) => {
        const style = getComputedStyle(node);
        return { width: style.outlineWidth, style: style.outlineStyle, offset: style.outlineOffset };
      });
      assert.deepEqual(focusStyle, { width: "2px", style: "solid", offset: "-3px" });
      await stoneHit.press("Enter");
      assert.equal((await page.locator(".detail-surface h1").textContent())?.trim(), "STONE Perales");
      await page.goBack({ waitUntil: "commit" }).catch(() => null);
      await page.locator(".detail-surface").waitFor({ state: "detached" });
      await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open complete profile for STONE Perales");
      assert.equal(await stoneHit.evaluate((node) => node === document.activeElement), true);

      const braddHit = cards.last().getByRole("button", { name: "Open complete profile for BRADD McBrearty" });
      await braddHit.focus();
      await braddHit.click({ position: { x: 8, y: 8 } });
      assert.equal((await page.locator(".detail-surface h1").textContent())?.trim(), "BRADD McBrearty");
      await page.goBack({ waitUntil: "commit" }).catch(() => null);
      await page.locator(".detail-surface").waitFor({ state: "detached" });
      await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open complete profile for BRADD McBrearty");
      assert.equal(await braddHit.evaluate((node) => node === document.activeElement), true);
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

  test("Tetris reel loops the exact muted segment behind keyboard-safe custom controls", async () => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "no-preference",
    });
    await context.addInitScript(() => {
      const calls = [];
      let events;
      let player;
      class Player {
        constructor(iframe, options) {
          events = options.events;
          player = this;
          this.iframe = iframe;
          setTimeout(() => events.onReady({ target: this }), 0);
        }

        destroy() {
          calls.push({ method: "destroy" });
        }

        getIframe() {
          return this.iframe;
        }

        loadVideoById(options) {
          calls.push({ method: "loadVideoById", options });
          queueMicrotask(() => events.onStateChange({ data: 1, target: this }));
        }

        mute() {
          calls.push({ method: "mute" });
        }

        pauseVideo() {
          calls.push({ method: "pauseVideo" });
          queueMicrotask(() => events.onStateChange({ data: 2, target: this }));
        }

        playVideo() {
          calls.push({ method: "playVideo" });
          queueMicrotask(() => events.onStateChange({ data: 1, target: this }));
        }

        unMute() {
          calls.push({ method: "unMute" });
        }
      }
      window.__tetrisHarness = {
        calls,
        emitEnded() {
          events.onStateChange({ data: 0, target: player });
        },
      };
      window.YT = {
        Player,
        PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2 },
      };
    });
    await context.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Mock YouTube player</title>",
    }));
    const page = await context.newPage();
    try {
      await page.goto(`${site.url}/?fx=motion`, { waitUntil: "load" });
      await settle(page);
      await page.locator("#proof").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const reel = page.locator("#proof .tetris-reel");
      const frame = reel.locator("iframe");
      await frame.waitFor({ state: "attached" });

      const src = new URL(await frame.getAttribute("src"));
      assert.equal(src.hostname, "www.youtube-nocookie.com");
      assert.equal(src.pathname, "/embed/-jCIo480M90");
      assert.equal(src.searchParams.get("enablejsapi"), "1");
      assert.equal(await frame.getAttribute("tabindex"), "-1");

      await page.waitForFunction(() => window.__tetrisHarness.calls.some((call) => call.method === "loadVideoById"));
      const startupCalls = await page.evaluate(() => window.__tetrisHarness.calls);
      const firstLoad = startupCalls.find((call) => call.method === "loadVideoById");
      assert.deepEqual(firstLoad.options, {
        videoId: "-jCIo480M90",
        startSeconds: 433,
        endSeconds: 460,
      });
      assert.ok(
        startupCalls.findIndex((call) => call.method === "mute") < startupCalls.findIndex((call) => call.method === "loadVideoById"),
        JSON.stringify(startupCalls),
      );

      const pause = reel.getByRole("button", { name: /^Pause clip$/i });
      const reload = reel.getByRole("button", { name: /^Reload clip$/i });
      const sound = reel.getByRole("button", { name: /^Sound off$/i });
      assert.equal(await pause.count(), 1);
      assert.equal(await reload.count(), 1);
      assert.equal(await sound.count(), 1, "the initial control state must expose that playback is muted");

      await pause.click();
      await page.waitForFunction(() => window.__tetrisHarness.calls.some((call) => call.method === "pauseVideo"));
      const play = reel.getByRole("button", { name: /^Play clip$/i });
      await play.waitFor({ state: "visible" });
      await play.click();
      await pause.waitFor({ state: "visible" });

      const loadsBeforeEnd = await page.evaluate(() => window.__tetrisHarness.calls.filter((call) => call.method === "loadVideoById").length);
      await page.evaluate(() => window.__tetrisHarness.emitEnded());
      await page.waitForFunction((count) => window.__tetrisHarness.calls.filter((call) => call.method === "loadVideoById").length === count + 1, loadsBeforeEnd);

      const loadsBeforeReload = await page.evaluate(() => window.__tetrisHarness.calls.filter((call) => call.method === "loadVideoById").length);
      await reload.click();
      await page.waitForFunction((count) => window.__tetrisHarness.calls.filter((call) => call.method === "loadVideoById").length === count + 1, loadsBeforeReload);
      const loads = await page.evaluate(() => window.__tetrisHarness.calls.filter((call) => call.method === "loadVideoById").map((call) => call.options));
      assert.ok(loads.every((options) => options.videoId === "-jCIo480M90" && options.startSeconds === 433 && options.endSeconds === 460), JSON.stringify(loads));
    } finally {
      await context.close();
    }
  });

  test("reduced motion replaces the autoplaying Tetris reel with an informative poster", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#proof").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const reel = page.locator("#proof .tetris-reel");
      await reel.waitFor({ state: "visible" });
      assert.equal(await reel.locator("iframe").count(), 0);
      const poster = reel.locator("img");
      assert.equal(await poster.count(), 1);
      assert.ok((await poster.getAttribute("alt"))?.trim(), "the reduced-motion poster needs a useful alternative");
    } finally {
      await context.close();
    }
  });

  test("ecosystem tabs swap one stage without creating a horizontal route", async () => {
    const { page, context } = await pageFor({ width: 1440, height: 900 });
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

      const stage = page.locator("#range .range-stage");
      const image = stage.locator(":scope > img");
      assert.equal(await stage.getAttribute("role"), "tabpanel");
      assert.equal(await stage.getAttribute("tabindex"), null);
      assert.equal(await image.locator("xpath=ancestor::a | ancestor::button").count(), 0);
      const transformBefore = await image.evaluate((node) => getComputedStyle(node).transform);
      await stage.hover({ position: { x: 12, y: 12 } });
      await page.waitForTimeout(800);
      const transformAfter = await image.evaluate((node) => getComputedStyle(node).transform);
      assert.equal(transformAfter, transformBefore, "the static range image must not zoom on hover");
    } finally {
      await context.close();
    }
  });

  test("partner and case selectors are compact, complete, and update one detail stage", async () => {
    const { page, context } = await pageFor({ width: 1440, height: 900 });
    try {
      await page.locator("#industry-proof").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const partners = page.locator("#industry-proof .partner-selector button");
      assert.equal(await partners.count(), 12);
      assert.equal(await partners.first().getAttribute("aria-pressed"), "true");
      await partners.nth(1).click();
      assert.equal(await partners.nth(1).getAttribute("aria-pressed"), "true");
      assert.notEqual((await page.locator(".partner-detail h3").textContent())?.trim(), "Apple");
      assert.equal(await page.locator("#industry-proof .partner-detail > small").count(), 0);
      assert.doesNotMatch(
        (await page.locator("#industry-proof .partner-controls").allTextContents()).join(" "),
        /\b\d{1,2}\s*\/\s*12\b/,
      );

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

  test("all twelve partner selectors use real image or vector marks without fallback codes", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#industry-proof").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const partners = page.locator("#industry-proof .partner-selector button");
      assert.equal(await partners.count(), 12);
      const partnerMarks = await partners.evaluateAll((buttons) => buttons.map((button) => {
        const visual = button.querySelector(":scope img, :scope svg");
        return {
          label: button.getAttribute("aria-label"),
          markCount: button.querySelectorAll(":scope img, :scope svg").length,
          fallbackText: button.textContent?.trim() ?? "",
          validImage: visual instanceof HTMLImageElement ? Boolean(visual.currentSrc || visual.src) : true,
          validVector: visual instanceof SVGElement ? Boolean(visual.querySelector("path, use, polygon, circle")) : true,
        };
      }));
      assert.ok(partnerMarks.every((item) => item.label && item.markCount === 1), JSON.stringify(partnerMarks));
      assert.ok(partnerMarks.every((item) => item.fallbackText === ""), JSON.stringify(partnerMarks));
      assert.ok(partnerMarks.every((item) => item.validImage && item.validVector), JSON.stringify(partnerMarks));
    } finally {
      await context.close();
    }
  });

  test("featured case localizes its copy overlay and never zooms the static image", async () => {
    const { page, context } = await pageFor({ width: 1440, height: 900 });
    try {
      await page.locator("#work").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));

      const featured = page.locator("#work .featured-case");
      const featuredImage = featured.locator(":scope > img");
      const transformBefore = await featuredImage.evaluate((node) => getComputedStyle(node).transform);
      await featured.hover({ position: { x: 12, y: 12 } });
      await page.waitForTimeout(800);
      const transformAfter = await featuredImage.evaluate((node) => getComputedStyle(node).transform);
      assert.equal(transformAfter, transformBefore, "the featured case must not imply clickability by zooming its image");

      const overlayReport = await featured.evaluate((card) => {
        const copy = card.querySelector(":scope > div");
        const cardBox = card.getBoundingClientRect();
        const copyBox = copy?.getBoundingClientRect();
        const copyStyle = copy ? getComputedStyle(copy) : null;
        const painted = [];
        for (const [targetName, target] of [["card", card], ["copy", copy]]) {
          if (!target) continue;
          for (const pseudo of ["::before", "::after"]) {
            const style = getComputedStyle(target, pseudo);
            const hasContent = style.content !== "none" && style.content !== "normal";
            const hasPaint = style.backgroundImage !== "none" || style.backgroundColor !== "rgba(0, 0, 0, 0)";
            if (!hasContent || !hasPaint || style.display === "none") continue;
            painted.push({
              target: targetName,
              pseudo,
              top: style.top,
              right: style.right,
              bottom: style.bottom,
              left: style.left,
            });
          }
        }
        return {
          painted,
          cardArea: cardBox.width * cardBox.height,
          copyArea: copyBox ? copyBox.width * copyBox.height : 0,
          copyHasPaint: Boolean(
            copyStyle
              && (copyStyle.backgroundImage !== "none" || copyStyle.backgroundColor !== "rgba(0, 0, 0, 0)"),
          ),
        };
      });
      assert.ok(overlayReport.copyHasPaint || overlayReport.painted.length > 0, JSON.stringify(overlayReport));
      assert.ok(
        overlayReport.copyArea > 0 && overlayReport.copyArea < overlayReport.cardArea * 0.7,
        "the overlay treatment must stay localized behind the copy",
      );
      assert.equal(
        overlayReport.painted.some((item) => item.target === "card" && item.top === "0px" && item.right === "0px" && item.bottom === "0px" && item.left === "0px"),
        false,
        "the featured overlay must not blanket the full image",
      );
      assert.ok(
        overlayReport.copyHasPaint
          || overlayReport.painted.some((item) => item.target === "copy" || [item.top, item.right, item.bottom, item.left].some((value) => value !== "0px" && value !== "auto")),
        JSON.stringify(overlayReport),
      );
    } finally {
      await context.close();
    }
  });

  test("detail banners present clean images above copy without generated overlays", async () => {
    const { page, context } = await pageFor({ width: 1440, height: 900 });
    try {
      await page.locator("#work").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      await page.locator("#work .featured-case .article-link").click();
      const article = page.locator(".detail-article");
      const banner = article.locator(".detail-hero");
      await banner.waitFor({ state: "visible" });
      const report = await article.evaluate((node) => {
        const hero = node.querySelector(".detail-hero");
        const image = hero?.querySelector("img");
        const copy = node.querySelector(".detail-copy");
        const heroBox = hero?.getBoundingClientRect();
        const copyBox = copy?.getBoundingClientRect();
        const imageStyle = image ? getComputedStyle(image) : null;
        return {
          before: hero ? getComputedStyle(hero, "::before").content : "none",
          after: hero ? getComputedStyle(hero, "::after").content : "none",
          filter: imageStyle?.filter,
          opacity: imageStyle?.opacity,
          transform: imageStyle?.transform,
          separated: Boolean(heroBox && copyBox && heroBox.bottom <= copyBox.top + 2),
        };
      });
      assert.ok(["none", "normal"].includes(report.before), JSON.stringify(report));
      assert.ok(["none", "normal"].includes(report.after), JSON.stringify(report));
      assert.equal(report.filter, "none");
      assert.equal(report.opacity, "1");
      assert.equal(report.transform, "none");
      assert.equal(report.separated, true, "detail copy must not overlay the banner image");
    } finally {
      await context.close();
    }
  });

  test("Crayola packaging renders as true transparent cutout assets", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator("#collaboration").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const cutouts = page.locator("#collaboration .collab-art img");
      assert.equal(await cutouts.count(), 2);
      const reports = await cutouts.evaluateAll(async (images) => Promise.all(images.map(async (image) => {
        await image.decode();
        const size = 128;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, size, size);
        const data = context.getImageData(0, 0, size, size).data;
        let transparentPixels = 0;
        for (let index = 3; index < data.length; index += 4) {
          if (data[index] < 255) transparentPixels += 1;
        }
        return {
          src: new URL(image.currentSrc || image.src).pathname,
          transparentPixels,
        };
      })));
      assert.ok(reports.every((item) => /\.(?:png|webp)$/i.test(item.src)), JSON.stringify(reports));
      assert.ok(reports.every((item) => item.transparentPixels > 0), JSON.stringify(reports));
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
      for (const heading of ["Situation", "How it was led", "Evidence and results", "Why it matters"]) {
        assert.equal(await article.getByText(heading, { exact: true }).count(), 1);
      }
      assert.equal(await article.getByText("Source context", { exact: true }).count(), 0);
      assert.equal(await article.locator(".source-note").count(), 0);
      assert.doesNotMatch(
        (await article.innerText()) ?? "",
        /self-reported|internal production record|public résumé|no endorsement|reported at/i,
      );

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
