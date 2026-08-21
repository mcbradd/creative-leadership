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
  ["mentorship", ".leadership-path"],
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
