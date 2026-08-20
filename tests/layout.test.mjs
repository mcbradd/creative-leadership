import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { launch, settle } from "../scripts/lib/capture.mjs";
import { startSite } from "../scripts/lib/site-server.mjs";

const CANONICAL_VIEWPORTS = [
  ["phone-320x568", { width: 320, height: 568 }],
  ["phone-390x844", { width: 390, height: 844 }],
  ["phone-landscape-844x390", { width: 844, height: 390 }],
  ["tablet-768x1024", { width: 768, height: 1024 }],
  ["tablet-landscape-1024x768", { width: 1024, height: 768 }],
  ["laptop-1366x768", { width: 1366, height: 768 }],
  ["desktop-1440x900", { width: 1440, height: 900 }],
  ["wide-2560x1440", { width: 2560, height: 1440 }],
];

const MOBILE_VIEWPORTS = CANONICAL_VIEWPORTS.slice(0, 3);
const DYNAMIC_VIEWPORTS = [CANONICAL_VIEWPORTS[0], CANONICAL_VIEWPORTS[2]];
const SECTION_HEADINGS = [
  ["partnership", "#team h2"],
  ["joint proof", "#proof h2"],
  ["range", "#range h2"],
  ["industry proof", "#industry-proof h2"],
  ["case files", "#work h2"],
  ["collaboration", "#collaboration h2"],
  ["individual depth", "#depth h2"],
  ["mentorship", "#mentorship h2"],
  ["contact", "#contact h2"],
];

const EPSILON = 1.5;

describe("responsive layout contract", () => {
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

  function isSameOrigin(url) {
    try {
      return new URL(url).origin === new URL(site.url).origin;
    } catch {
      return false;
    }
  }

  async function openAuditedPage(viewport) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const faults = [];

    page.on("pageerror", (error) => faults.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") faults.push(`console: ${message.text()}`);
    });
    page.on("requestfailed", (request) => {
      if (isSameOrigin(request.url())) faults.push(`request failed: ${request.url()} (${request.failure()?.errorText ?? "unknown"})`);
    });
    page.on("response", (response) => {
      if (isSameOrigin(response.url()) && response.status() >= 400) faults.push(`response ${response.status()}: ${response.url()}`);
    });

    await page.goto(`${site.url}/?fx=motion`, { waitUntil: "load" });
    await settle(page, 80);
    return { context, page, faults };
  }

  async function assertNoFaults(page, faults, label) {
    await page.waitForLoadState("networkidle").catch(() => {});
    assert.deepEqual(faults, [], `${label} emitted browser errors or failed same-origin assets`);
  }

  async function elementReport(page, selector) {
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: "visible" });
    return locator.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      };
    });
  }

  function assertFitsViewport(report, viewport, label) {
    assert.ok(report.width > 0 && report.height > 0, `${label} has no rendered area`);
    assert.ok(report.left >= -EPSILON, `${label} escapes ${Math.abs(report.left).toFixed(1)}px past the left edge`);
    assert.ok(report.right <= viewport.width + EPSILON, `${label} escapes ${(report.right - viewport.width).toFixed(1)}px past the right edge`);
    assert.ok(report.top >= -EPSILON, `${label} escapes ${Math.abs(report.top).toFixed(1)}px above the viewport`);
    assert.ok(report.bottom <= viewport.height + EPSILON, `${label} escapes ${(report.bottom - viewport.height).toFixed(1)}px below the viewport`);
    assert.ok(report.scrollWidth <= report.clientWidth + EPSILON, `${label} has ${report.scrollWidth - report.clientWidth}px internal horizontal overflow`);
  }

  async function assertDocumentHasNoHorizontalOverflow(page, label) {
    const width = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(width.scrollWidth <= width.clientWidth + EPSILON, `${label} document is ${width.scrollWidth - width.clientWidth}px wider than its viewport`);
  }

  test("canonical viewports have no horizontal overflow and keep every section heading on-screen", async () => {
    for (const [name, viewport] of CANONICAL_VIEWPORTS) {
      const { context, page, faults } = await openAuditedPage(viewport);
      try {
        for (const [headingName, selector] of SECTION_HEADINGS) {
          await page.locator(selector).evaluate((element) => element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" }));
          const report = await elementReport(page, selector);
          assert.ok(report.text.length > 0, `${name} ${headingName} heading has no text`);
          assertFitsViewport(report, viewport, `${name} ${headingName} heading`);
        }

        if (MOBILE_VIEWPORTS.some(([mobileName]) => mobileName === name)) {
          const undersizedControls = await page.evaluate(() => {
            const controls = [...document.querySelectorAll("button, a[href], input, select, textarea, [role=tab]")];
            return controls.flatMap((control) => {
              const style = getComputedStyle(control);
              const rect = control.getBoundingClientRect();
              const rendered = style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
              if (!rendered || (rect.width >= 44 && rect.height >= 44)) return [];
              const label = control.getAttribute("aria-label") || control.textContent?.replace(/\s+/g, " ").trim() || control.tagName;
              return [{ label, width: Number(rect.width.toFixed(1)), height: Number(rect.height.toFixed(1)) }];
            });
          });
          assert.deepEqual(undersizedControls, [], `${name} has rendered controls smaller than 44px`);
        }

        await assertDocumentHasNoHorizontalOverflow(page, name);
        await assertNoFaults(page, faults, name);
      } finally {
        await context.close();
      }
    }
  });

  test("detail, navigation, and toast surfaces fit short mobile viewports", async () => {
    for (const [name, viewport] of DYNAMIC_VIEWPORTS) {
      const { context, page, faults } = await openAuditedPage(viewport);
      try {
        const detailOpener = page.locator("#work .case-card").first();
        await detailOpener.scrollIntoViewIfNeeded();
        await detailOpener.focus();
        await detailOpener.click();

        const detail = page.locator("dialog.detail-dialog[open]");
        await detail.waitFor({ state: "visible" });
        await page.waitForFunction(() => document.activeElement?.classList.contains("dialog-close"));
        for (const [surfaceName, selector] of [
          ["detail dialog", "dialog.detail-dialog[open]"],
          ["detail panel", "dialog.detail-dialog[open] .dialog-panel"],
          ["detail toolbar", "dialog.detail-dialog[open] .dialog-toolbar"],
          ["detail close control", "dialog.detail-dialog[open] .dialog-close"],
        ]) {
          assertFitsViewport(await elementReport(page, selector), viewport, `${name} ${surfaceName}`);
        }
        const detailPanel = page.locator("dialog.detail-dialog[open] .dialog-panel");
        const detailScroll = await detailPanel.evaluate((element) => ({ clientHeight: element.clientHeight, scrollHeight: element.scrollHeight, scrollTop: element.scrollTop }));
        assert.ok(detailScroll.scrollHeight > detailScroll.clientHeight, `${name} detail panel should scroll when its complete answer exceeds the viewport`);
        await detailPanel.hover();
        await page.mouse.wheel(0, 420);
        await page.waitForFunction(() => document.querySelector(".dialog-panel")?.scrollTop > 0);
        await page.locator(".dialog-end").scrollIntoViewIfNeeded();
        assertFitsViewport(await elementReport(page, ".dialog-end button"), viewport, `${name} final detail action`);
        await page.keyboard.press("Escape");
        await detail.waitFor({ state: "hidden" });
        await page.waitForFunction((selector) => document.activeElement === document.querySelector(selector), "#work .case-card");

        const menuButton = page.locator(".menu-button");
        await menuButton.focus();
        await menuButton.click();
        const navigation = page.locator("dialog.nav-dialog[open]");
        await navigation.waitFor({ state: "visible" });
        await page.waitForFunction(() => document.activeElement?.classList.contains("nav-close"));
        for (const [surfaceName, selector] of [
          ["navigation dialog", "dialog.nav-dialog[open]"],
          ["navigation panel", "dialog.nav-dialog[open] .nav-panel"],
          ["navigation close control", "dialog.nav-dialog[open] .nav-close"],
        ]) {
          assertFitsViewport(await elementReport(page, selector), viewport, `${name} ${surfaceName}`);
        }
        const navPanel = page.locator("dialog.nav-dialog[open] .nav-panel");
        const navScroll = await navPanel.evaluate((element) => ({ clientHeight: element.clientHeight, scrollHeight: element.scrollHeight, scrollTop: element.scrollTop }));
        assert.ok(navScroll.scrollHeight > navScroll.clientHeight, `${name} navigation panel should scroll when all chapter explanations do not fit`);
        await navPanel.hover();
        await page.mouse.wheel(0, 360);
        await page.waitForFunction(() => document.querySelector(".nav-panel")?.scrollTop > 0);
        await page.locator(".nav-contact").scrollIntoViewIfNeeded();
        assertFitsViewport(await elementReport(page, ".nav-contact"), viewport, `${name} navigation contact action`);
        await page.keyboard.press("Escape");
        await navigation.waitFor({ state: "hidden" });
        await page.waitForFunction(() => document.activeElement?.classList.contains("menu-button"));

        await menuButton.click();
        await navigation.waitFor({ state: "visible" });
        await navigation.locator('a[href="#proof"]').click();
        await navigation.waitFor({ state: "hidden" });
        await page.waitForFunction(() => document.activeElement === document.querySelector("#proof h2"));
        const anchorPosition = await page.evaluate(() => ({
          targetTop: document.querySelector("#proof")?.getBoundingClientRect().top ?? -1,
          headerBottom: document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? -1,
        }));
        assert.ok(anchorPosition.targetTop >= anchorPosition.headerBottom - EPSILON, `${name} selected chapter should not sit beneath the fixed header`);
        assert.ok(anchorPosition.targetTop <= anchorPosition.headerBottom + 18, `${name} selected chapter should land directly below the fixed header`);

        const copyButton = page.locator("#contact .copy-action");
        await copyButton.scrollIntoViewIfNeeded();
        await copyButton.click();
        const toast = page.locator(".toast");
        await toast.waitFor({ state: "visible" });
        assertFitsViewport(await elementReport(page, ".toast"), viewport, `${name} toast`);
        assertFitsViewport(await elementReport(page, ".toast button"), viewport, `${name} toast dismiss control`);
        await toast.getByRole("button", { name: "Dismiss notification" }).click();
        await toast.waitFor({ state: "hidden" });

        await assertDocumentHasNoHorizontalOverflow(page, `${name} after dynamic surfaces`);
        await assertNoFaults(page, faults, `${name} dynamic surfaces`);
      } finally {
        await context.close();
      }
    }
  });

  test("range tabs use roving focus and support directional, Home, and End keys", async () => {
    const [name, viewport] = CANONICAL_VIEWPORTS[1];
    const { context, page, faults } = await openAuditedPage(viewport);
    try {
      const tabs = page.locator(".range-tabs [role=tab]");
      await tabs.first().scrollIntoViewIfNeeded();

      const readState = () => tabs.evaluateAll((elements) => elements.map((element) => ({
        id: element.id,
        selected: element.getAttribute("aria-selected") === "true",
        tabIndex: element.tabIndex,
        focused: element === document.activeElement,
      })));
      const assertState = async (selectedIndex, label) => {
        const state = await readState();
        assert.equal(state.length, 3, `${label} should expose exactly three range tabs`);
        assert.deepEqual(state.map((tab) => tab.selected), state.map((_, index) => index === selectedIndex), `${label} selected tab`);
        assert.deepEqual(state.map((tab) => tab.tabIndex), state.map((_, index) => index === selectedIndex ? 0 : -1), `${label} roving tab index`);
        assert.equal(state[selectedIndex].focused, true, `${label} should move focus to ${state[selectedIndex].id}`);
      };

      await tabs.first().focus();
      await assertState(0, "initial range state");
      await page.keyboard.press("ArrowRight");
      await page.waitForFunction(() => document.activeElement?.id === "tab-collect");
      await assertState(1, "ArrowRight");
      await page.keyboard.press("End");
      await page.waitForFunction(() => document.activeElement?.id === "tab-grow");
      await assertState(2, "End");
      await page.keyboard.press("Home");
      await page.waitForFunction(() => document.activeElement?.id === "tab-play");
      await assertState(0, "Home");
      await page.keyboard.press("ArrowLeft");
      await page.waitForFunction(() => document.activeElement?.id === "tab-grow");
      await assertState(2, "ArrowLeft wraparound");

      const partnerTabs = page.locator(".partner-nodes [role=tab]");
      await partnerTabs.first().scrollIntoViewIfNeeded();
      await partnerTabs.first().focus();
      await page.keyboard.press("ArrowRight");
      await page.waitForFunction(() => document.activeElement?.id === "partner-tab-1");
      assert.equal(await partnerTabs.nth(1).getAttribute("aria-selected"), "true", "partner ArrowRight should select and focus the next contextual relationship");
      assert.equal(await page.locator("#partner-detail").getAttribute("aria-labelledby"), "partner-tab-1", "partner detail should be labelled by the selected relationship");
      await page.keyboard.press("End");
      await page.waitForFunction(() => document.activeElement?.id === "partner-tab-11");
      assert.equal(await partnerTabs.nth(11).getAttribute("tabindex"), "0", "partner End should move the roving tab stop to the final relationship");
      await page.keyboard.press("Home");
      await page.waitForFunction(() => document.activeElement?.id === "partner-tab-0");
      assert.equal(await partnerTabs.first().getAttribute("aria-selected"), "true", "partner Home should restore the first contextual relationship");

      await assertNoFaults(page, faults, `${name} range tabs`);
    } finally {
      await context.close();
    }
  });
});
