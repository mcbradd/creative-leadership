import { AxeBuilder } from "@axe-core/playwright";
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { launch, openPage } from "../scripts/lib/capture.mjs";
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
    test(`${name} overview has no WCAG A/AA violations`, async () => {
      const { page, context } = await openPage(browser, { url: url(), viewport, fx: "motion" });
      try {
        const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        assert.equal(results.violations.length, 0, `\n${format(results.violations)}`);
      } finally {
        await context.close();
      }
    });
  }

  test("keyboard focus remains visible while pointer entry has no automatic focus ring", async () => {
    const { page, context } = await openPage(browser, {
      url: url(),
      viewport: { width: 390, height: 844 },
      fx: "motion",
    });
    try {
      assert.equal(await page.evaluate(() => document.activeElement === document.body), true, "entry should not auto-focus a slide or control");
      await page.keyboard.press("Tab");
      const keyboardFocus = await page.evaluate(() => {
        const node = document.activeElement;
        const style = getComputedStyle(node);
        return {
          tag: node?.tagName,
          text: node?.textContent?.replace(/\s+/g, " ").trim(),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
        };
      });
      assert.equal(keyboardFocus.tag, "BUTTON");
      assert.notEqual(keyboardFocus.outlineStyle, "none", JSON.stringify(keyboardFocus));
      assert.ok(Number.parseFloat(keyboardFocus.outlineWidth) >= 2, JSON.stringify(keyboardFocus));

      await page.mouse.click(200, 350);
      const pointerRing = await page.evaluate(() => {
        const node = document.activeElement;
        return node?.matches(":focus-visible") ?? false;
      });
      assert.equal(pointerRing, false, "pointer entry should not display the keyboard focus treatment");
    } finally {
      await context.close();
    }
  });

  test("Explore exposes its state and a concise labelled navigation", async () => {
    const { page, context } = await openPage(browser, {
      url: url(),
      viewport: { width: 390, height: 844 },
      fx: "motion",
    });
    try {
      const trigger = page.getByRole("button", { name: /EXPLORE/ });
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert.equal(await trigger.getAttribute("aria-controls"), "explore-panel");
      await trigger.click();
      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      const nav = page.getByRole("navigation", { name: "Explore the presentation" });
      assert.equal(await nav.getByRole("button").count(), 6);

      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      assert.equal(results.violations.length, 0, `\n${format(results.violations)}`);
    } finally {
      await context.close();
    }
  });

  test("detail article traps focus, exposes its title, and restores focus through browser history", async () => {
    const { page, context } = await openPage(browser, {
      url: url(),
      viewport: { width: 390, height: 844 },
      fx: "motion",
    });
    try {
      await page.locator("#work").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
      const opener = page.locator("#work .featured-case .article-link");
      await opener.focus();
      await opener.click();

      const surface = page.locator(".detail-surface[role='dialog']");
      await surface.waitFor({ state: "visible" });
      assert.equal(await surface.getAttribute("aria-modal"), "true");
      assert.equal(await surface.getAttribute("aria-labelledby"), "detail-title");
      assert.equal(await page.evaluate(() => document.querySelector(".detail-article")?.contains(document.activeElement)), true);

      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      assert.equal(results.violations.length, 0, `\n${format(results.violations)}`);

      for (let index = 0; index < 7; index += 1) {
        await page.keyboard.press("Tab");
        const inside = await page.evaluate(() => document.querySelector(".detail-article")?.contains(document.activeElement));
        assert.equal(inside, true, `focus escaped the article after ${index + 1} Tab presses`);
      }

      await page.keyboard.press("Escape");
      await surface.waitFor({ state: "detached" });
      assert.equal(await opener.evaluate((node) => node === document.activeElement), true, "focus did not return to the article opener");
    } finally {
      await context.close();
    }
  });
});
