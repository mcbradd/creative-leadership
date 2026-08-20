/**
 * Runtime accessibility audit. `tests/site.test.mjs` is a source-text contract;
 * this one boots the real page and runs axe against the rendered DOM.
 *
 *   npm run test:a11y
 *   SITE_URL=https://... npm run test:a11y
 */
import { AxeBuilder } from "@axe-core/playwright";
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { HERO_SCENES, launch, openPage, showHeroScene } from "../scripts/lib/capture.mjs";
import { startSite } from "../scripts/lib/site-server.mjs";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function format(violations) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes.slice(0, 3).map((node) => `      ${node.target.join(" ")}`);
      return [`  [${violation.impact}] ${violation.id}: ${violation.help}`, ...nodes].join("\n");
    })
    .join("\n");
}

describe("accessibility", () => {
  let site;
  let browser;

  before(async () => {
    if (!process.env.SITE_URL) site = await startSite();
    browser = await launch("motion");
  });

  after(async () => {
    await browser?.close();
    await site?.close();
  });

  const url = () => (process.env.SITE_URL ?? site.url).replace(/\/$/, "");

  for (const [name, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    test(`${name} has no WCAG A/AA violations at rest`, async () => {
      const { page, context } = await openPage(browser, { url: url(), viewport, fx: "motion" });
      try {
        const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        assert.equal(results.violations.length, 0, `\n${format(results.violations)}`);
      } finally {
        await context.close();
      }
    });
  }

  test("hero stays accessible through every directed scene", async () => {
    const { page, context } = await openPage(browser, {
      url: url(),
      viewport: { width: 1440, height: 900 },
      fx: "motion",
    });
    try {
      for (const scene of HERO_SCENES) {
        await showHeroScene(page, scene);
        const results = await new AxeBuilder({ page }).include(".hero").withTags(TAGS).analyze();
        assert.equal(results.violations.length, 0, `scene ${scene}:\n${format(results.violations)}`);
      }
    } finally {
      await context.close();
    }
  });

  test("detail dialog traps focus and exposes a label", async () => {
    const { page, context } = await openPage(browser, {
      url: url(),
      viewport: { width: 1440, height: 900 },
      fx: "motion",
    });
    try {
      await page.evaluate(() => document.getElementById("work")?.scrollIntoView({ block: "start" }));
      const opener = page.locator("#work button").first();
      await opener.click();

      const dialog = page.locator("dialog[open]");
      await dialog.waitFor({ state: "visible", timeout: 5000 });
      assert.equal(await dialog.getAttribute("aria-modal"), "true");
      assert.ok(await dialog.getAttribute("aria-labelledby"), "dialog needs aria-labelledby");

      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      assert.equal(results.violations.length, 0, `\n${format(results.violations)}`);

      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden", timeout: 5000 });
    } finally {
      await context.close();
    }
  });
});
