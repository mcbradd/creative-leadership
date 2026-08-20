import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { launch, settle } from "../scripts/lib/capture.mjs";
import { startSite } from "../scripts/lib/site-server.mjs";

const CANONICAL_VIEWPORTS = [
  ["phone-320x568", { width: 320, height: 568 }],
  ["phone-390x844", { width: 390, height: 844 }],
  ["phone-440x956", { width: 440, height: 956 }],
  ["phone-landscape-844x390", { width: 844, height: 390 }],
  ["tablet-768x1024", { width: 768, height: 1024 }],
  ["tablet-landscape-1024x768", { width: 1024, height: 768 }],
  ["laptop-1366x768", { width: 1366, height: 768 }],
  ["desktop-1440x900", { width: 1440, height: 900 }],
  ["wide-2560x1440", { width: 2560, height: 1440 }],
];

const MOBILE_VIEWPORTS = CANONICAL_VIEWPORTS.slice(0, 4);
const DYNAMIC_VIEWPORTS = [CANONICAL_VIEWPORTS[0], CANONICAL_VIEWPORTS[3]];
const LEADER_CARD_VIEWPORTS = [
  ...CANONICAL_VIEWPORTS.slice(0, 3),
  CANONICAL_VIEWPORTS.find(([name]) => name === "desktop-1440x900"),
];
const LOWER_CARD_VIEWPORTS = CANONICAL_VIEWPORTS.slice(0, 3);
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

  test("leader portraits, text plates, and actions remain geometrically separate and contained", async () => {
    for (const [name, viewport] of LEADER_CARD_VIEWPORTS) {
      const { context, page, faults } = await openAuditedPage(viewport);
      try {
        const cards = page.locator("#team .leader-card");
        await cards.first().scrollIntoViewIfNeeded();
        await cards.first().locator(".portrait-wrap img").waitFor({ state: "visible" });

        const reports = await cards.evaluateAll((elements) => {
          const bounds = (element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
          };
          const objectPositionFraction = (token, axis) => {
            if (token.endsWith("%")) return Number.parseFloat(token) / 100;
            if (token === "left" || token === "top") return 0;
            if (token === "right" || token === "bottom") return 1;
            if (token === "center") return 0.5;
            const pixels = Number.parseFloat(token);
            return Number.isFinite(pixels) ? (axis === "x" ? 0.5 : 0.5) : 0.5;
          };

          return elements.map((card) => {
            const portrait = card.querySelector(".portrait-wrap");
            const image = portrait?.querySelector("img");
            const plate = card.querySelector(".leader-copy");
            if (!(portrait instanceof HTMLElement) || !(image instanceof HTMLImageElement) || !(plate instanceof HTMLElement)) {
              return { error: "leader card is missing its portrait, image, or lower text plate" };
            }

            const cardRect = bounds(card);
            const imageRect = bounds(image);
            const plateRect = bounds(plate);
            const imageStyle = getComputedStyle(image);
            const naturalWidth = image.naturalWidth;
            const naturalHeight = image.naturalHeight;
            const [rawX = "50%", rawY = "50%"] = imageStyle.objectPosition.split(/\s+/);
            const positionX = objectPositionFraction(rawX, "x");
            const positionY = objectPositionFraction(rawY, "y");
            const coverScale = Math.max(imageRect.width / naturalWidth, imageRect.height / naturalHeight);
            const containScale = Math.min(imageRect.width / naturalWidth, imageRect.height / naturalHeight);
            const scale = imageStyle.objectFit === "contain" ? containScale : imageStyle.objectFit === "fill" ? null : coverScale;
            const renderedWidth = scale === null ? imageRect.width : naturalWidth * scale;
            const renderedHeight = scale === null ? imageRect.height : naturalHeight * scale;
            const renderedLeft = imageRect.left + (imageRect.width - renderedWidth) * positionX;
            const renderedTop = imageRect.top + (imageRect.height - renderedHeight) * positionY;

            // Measured against the source portraits: includes hairline through chin,
            // while deliberately excluding shoulders/torso that a plate may cover.
            const focal = card.classList.contains("leader-bradd")
              ? { left: 0.29, top: 0.035, right: 0.79, bottom: 0.64 }
              : { left: 0.24, top: 0.01, right: 0.86, bottom: 0.66 };
            const face = {
              left: renderedLeft + focal.left * renderedWidth,
              top: renderedTop + focal.top * renderedHeight,
              right: renderedLeft + focal.right * renderedWidth,
              bottom: renderedTop + focal.bottom * renderedHeight,
            };
            const text = [
              ["index", card.querySelector(".leader-index")],
              ["role", card.querySelector(".leader-role")],
              ["name", card.querySelector(".leader-copy > strong")],
              ["summary", card.querySelector(".leader-copy > span:not(.leader-role):not(.leader-open)")],
              ["action", card.querySelector(".leader-open")],
            ].map(([label, element]) => ({ label, rect: element instanceof HTMLElement ? bounds(element) : null }));

            return {
              label: card.classList.contains("leader-bradd") ? "Bradd" : "Stone",
              card: cardRect,
              plate: plateRect,
              face,
              text,
              clientWidth: card.clientWidth,
              scrollWidth: card.scrollWidth,
              imageLoaded: image.complete && naturalWidth > 0 && naturalHeight > 0,
            };
          });
        });

        assert.equal(reports.length, 2, `${name} should render both leader cards`);
        for (const report of reports) {
          assert.equal(report.error, undefined, `${name}: ${report.error}`);
          assert.equal(report.imageLoaded, true, `${name} ${report.label} portrait did not load`);
          assert.ok(report.card.width >= 44 && report.card.height >= 44, `${name} ${report.label} card target is smaller than 44px`);
          assert.ok(report.scrollWidth <= report.clientWidth + EPSILON, `${name} ${report.label} card has ${report.scrollWidth - report.clientWidth}px internal horizontal overflow`);
          assert.ok(report.face.left >= report.card.left - EPSILON && report.face.right <= report.card.right + EPSILON, `${name} ${report.label} face focal region is horizontally cropped out of its card`);
          assert.ok(report.plate.top >= report.face.bottom - EPSILON, `${name} ${report.label} lower text plate overlaps the portrait focal region by ${(report.face.bottom - report.plate.top).toFixed(1)}px`);

          for (const item of report.text) {
            assert.ok(item.rect, `${name} ${report.label} is missing ${item.label} text`);
            assert.ok(item.rect.left >= report.card.left - EPSILON, `${name} ${report.label} ${item.label} text escapes the left edge of its card`);
            assert.ok(item.rect.right <= report.card.right + EPSILON, `${name} ${report.label} ${item.label} text escapes the right edge of its card`);
            assert.ok(item.rect.top >= report.card.top - EPSILON, `${name} ${report.label} ${item.label} text escapes the top of its card`);
            assert.ok(item.rect.bottom <= report.card.bottom + EPSILON, `${name} ${report.label} ${item.label} text escapes the bottom of its card`);
          }
        }

        await assertDocumentHasNoHorizontalOverflow(page, `${name} leader cards`);
        await assertNoFaults(page, faults, `${name} leader cards`);
      } finally {
        await context.close();
      }
    }
  });

  test("mobile lower profile and evidence cards stack in one readable, contained column", async () => {
    for (const [name, viewport] of LOWER_CARD_VIEWPORTS) {
      const { context, page, faults } = await openAuditedPage(viewport);
      try {
        await page.locator(".dual-timeline").scrollIntoViewIfNeeded();
        const report = await page.locator(".dual-timeline").evaluate((timeline) => {
          const bounds = (element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
          };
          const inspectChildren = (container) => {
            const containerRect = bounds(container);
            return [...container.children].map((child) => ({
              rect: bounds(child),
              text: child.textContent?.replace(/\s+/g, " ").trim() ?? "",
              clientWidth: child.clientWidth,
              scrollWidth: child.scrollWidth,
              clientHeight: child.clientHeight,
              scrollHeight: child.scrollHeight,
              descendants: [...child.children].map((descendant) => ({
                text: descendant.textContent?.replace(/\s+/g, " ").trim() ?? "",
                rect: bounds(descendant),
              })),
            })).map((item) => ({ ...item, containerRect }));
          };

          const profileHead = timeline.querySelector(".timeline-head");
          return {
            profiles: profileHead ? inspectChildren(profileHead) : [],
            evidenceRows: [...timeline.querySelectorAll(".timeline-row")].map((row) => ({
              row: bounds(row),
              articles: inspectChildren(row).filter((item) => item.text && item.rect.width > 44),
            })),
          };
        });

        assert.equal(report.profiles.length, 2, `${name} must render both lower profile cards`);
        for (const [index, profile] of report.profiles.entries()) {
          assert.ok(Math.abs(profile.rect.width - profile.containerRect.width) <= EPSILON, `${name} profile ${index + 1} is not a full-width mobile card`);
          assert.ok(profile.scrollWidth <= profile.clientWidth + EPSILON, `${name} profile ${index + 1} has horizontal overflow`);
          assert.ok(profile.scrollHeight <= profile.clientHeight + EPSILON, `${name} profile ${index + 1} has vertical overflow`);
          for (const child of profile.descendants) {
            assert.ok(child.rect.left >= profile.rect.left - EPSILON && child.rect.right <= profile.rect.right + EPSILON, `${name} profile ${index + 1} text escapes horizontally: ${child.text}`);
            assert.ok(child.rect.top >= profile.rect.top - EPSILON && child.rect.bottom <= profile.rect.bottom + EPSILON, `${name} profile ${index + 1} text escapes vertically: ${child.text}`);
          }
        }
        assert.ok(report.profiles[1].rect.top >= report.profiles[0].rect.bottom - EPSILON, `${name} lower profile cards remain side-by-side instead of stacking`);

        assert.ok(report.evidenceRows.length > 0, `${name} must render lower evidence rows`);
        for (const [rowIndex, evidence] of report.evidenceRows.entries()) {
          assert.equal(evidence.articles.length, 2, `${name} evidence row ${rowIndex + 1} must contain two articles`);
          for (const [articleIndex, article] of evidence.articles.entries()) {
            assert.ok(Math.abs(article.rect.width - evidence.row.width) <= EPSILON, `${name} evidence row ${rowIndex + 1} article ${articleIndex + 1} is not full width`);
            assert.ok(article.scrollWidth <= article.clientWidth + EPSILON, `${name} evidence row ${rowIndex + 1} article ${articleIndex + 1} has horizontal overflow`);
            assert.ok(article.scrollHeight <= article.clientHeight + EPSILON, `${name} evidence row ${rowIndex + 1} article ${articleIndex + 1} has vertical overflow`);
            for (const child of article.descendants) {
              assert.ok(child.rect.left >= article.rect.left - EPSILON && child.rect.right <= article.rect.right + EPSILON, `${name} evidence text escapes horizontally: ${child.text}`);
              assert.ok(child.rect.top >= article.rect.top - EPSILON && child.rect.bottom <= article.rect.bottom + EPSILON, `${name} evidence text escapes vertically: ${child.text}`);
            }
          }
          assert.ok(evidence.articles[1].rect.top >= evidence.articles[0].rect.bottom - EPSILON, `${name} evidence row ${rowIndex + 1} remains side-by-side instead of stacking`);
        }

        await assertDocumentHasNoHorizontalOverflow(page, `${name} lower cards`);
        await assertNoFaults(page, faults, `${name} lower cards`);
      } finally {
        await context.close();
      }
    }
  });

  test("mobile lower-card labels, actions, and notes keep a readable type floor", async () => {
    for (const [name, viewport] of LOWER_CARD_VIEWPORTS) {
      const { context, page, faults } = await openAuditedPage(viewport);
      try {
        const floors = [
          [".timeline-head > button > span", 10],
          [".timeline-head > button > small", 10],
          [".timeline-row article > span", 10],
          [".timeline-row article > p", 12],
        ];
        const undersized = [];
        for (const [selector, minimum] of floors) {
          const items = await page.locator(selector).evaluateAll((elements) => elements.map((element) => ({
            text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
            size: Number.parseFloat(getComputedStyle(element).fontSize),
          })));
          for (const item of items) {
            if (item.size < minimum - 0.05) undersized.push({ selector, minimum, ...item });
          }
        }
        assert.deepEqual(undersized, [], `${name} lower-card type falls below its readable mobile floor`);
        await assertNoFaults(page, faults, `${name} lower-card typography`);
      } finally {
        await context.close();
      }
    }
  });

  test("rectangular container surfaces are square while approved visual motifs stay circular", async () => {
    const [name, viewport] = CANONICAL_VIEWPORTS[1];
    const { context, page, faults } = await openAuditedPage(viewport);
    try {
      const surfaceSelectors = [
        ".leader-card",
        ".portrait-wrap",
        ".leader-copy",
        ".proof-visual",
        ".range-visual",
        ".partner-detail",
        ".case-card",
        ".collab-art",
        ".supporting-card",
        ".mentor-columns",
      ];
      const inspect = async (selector) => page.locator(selector).first().evaluate((element, inspectedSelector) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          selector: inspectedSelector,
          width: rect.width,
          height: rect.height,
          corners: [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius],
        };
      }, selector);

      const surfaces = [];
      for (const selector of surfaceSelectors) surfaces.push(await inspect(selector));

      await page.locator("#team .leader-card").first().click();
      await page.locator("dialog.detail-dialog[open] .dialog-panel").waitFor({ state: "visible" });
      surfaces.push(await inspect("dialog.detail-dialog[open] .dialog-panel"));
      const dialogDot = await inspect("dialog.detail-dialog[open] .dialog-concept b");
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "Open presentation navigation" }).click();
      await page.locator("dialog.nav-dialog[open] .nav-panel").waitFor({ state: "visible" });
      surfaces.push(await inspect("dialog.nav-dialog[open] .nav-panel"));
      await page.keyboard.press("Escape");

      await page.locator("#contact .copy-action").click();
      await page.locator(".toast.toast-visible").waitFor({ state: "visible" });
      surfaces.push(await inspect(".toast.toast-visible"));
      const toastIcon = await inspect(".toast.toast-visible > span");
      await page.getByRole("button", { name: "Dismiss notification" }).click();

      const roundedSurfaces = surfaces.filter((surface) => surface.corners.some((corner) => Number.parseFloat(corner) > EPSILON));
      assert.deepEqual(roundedSurfaces, [], `${name} rectangular surfaces still have rounded corners`);

      const motifs = [
        await inspect(".hero-orbit"),
        await inspect(".hero-orbit > span"),
        await inspect(".proof-stamp"),
        await inspect(".timeline-index"),
        await inspect(".mentorship-ripple i"),
        dialogDot,
        toastIcon,
      ];
      for (const motif of motifs) {
        assert.ok(Math.abs(motif.width - motif.height) <= EPSILON, `${name} ${motif.selector} is no longer square enough to form a circle`);
        assert.ok(motif.corners.every((corner) => corner === "50%" || Number.parseFloat(corner) >= Math.min(motif.width, motif.height) / 2 - EPSILON), `${name} ${motif.selector} is no longer circular`);
      }
      await assertNoFaults(page, faults, `${name} corner language`);
    } finally {
      await context.close();
    }
  });

  test("every section-heading emphasis shares the lava-flow treatment and honors reduced motion", async () => {
    const [name, viewport] = CANONICAL_VIEWPORTS[1];
    const { context, page, faults } = await openAuditedPage(viewport);
    try {
      const emphasis = page.locator("main > section:not(.hero) h2 > em");
      const reports = await emphasis.evaluateAll((elements) => elements.map((element) => {
        const style = getComputedStyle(element);
        return {
          text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
          hasHook: element.classList.contains("lava-flow"),
          backgroundImage: style.backgroundImage,
          backgroundClip: style.backgroundClip || style.webkitBackgroundClip,
          runningAnimations: element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length,
        };
      }));
      assert.equal(reports.length, 9, `${name} should render one emphasized payoff in every numbered section heading`);
      assert.ok(reports.every((report) => report.hasHook), `${name} section emphasis is missing the shared .lava-flow hook: ${JSON.stringify(reports)}`);
      assert.ok(reports.every((report) => report.backgroundImage !== "none" && report.backgroundClip === "text"), `${name} lava-flow emphasis is missing its clipped color treatment`);
      assert.ok(reports.every((report) => report.runningAnimations === 0), `${name} lava-flow emphasis keeps animating with reduced motion enabled`);
      assert.equal(new Set(reports.map((report) => report.backgroundImage)).size, 1, `${name} section emphases do not share one lava-flow style`);
      await assertNoFaults(page, faults, `${name} lava-flow emphasis`);
    } finally {
      await context.close();
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
