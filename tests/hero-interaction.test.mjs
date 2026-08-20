import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { launch, openPage, showHeroScene, waitForCinematic } from "../scripts/lib/capture.mjs";
import { startSite } from "../scripts/lib/site-server.mjs";

describe("intro scene director", () => {
  let site;
  let browser;

  before(async () => {
    site = await startSite();
    browser = await launch("webgl");
  });

  after(async () => {
    await browser?.close();
    await site?.close();
  });

  async function pageFor(fx = "motion", live = true) {
    return openPage(browser, {
      url: site.url,
      viewport: { width: 1440, height: 900 },
      fx,
      live,
    });
  }

  test("small wheel inputs accumulate into one authored forward beat", async () => {
    const { page, context } = await pageFor();
    try {
      assert.equal(await page.locator(".hero").getAttribute("data-scene"), "proposition");
      await page.mouse.move(720, 450);
      await page.mouse.wheel(0, 10);
      await page.mouse.wheel(0, 10);
      await page.mouse.wheel(0, 10);
      await page.waitForTimeout(320);
      assert.equal(await page.locator(".hero").getAttribute("data-scene"), "partnership");
    } finally {
      await context.close();
    }
  });

  test("keyboard input moves forward, reverses, and jumps without scrubbing", async () => {
    const { page, context } = await pageFor();
    try {
      await page.keyboard.press("PageDown");
      assert.equal(await page.locator(".hero").getAttribute("data-scene"), "partnership");
      await page.keyboard.press("PageUp");
      assert.equal(await page.locator(".hero").getAttribute("data-scene"), "proposition");
      await page.keyboard.press("End");
      assert.equal(await page.locator(".hero").getAttribute("data-scene"), "proof");
      await page.keyboard.press("Home");
      assert.equal(await page.locator(".hero").getAttribute("data-scene"), "proposition");
    } finally {
      await context.close();
    }
  });

  test("reversing mid-transition never creates an empty content frame", async () => {
    const { page, context } = await pageFor();
    try {
      await page.locator(".hero-scene-nav button").nth(3).click();
      await page.waitForTimeout(90);
      await page.locator(".hero-scene-nav button").nth(1).click();
      for (const delay of [0, 90, 180, 360, 720]) {
        if (delay) await page.waitForTimeout(delay);
        const state = await page.evaluate(() => {
          const scenes = [...document.querySelectorAll(".hero-scene")];
          const opacity = scenes.reduce((sum, node) => sum + Number(getComputedStyle(node).opacity), 0);
          const promise = document.querySelector(".hero-running-promise");
          return { opacity, promiseVisible: promise ? getComputedStyle(promise).display !== "none" : false };
        });
        assert.ok(state.opacity > 0.2, `chapter opacity fell to ${state.opacity}`);
        assert.equal(state.promiseVisible, true);
      }
      assert.equal(await page.locator(".hero").getAttribute("data-scene"), "partnership");
    } finally {
      await context.close();
    }
  });

  test("the archive keeps drawing while the user is at rest", async () => {
    const { page, context } = await pageFor("webgl", true);
    try {
      await waitForCinematic(page);
      const first = await page.screenshot();
      await page.waitForTimeout(850);
      const second = await page.screenshot();
      assert.notEqual(Buffer.compare(first, second), 0, "visual layer froze between authored beats");
    } finally {
      await context.close();
    }
  });

  test("the final forward input hands off to the next topic", async () => {
    const { page, context } = await pageFor();
    try {
      await showHeroScene(page, "proof");
      await page.mouse.move(720, 450);
      await page.mouse.wheel(0, 80);
      await page.waitForTimeout(950);
      const teamTop = await page.locator("#team").evaluate((node) => node.getBoundingClientRect().top);
      assert.ok(Math.abs(teamTop) < 120, `team handoff stopped ${teamTop}px from the viewport`);
    } finally {
      await context.close();
    }
  });
});
