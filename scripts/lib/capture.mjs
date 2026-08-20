import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 800 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

export const SECTIONS = [
  "team",
  "proof",
  "range",
  "industry-proof",
  "work",
  "collaboration",
  "depth",
  "mentorship",
  "contact",
];

/**
 * WebGL in headless Chromium needs a software rasteriser. Only paid for when
 * the caller actually wants the `webgl`/`webgpu` tier.
 */
export function launchArgs(fx) {
  return fx === "webgl" || fx === "webgpu"
    ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
    : [];
}

export async function launch(fx) {
  return chromium.launch({ args: launchArgs(fx) });
}

export async function openPage(browser, { url, viewport, fx, live = false, deviceScaleFactor = 1 }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor,
    reducedMotion: live ? "no-preference" : "reduce",
  });
  const page = await context.newPage();
  const target = fx ? `${url}/?fx=${fx}` : `${url}/`;
  await page.goto(target, { waitUntil: "load" });
  await settle(page);
  return { page, context };
}

/** Fonts and initial client effects can both shift layout; wait before shooting. */
export async function settle(page, ms = 400) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

/** Waits until the single teaser hero reaches its reduced or active motion mode. */
export async function waitForHeroMotion(page, expected, timeout = 6000) {
  if (expected !== "reduced" && expected !== "active") throw new Error(`Unknown hero motion mode: ${expected}`);
  await page.locator(".hero").waitFor({ state: "visible", timeout });
  await page.waitForFunction(
    (mode) => document.querySelector(".hero")?.getAttribute("data-motion") === mode,
    expected,
    { timeout },
  );
}

/**
 * Pauses the authored one-shot hero animations at a shared timeline position,
 * making the active screenshot repeatable enough for visual review.
 */
export async function freezeHeroMotion(page, currentTime = 1800) {
  if (!Number.isFinite(currentTime) || currentTime < 0) throw new Error(`Invalid hero motion time: ${currentTime}`);
  const count = await page.locator(".hero").evaluate((hero, at) => {
    const animations = hero.getAnimations({ subtree: true });
    for (const animation of animations) {
      animation.pause();
      animation.currentTime = at;
    }
    return animations.length;
  }, currentTime);
  if (count === 0) throw new Error("Active hero exposed no animations to capture");
  await page.waitForTimeout(50);
  return count;
}

export async function shoot(page, outDir, name) {
  await mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file });
  return file;
}

export function parseFlags(argv) {
  const flags = {};
  for (const arg of argv) {
    const match = /^--([^=]+)(?:=(.*))?$/.exec(arg);
    if (match) flags[match[1]] = match[2] ?? true;
  }
  return flags;
}

export function pickViewports(spec) {
  if (!spec || spec === true || spec === "all") return Object.entries(VIEWPORTS);
  return String(spec)
    .split(",")
    .map((name) => name.trim())
    .map((name) => {
      if (!VIEWPORTS[name]) throw new Error(`Unknown viewport "${name}". Known: ${Object.keys(VIEWPORTS).join(", ")}`);
      return [name, VIEWPORTS[name]];
    });
}
