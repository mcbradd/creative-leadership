import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { launch, openPage } from "../scripts/lib/capture.mjs";
import { startSite } from "../scripts/lib/site-server.mjs";

const EPSILON = 2;
const VIEWPORTS = [
  ["short phone", { width: 390, height: 650 }],
  ["phone", { width: 440, height: 956 }],
  ["desktop", { width: 1440, height: 900 }],
];

const SLIDES = [
  ["top", ".hero-story h1"],
  ["capabilities", ".capability-list"],
  ["team", ".leader-grid"],
  ["proof", ".proof-metrics"],
  ["range", ".range-stage"],
  ["industry-proof", ".partner-selector"],
  ["work", ".case-selector"],
  ["collaboration", ".collab-roles"],
  ["depth", ".depth-board"],
  ["mentorship", ".leadership-practices"],
  ["contact", ".contact-actions"],
];

function overlap(a, b) {
  return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}

describe("one-viewport presentation layout", () => {
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

  test("all overview slides occupy one clipped viewport with no nested scroll route", async () => {
    for (const [name, viewport] of VIEWPORTS) {
      const { page, context } = await openPage(browser, { url: site.url, viewport, fx: "motion" });
      try {
        assert.equal(await page.locator("main.presentation > section.presentation-slide").count(), 11, `${name}: slide count`);
        const deck = await page.locator("main.presentation").evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            clientHeight: node.clientHeight,
            clientWidth: node.clientWidth,
            scrollHeight: node.scrollHeight,
            overflowX: style.overflowX,
            overflowY: style.overflowY,
          };
        });
        assert.equal(deck.clientHeight, viewport.height, `${name}: deck height`);
        assert.equal(deck.overflowY, "auto", `${name}: deck is not the vertical scroll root`);
        assert.equal(deck.overflowX, "hidden", `${name}: deck permits horizontal scrolling`);
        assert.ok(Math.abs(deck.scrollHeight - viewport.height * 11) <= 11 * EPSILON, `${name}: deck is not eleven viewports tall`);

        for (const [id, essentialSelector] of SLIDES) {
          const slide = page.locator(`#${id}`);
          await slide.evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
          const report = await slide.evaluate((node, selector) => {
            const style = getComputedStyle(node);
            const box = node.getBoundingClientRect();
            const shell = node.querySelector(".slide-shell");
            const essential = node.querySelector(selector);
            const shellBox = shell?.getBoundingClientRect();
            const essentialBox = essential?.getBoundingClientRect();
            return {
              height: box.height,
              top: box.top,
              overflowX: style.overflowX,
              overflowY: style.overflowY,
              clientWidth: node.clientWidth,
              scrollWidth: node.scrollWidth,
              clientHeight: node.clientHeight,
              shell: shell ? {
                clientHeight: shell.clientHeight,
                scrollHeight: shell.scrollHeight,
                left: shellBox.left,
                right: shellBox.right,
              } : null,
              essential: essentialBox ? {
                top: essentialBox.top,
                bottom: essentialBox.bottom,
                left: essentialBox.left,
                right: essentialBox.right,
              } : null,
            };
          }, essentialSelector);

          assert.ok(Math.abs(report.height - viewport.height) <= EPSILON, `${name} #${id}: ${report.height}px tall`);
          assert.ok(Math.abs(report.top) <= EPSILON, `${name} #${id}: did not land at viewport top`);
          assert.equal(report.overflowX, "clip", `${name} #${id}: horizontal overflow is not clipped`);
          assert.equal(report.overflowY, "clip", `${name} #${id}: vertical overflow is not clipped`);
          // Decorative hero particles and off-canvas transitions may extend the
          // section's scrollWidth; overflow: clip keeps them out of the gesture
          // model. Interactive subdecks are checked independently below.
          assert.ok(report.shell, `${name} #${id}: missing slide shell`);
          assert.ok(report.shell.scrollHeight <= report.shell.clientHeight + EPSILON, `${name} #${id}: shell content is clipped by ${report.shell.scrollHeight - report.shell.clientHeight}px`);
          assert.ok(report.essential, `${name} #${id}: missing ${essentialSelector}`);
          assert.ok(report.essential.left >= -EPSILON && report.essential.right <= viewport.width + EPSILON, `${name} #${id}: ${essentialSelector} escapes horizontally`);
        }

        const documentWidth = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
        }));
        assert.ok(documentWidth.scrollWidth <= documentWidth.clientWidth + EPSILON, `${name}: document horizontal overflow`);
        assert.ok(documentWidth.bodyWidth <= documentWidth.clientWidth + EPSILON, `${name}: body horizontal overflow`);
      } finally {
        await context.close();
      }
    }
  });

  test("header and cue stay separate from slide essentials", async () => {
    for (const [name, viewport] of VIEWPORTS) {
      const { page, context } = await openPage(browser, { url: site.url, viewport, fx: "motion" });
      try {
        for (const [id, selector] of SLIDES) {
          await page.locator(`#${id}`).evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
          const boxes = await page.evaluate(({ id, selector }) => {
            const rect = (value) => {
              const box = value.getBoundingClientRect();
              return { top: box.top, right: box.right, bottom: box.bottom, left: box.left };
            };
            return {
              header: rect(document.querySelector(".topbar")),
              cue: rect(document.querySelector(".presentation-cue")),
              essential: rect(document.querySelector(`#${id} ${selector}`)),
            };
          }, { id, selector });
          assert.equal(overlap(boxes.header, boxes.essential), 0, `${name} #${id}: header overlaps ${selector}`);
          assert.equal(overlap(boxes.cue, boxes.essential), 0, `${name} #${id}: cue overlaps ${selector}`);
        }
      } finally {
        await context.close();
      }
    }
  });

  test("Proven Together gives the 16:9 Tetris reel a large right-hand desktop stage and a contained mobile stage", async () => {
    const proofViewports = [
      ["short phone", { width: 390, height: 650 }],
      ["phone", { width: 440, height: 956 }],
      ["desktop", { width: 1440, height: 900 }],
    ];

    for (const [name, viewport] of proofViewports) {
      const { page, context } = await openPage(browser, { url: site.url, viewport, fx: "motion" });
      try {
        const proof = page.locator("#proof");
        await proof.evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
        const report = await proof.evaluate((slide) => {
          const rect = (node) => {
            const box = node.getBoundingClientRect();
            return { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height };
          };
          const heading = slide.querySelector(".slide-heading");
          const metrics = slide.querySelector(".proof-metrics");
          const grid = slide.querySelector(".proof-grid");
          const reel = slide.querySelector(".proof-reel");
          const stage = slide.querySelector(".tetris-reel__stage");
          const header = document.querySelector(".topbar");
          const cue = document.querySelector(".presentation-cue");
          return {
            heading: rect(heading),
            metrics: rect(metrics),
            stage: rect(stage),
            header: rect(header),
            cue: rect(cue),
            grid: {
              clientWidth: grid.clientWidth,
              clientHeight: grid.clientHeight,
              scrollHeight: grid.scrollHeight,
            },
            reel: {
              clientWidth: reel.clientWidth,
              scrollWidth: reel.scrollWidth,
              clientHeight: reel.clientHeight,
              scrollHeight: reel.scrollHeight,
            },
            stageOverflow: getComputedStyle(stage).overflow,
            documentWidth: document.documentElement.scrollWidth,
          };
        });

        const aspectRatio = report.stage.width / report.stage.height;
        assert.ok(Math.abs(aspectRatio - (16 / 9)) <= 0.04, `${name}: stage ratio is ${aspectRatio}`);
        assert.ok(report.stage.top >= report.header.bottom - EPSILON, `${name}: reel stage is behind the header`);
        assert.ok(report.stage.bottom <= report.cue.top + EPSILON, `${name}: reel stage is behind the presentation cue`);
        assert.ok(report.stage.left >= -EPSILON && report.stage.right <= viewport.width + EPSILON, `${name}: reel stage escapes horizontally`);
        assert.equal(report.stageOverflow, "hidden", `${name}: stage does not clip its player/poster media`);
        assert.ok(report.grid.scrollHeight <= report.grid.clientHeight + EPSILON, `${name}: proof grid overflows vertically ${JSON.stringify(report.grid)}`);
        assert.ok(report.reel.scrollWidth <= report.reel.clientWidth + EPSILON, `${name}: reel creates horizontal overflow ${JSON.stringify(report.reel)}`);
        assert.ok(report.reel.scrollHeight <= report.reel.clientHeight + EPSILON, `${name}: reel creates vertical overflow ${JSON.stringify(report.reel)}`);
        assert.ok(report.documentWidth <= viewport.width + EPSILON, `${name}: reel creates document overflow`);

        if (name === "desktop") {
          assert.ok(report.stage.left >= report.heading.right + EPSILON, "desktop: reel must sit to the right of the slide heading");
          assert.ok(report.stage.left >= report.metrics.right + EPSILON, "desktop: reel must sit to the right of the metrics");
          assert.ok(report.stage.height >= 300, `desktop: reel stage is only ${report.stage.height}px tall`);
        }
      } finally {
        await context.close();
      }
    }
  });

  test("desktop hero punctuation stays unclipped and slide titles keep the lighter-white, bolder-signal hierarchy", async () => {
    const { page, context } = await openPage(browser, {
      url: site.url,
      viewport: { width: 1440, height: 900 },
      fx: "motion",
    });
    try {
      const heroTypography = await page.locator("#top").evaluate((hero) => {
        const payoff = hero.querySelector(".hero-payoff");
        const heroBox = hero.getBoundingClientRect();
        const explicitLines = Array.from(payoff.querySelectorAll(".hero-payoff-line"));
        const fragments = (explicitLines.length > 0
          ? explicitLines.map((line) => line.getBoundingClientRect())
          : Array.from(payoff.getClientRects()))
          .filter((rect) => rect.width > 0 && rect.height > 0)
          .map((rect) => ({ top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left }));
        const lines = [];
        for (const fragment of fragments.sort((a, b) => a.top - b.top || a.left - b.left)) {
          const line = lines.find((candidate) => Math.abs(candidate.top - fragment.top) <= 1);
          if (line) {
            line.top = Math.min(line.top, fragment.top);
            line.right = Math.max(line.right, fragment.right);
            line.bottom = Math.max(line.bottom, fragment.bottom);
            line.left = Math.min(line.left, fragment.left);
          } else {
            lines.push({ ...fragment });
          }
        }

        const walker = document.createTreeWalker(payoff, NodeFilter.SHOW_TEXT);
        let lastText = null;
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (node.textContent?.trim()) lastText = node;
        }
        const periodIndex = lastText?.textContent?.lastIndexOf(".") ?? -1;
        const periodRange = document.createRange();
        if (lastText && periodIndex >= 0) {
          periodRange.setStart(lastText, periodIndex);
          periodRange.setEnd(lastText, periodIndex + 1);
        }
        const period = periodIndex >= 0 ? periodRange.getBoundingClientRect() : null;
        const clippingAncestors = [];
        for (let node = payoff.parentElement; node && node !== document.body; node = node.parentElement) {
          const style = getComputedStyle(node);
          if ([style.overflow, style.overflowX, style.overflowY].some((value) => value === "hidden" || value === "clip")) {
            const box = node.getBoundingClientRect();
            clippingAncestors.push({ top: box.top, right: box.right, bottom: box.bottom, left: box.left });
          }
        }
        return {
          hero: { top: heroBox.top, right: heroBox.right, bottom: heroBox.bottom, left: heroBox.left },
          lines,
          period: period ? { top: period.top, right: period.right, bottom: period.bottom, left: period.left, width: period.width } : null,
          clippingAncestors,
        };
      });

      assert.ok(heroTypography.period && heroTypography.period.width > 0, JSON.stringify(heroTypography));
      assert.ok(heroTypography.period.left >= heroTypography.hero.left - EPSILON, JSON.stringify(heroTypography));
      assert.ok(heroTypography.period.right <= heroTypography.hero.right + EPSILON, JSON.stringify(heroTypography));
      assert.ok(heroTypography.period.top >= heroTypography.hero.top - EPSILON, JSON.stringify(heroTypography));
      assert.ok(heroTypography.period.bottom <= heroTypography.hero.bottom + EPSILON, JSON.stringify(heroTypography));
      assert.ok(
        heroTypography.clippingAncestors.every((box) => heroTypography.period.left >= box.left - EPSILON && heroTypography.period.right <= box.right + EPSILON && heroTypography.period.top >= box.top - EPSILON && heroTypography.period.bottom <= box.bottom + EPSILON),
        JSON.stringify(heroTypography),
      );
      for (let index = 1; index < heroTypography.lines.length; index += 1) {
        assert.ok(
          heroTypography.lines[index].top >= heroTypography.lines[index - 1].bottom - EPSILON,
          `hero payoff lines overlap: ${JSON.stringify(heroTypography.lines)}`,
        );
      }

      const hierarchy = await page.locator(".hero-story h1, .slide-heading h2").evaluateAll((headings) => headings.map((heading) => {
        const signal = heading.querySelector(".signal-flow");
        const white = getComputedStyle(heading);
        const accent = getComputedStyle(signal);
        const trackingInEm = (style) => {
          if (style.letterSpacing === "normal") return 0;
          return Number.parseFloat(style.letterSpacing) / Number.parseFloat(style.fontSize);
        };
        return {
          text: heading.textContent?.replace(/\s+/g, " ").trim(),
          whiteWeight: Number.parseFloat(white.fontWeight),
          signalWeight: Number.parseFloat(accent.fontWeight),
          whiteTrackingEm: trackingInEm(white),
          signalTrackingEm: trackingInEm(accent),
        };
      }));
      assert.ok(hierarchy.length >= 10, JSON.stringify(hierarchy));
      for (const title of hierarchy) {
        assert.ok(title.whiteWeight < title.signalWeight, JSON.stringify(title));
        assert.ok(title.whiteTrackingEm >= -0.041, JSON.stringify(title));
        assert.ok(title.signalTrackingEm >= -0.041, JSON.stringify(title));
      }
    } finally {
      await context.close();
    }
  });

  test("static leader, depth, partner, and case structures have no horizontal scroll", async () => {
    for (const [name, viewport] of VIEWPORTS) {
      const { page, context } = await openPage(browser, { url: site.url, viewport, fx: "motion" });
      try {
        for (const selector of [
          "#team .leader-grid",
          "#depth .depth-board",
          "#depth .supporting-grid",
          "#industry-proof .partner-selector",
          "#work .case-selector",
        ]) {
          const report = await page.locator(selector).evaluate((node) => ({
            clientWidth: node.clientWidth,
            scrollWidth: node.scrollWidth,
            overflowX: getComputedStyle(node).overflowX,
          }));
          assert.ok(report.scrollWidth <= report.clientWidth + EPSILON, `${name} ${selector}: horizontal scroll route`);
          assert.notEqual(report.overflowX, "auto", `${name} ${selector}: overflow-x auto`);
          assert.notEqual(report.overflowX, "scroll", `${name} ${selector}: overflow-x scroll`);
        }
        assert.equal(await page.locator("#team .leader-card").count(), 2, `${name}: both leaders must render`);
        assert.equal(await page.locator("#industry-proof .partner-selector button").count(), 12, `${name}: partner selector count`);
        assert.equal(await page.locator("#work .case-selector button").count(), 6, `${name}: case selector count`);
      } finally {
        await context.close();
      }
    }
  });

  test("detail article becomes the sole content scroller and keeps its sticky close bar visible", async () => {
    for (const [name, viewport] of VIEWPORTS) {
      const { page, context } = await openPage(browser, { url: site.url, viewport, fx: "motion" });
      try {
        await page.locator("#capabilities").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
        await page.locator("#capabilities .capability-list button").first().click();
        const surface = page.locator(".detail-surface");
        const article = surface.locator(".detail-article");
        await surface.waitFor({ state: "visible" });

        const report = await article.evaluate((node) => ({
          clientHeight: node.clientHeight,
          scrollHeight: node.scrollHeight,
          overflowX: getComputedStyle(node).overflowX,
          overflowY: getComputedStyle(node).overflowY,
        }));
        assert.equal(report.clientHeight, viewport.height, `${name}: detail article is not viewport height`);
        assert.equal(report.overflowY, "auto", `${name}: detail article does not scroll`);
        assert.equal(report.overflowX, "hidden", `${name}: detail article scrolls horizontally`);
        assert.ok(report.scrollHeight > report.clientHeight, `${name}: complete detail article has no reading scroll`);

        const barBefore = await surface.locator(".detail-bar").evaluate((node) => node.getBoundingClientRect().top);
        await article.evaluate((node) => { node.scrollTop = node.scrollHeight; });
        const barAfter = await surface.locator(".detail-bar").evaluate((node) => node.getBoundingClientRect().top);
        assert.ok(Math.abs(barBefore - barAfter) <= EPSILON, `${name}: detail close bar is not sticky`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollTop), 0, `${name}: document became a detail scroller`);
        await surface.getByRole("button", { name: "Close article" }).click();
        await surface.waitFor({ state: "detached" });
      } finally {
        await context.close();
      }
    }
  });
});
