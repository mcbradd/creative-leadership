import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { launch, openPage } from "../scripts/lib/capture.mjs";
import { startSite } from "../scripts/lib/site-server.mjs";

const SLIDES = [
  ["top", "Superpowers combined"],
  ["capabilities", "Leadership lenses"],
  ["team", "The partnership"],
  ["proof", "Proven together"],
  ["range", "The whole ecosystem"],
  ["industry-proof", "Industry proof"],
  ["work", "Selected case files"],
  ["collaboration", "Physical to interactive"],
  ["depth", "Individual depth"],
  ["mentorship", "Leadership after launch"],
  ["contact", "Start a conversation"],
];

describe("presentation flow", () => {
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

  for (const [name, viewport] of [
    ["phone", { width: 390, height: 844 }],
    ["desktop", { width: 1440, height: 900 }],
  ]) {
    test(`${name} has one vertical gesture axis and deterministic snap landings`, async () => {
      const { page, context } = await openPage(browser, { url: site.url, viewport, fx: "motion" });
      try {
        const deck = page.locator("main.presentation");
        const deckStyle = await deck.evaluate((node) => {
          const style = getComputedStyle(node);
          return { snap: style.scrollSnapType, overflowX: style.overflowX, overflowY: style.overflowY };
        });
        assert.match(deckStyle.snap, /^y\s+mandatory$/);
        assert.equal(deckStyle.overflowX, "hidden");
        assert.equal(deckStyle.overflowY, "auto");

        for (const [index, [id, label]] of SLIDES.entries()) {
          const section = page.locator(`#${id}`);
          await section.evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
          await page.waitForFunction(
            ({ id, number, label }) => {
              const box = document.getElementById(id)?.getBoundingClientRect();
              const cue = document.querySelector(".presentation-cue")?.textContent ?? "";
              return Math.abs(box?.top ?? 999) <= 2 && cue.includes(number) && cue.includes(label);
            },
            { id, number: `${String(index + 1).padStart(2, "0")} / 11`, label },
          );

          const report = await section.evaluate((node) => {
            const box = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            return {
              top: box.top,
              bottom: box.bottom,
              height: box.height,
              snapAlign: style.scrollSnapAlign,
              snapStop: style.scrollSnapStop,
              overflowX: style.overflowX,
              overflowY: style.overflowY,
            };
          });
          assert.ok(Math.abs(report.top) <= 2, `${name} #${id}: top ${report.top}`);
          assert.ok(Math.abs(report.bottom - viewport.height) <= 2, `${name} #${id}: next slide peeks into viewport`);
          assert.ok(Math.abs(report.height - viewport.height) <= 2, `${name} #${id}: not one viewport tall`);
          assert.equal(report.snapAlign, "start");
          assert.equal(report.snapStop, "always");
          assert.equal(report.overflowX, "clip");
          assert.equal(report.overflowY, "clip");
        }
      } finally {
        await context.close();
      }
    });
  }

  test("cue advances one slide at a time without programmatically focusing slide content", async () => {
    const { page, context } = await openPage(browser, {
      url: site.url,
      viewport: { width: 390, height: 844 },
      fx: "motion",
    });
    try {
      const cue = page.locator(".presentation-cue");
      assert.match((await cue.textContent()) ?? "", /01 \/ 11\s*Superpowers combined/);
      assert.equal(await cue.getByRole("button", { name: "First slide" }).isDisabled(), true);

      const next = cue.getByRole("button", { name: "Next slide: Leadership lenses" });
      await next.click();
      await page.waitForFunction(() => document.querySelector(".presentation-cue")?.textContent?.includes("02 / 11"));
      assert.ok(Math.abs(await page.locator("#capabilities").evaluate((node) => node.getBoundingClientRect().top)) <= 2);
      assert.notEqual(await page.evaluate(() => document.activeElement?.id), "capabilities", "pointer navigation must not create an automatic blue focus ring on the slide");

      const previous = cue.getByRole("button", { name: "Previous slide: Superpowers combined" });
      await previous.click();
      await page.waitForFunction(() => document.querySelector(".presentation-cue")?.textContent?.includes("01 / 11"));
      assert.ok(Math.abs(await page.locator("#top").evaluate((node) => node.getBoundingClientRect().top)) <= 2);
    } finally {
      await context.close();
    }
  });

  test("overview components never create secondary horizontal gesture tracks", async () => {
    const { page, context } = await openPage(browser, {
      url: site.url,
      viewport: { width: 390, height: 844 },
      fx: "motion",
    });
    try {
      const reports = await page.evaluate(() => {
        const selectors = [
          ".leader-grid",
          ".depth-board",
          ".supporting-grid",
          ".partner-selector",
          ".case-selector",
          ".range-tabs",
          ".proof-metrics",
        ];
        return selectors.map((selector) => {
          const node = document.querySelector(selector);
          const style = getComputedStyle(node);
          return {
            selector,
            clientWidth: node.clientWidth,
            scrollWidth: node.scrollWidth,
            overflowX: style.overflowX,
            snapType: style.scrollSnapType,
          };
        });
      });
      for (const report of reports) {
        assert.ok(report.scrollWidth <= report.clientWidth + 2, `${report.selector} has a horizontal route`);
        assert.notEqual(report.overflowX, "auto", `${report.selector} uses overflow-x auto`);
        assert.notEqual(report.overflowX, "scroll", `${report.selector} uses overflow-x scroll`);
        assert.doesNotMatch(report.snapType, /^x\b/, `${report.selector} uses horizontal snap`);
      }
    } finally {
      await context.close();
    }
  });
});
