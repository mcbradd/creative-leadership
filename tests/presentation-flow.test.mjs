import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { startSite } from "../scripts/lib/site-server.mjs";

const VIEWPORTS = [
  { name: "phone", width: 390, height: 844, micro: 10, body: 14, action: 11 },
  { name: "tablet", width: 768, height: 1024, micro: 11, body: 15, action: 12 },
  { name: "laptop", width: 1366, height: 768, micro: 12, body: 16, action: 12 },
  { name: "desktop", width: 1440, height: 900, micro: 12, body: 16, action: 12 },
  { name: "compact-phone", width: 320, height: 640, micro: 10, body: 14, action: 11, short: true },
  { name: "narrow-phone", width: 360, height: 640, micro: 10, body: 14, action: 11, short: true },
  { name: "short-landscape", width: 844, height: 390, micro: 11, body: 15, action: 12, short: true },
];

const SLIDES = [
  { id: "top", essentials: [".hero-copy", ".hero-console"] },
  { id: "capabilities", essentials: [".capability-lead", ".signal-strip"] },
  { id: "team", essentials: [".section-intro", ".leader-card"] },
  { id: "proof", essentials: [".proof-copy .text-action", ".proof-visual"] },
  { id: "range", essentials: [".range-head", ".range-tabs", ".range-visual", ".range-copy .text-action"] },
  { id: "industry-proof", essentials: [".industry-head", ".partner-nodes", ".partner-detail"] },
  { id: "work", essentials: [".work-head", ".case-card"] },
  { id: "collaboration", essentials: [".collab-copy .text-action", ".collab-art"] },
  { id: "depth", essentials: [".depth-head", ".timeline-head", ".timeline-row", ".supporting-card"] },
  { id: "mentorship", essentials: [".mentorship-copy blockquote", ".mentorship-ripple"] },
  { id: "contact", essentials: [".contact-actions", "footer"] },
];

const TYPE_SELECTORS = {
  micro: [
    ".section-index",
    ".project-kicker",
    ".leader-index",
    ".range-tabs button > span",
    ".range-tabs button > small",
    ".partner-nodes button > small",
    ".timeline-head span",
    ".mentor-columns h3",
    ".console-title",
    ".console-row",
    ".hero-readout",
    ".mask-count small",
  ],
  body: [
    ".section-intro > p:last-child",
    ".proof-copy > p:not(.section-index):not(.project-kicker):not(.proof-footnote)",
    ".range-head > p:last-child",
    ".industry-head > p:last-child",
    ".work-head > p:last-child",
    ".collab-copy > p:not(.section-index):not(.project-kicker)",
    ".depth-head > p:last-child",
    ".mentor-columns p",
  ],
  action: [
    ".top-cta",
    ".menu-button span",
    ".leader-open",
    ".text-action",
    ".case-open",
    ".mentor-columns span",
  ],
};

const EPSILON = 3;

function assertNear(actual, expected, label, tolerance = EPSILON) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: got ${actual.toFixed(1)}, expected ${expected.toFixed(1)} ±${tolerance}`);
}

test("the page behaves as a readable viewport presentation at canonical sizes", { timeout: 60_000 }, async () => {
  const site = await startSite();
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();

      try {
        await page.goto(`${site.url}/?fx=motion`, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(80);

        const deck = await page.evaluate(() => {
          const root = getComputedStyle(document.documentElement);
          const header = document.querySelector(".topbar")?.getBoundingClientRect();
          const cue = document.querySelector(".presentation-cue")?.getBoundingClientRect();
          return {
            snapType: root.scrollSnapType,
            scrollPaddingTop: Number.parseFloat(root.scrollPaddingTop),
            headerHeight: header?.height ?? 0,
            headerBottom: header?.bottom ?? 0,
            cueTop: cue?.top ?? innerHeight,
            currentCount: document.querySelectorAll('.presentation-cue [aria-current="step"]').length,
          };
        });

        assert.match(deck.snapType, viewport.short ? /^y(?: proximity)?$/ : /y mandatory/, `${viewport.name}: wrong vertical snap mode`);
        assert.ok(deck.headerHeight > 0, `${viewport.name}: fixed presentation chrome has no height`);
        assertNear(deck.scrollPaddingTop, deck.headerHeight, `${viewport.name}: scroll padding does not share the header token`, 1.5);
        assert.equal(deck.currentCount, 1, `${viewport.name}: cue must expose exactly one current slide`);

        for (const [index, slide] of SLIDES.entries()) {
          const section = page.locator(`#${slide.id}`);
          await section.evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
          await page.waitForTimeout(35);

          const report = await section.evaluate((node, essentials) => {
            const bounds = (element) => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return {
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
                display: style.display,
                visibility: style.visibility,
              };
            };
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            const shell = node.querySelector(":scope > .section-shell, :scope > .hero-shell");
            return {
              rect: bounds(node),
              clientHeight: node.clientHeight,
              scrollHeight: node.scrollHeight,
              overflowY: style.overflowY,
              snapAlign: style.scrollSnapAlign,
              snapStop: style.scrollSnapStop,
              shell: shell ? {
                ...bounds(shell),
                clientHeight: shell.clientHeight,
                scrollHeight: shell.scrollHeight,
              } : null,
              essentials: essentials.map((selector) => {
                const element = node.querySelector(selector);
                return { selector, ...(element ? bounds(element) : { missing: true }) };
              }),
              innerHeight,
              top: rect.top,
            };
          }, slide.essentials);

          const isHero = index === 0;
          const expectedHeight = isHero ? viewport.height : viewport.height - deck.headerHeight;
          const expectedTop = isHero ? 0 : deck.headerBottom;
          assertNear(report.rect.height, expectedHeight, `${viewport.name} #${slide.id} slide height`, 2);
          assertNear(report.top, expectedTop, `${viewport.name} #${slide.id} snap landing`, 4);
          assert.equal(report.snapAlign, "start", `${viewport.name} #${slide.id}: snap-align must be start`);
          assert.equal(report.snapStop, "always", `${viewport.name} #${slide.id}: snap-stop must be always`);
          assert.ok(report.shell, `${viewport.name} #${slide.id}: missing curated slide shell`);

          if (viewport.short && !isHero) {
            assert.equal(report.overflowY, "auto", `${viewport.name} #${slide.id}: short slide must be an internal reading pane`);
            assert.ok(report.scrollHeight >= report.clientHeight, `${viewport.name} #${slide.id}: invalid internal reading height`);
          } else {
            assert.ok(
              report.shell.scrollHeight <= report.shell.clientHeight + 4,
              `${viewport.name} #${slide.id}: shell clips ${(report.shell.scrollHeight - report.shell.clientHeight).toFixed(1)}px`,
            );

            for (const essential of report.essentials) {
              assert.equal(essential.missing, undefined, `${viewport.name} #${slide.id}: missing ${essential.selector}`);
              assert.notEqual(essential.display, "none", `${viewport.name} #${slide.id}: hides ${essential.selector}`);
              assert.notEqual(essential.visibility, "hidden", `${viewport.name} #${slide.id}: hides ${essential.selector}`);
              assert.ok(essential.width > 1 && essential.height > 1, `${viewport.name} #${slide.id}: ${essential.selector} has no area`);
              assert.ok(essential.left >= -EPSILON && essential.right <= viewport.width + EPSILON, `${viewport.name} #${slide.id}: ${essential.selector} escapes horizontally`);
              assert.ok(essential.top >= deck.headerBottom - EPSILON, `${viewport.name} #${slide.id}: ${essential.selector} starts behind the header`);
              assert.ok(essential.bottom <= deck.cueTop + EPSILON, `${viewport.name} #${slide.id}: ${essential.selector} sits under the slide cue`);
            }
          }
        }

        const undersized = await page.evaluate(({ selectors, floors }) => Object.entries(selectors).flatMap(([kind, queries]) =>
          queries.flatMap((selector) => [...document.querySelectorAll(selector)].flatMap((node) => {
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            if (style.display === "none" || style.visibility === "hidden" || rect.width < 1 || rect.height < 1) return [];
            const size = Number.parseFloat(style.fontSize);
            return size + 0.01 < floors[kind] ? [{ kind, selector, size, text: node.textContent?.replace(/\s+/g, " ").trim().slice(0, 42) }] : [];
          })),
        ), {
          selectors: TYPE_SELECTORS,
          floors: { micro: viewport.micro, body: viewport.body, action: viewport.action },
        });
        assert.deepEqual(undersized, [], `${viewport.name}: presentation type falls below its readable floor`);

        if (viewport.short) {
          await page.locator("#capabilities").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
          await page.waitForTimeout(40);
          const beforeWheel = await page.evaluate(() => scrollY);
          await page.mouse.move(viewport.width / 2, viewport.height / 2);
          for (let step = 0; step < 4; step += 1) await page.mouse.wheel(0, 700);
          await page.waitForTimeout(120);
          const afterWheel = await page.evaluate(() => scrollY);
          assert.ok(afterWheel > beforeWheel + 100, `${viewport.name}: an internal reading pane trapped wheel input at the slide boundary`);

          const collaboration = page.locator("#collaboration");
          await collaboration.evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
          await page.waitForFunction(() => document.querySelector(".presentation-cue")?.textContent?.includes("08 / 11"));
          await collaboration.evaluate((node) => { node.scrollTop = node.scrollHeight; });
          const cue = page.locator(".presentation-cue");
          await cue.getByRole("button", { name: "Next slide" }).click();
          await page.waitForFunction(() => document.querySelector(".presentation-cue")?.textContent?.includes("09 / 11"));
          await cue.getByRole("button", { name: "Previous slide" }).click();
          await page.waitForFunction(() => document.querySelector(".presentation-cue")?.textContent?.includes("08 / 11"));
          assert.equal(await collaboration.evaluate((node) => node.scrollTop), 0, `${viewport.name}: returning to a read slide did not reset it to the beginning`);
        }

        if (viewport.name === "phone") {
          const leaderDeck = page.getByRole("region", { name: /Leader profiles/ });
          await page.locator("#team").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
          await assert.doesNotReject(() => page.locator(".leader-deck-cue").waitFor({ state: "visible" }));
          await page.getByRole("button", { name: "Show STONE profile" }).click();
          await page.waitForTimeout(80);
          assert.ok(await leaderDeck.evaluate((node) => node.scrollLeft > node.clientWidth * 0.5), "phone: STONE profile has no discoverable horizontal route");

          await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
          await page.waitForTimeout(40);
          const cue = page.locator(".presentation-cue");
          await assert.doesNotReject(() => cue.getByText("01 / 11").waitFor({ state: "visible" }));
          await cue.getByRole("button", { name: "Next slide" }).click();
          await page.waitForFunction(() => document.querySelector(".presentation-cue")?.textContent?.includes("02 / 11"));
          const capabilityTop = await page.locator("#capabilities").evaluate((node) => node.getBoundingClientRect().top);
          assertNear(capabilityTop, deck.headerBottom, "phone: cue next control did not land on the next slide", 4);
          assert.equal(await page.evaluate(() => document.activeElement?.id), "capabilities", "phone: cue navigation did not move focus into the selected slide");
          await page.keyboard.press("Tab");
          assert.equal(await page.evaluate(() => document.activeElement?.closest("#capabilities")?.id), "capabilities", "phone: tab order did not continue through the selected slide");
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await site.close();
  }
});
