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
 * Hero is scroll-driven. These are the centres of the six chapter windows in
 * `src/hero/director.ts`, not evenly spaced samples: the gaps between windows
 * are deliberate dead zones where no copy is legible, so sampling on a uniform
 * grid photographs the beats nobody is meant to read.
 */
export const HERO_PROGRESS = [0.02, 0.285, 0.485, 0.685, 0.86, 1];

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

/** Fonts and lazy hero chunk both shift layout; wait for them before shooting. */
export async function settle(page, ms = 400) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

/**
 * Drives the hero to a given progress value the same way a user would — by
 * scrolling. Progress is derived from the hero's own bounding rect in App.tsx,
 * so scrolling is the only honest way to reach a phase.
 */
export async function scrollHeroTo(page, progress) {
  await page.evaluate((p) => {
    const hero = document.querySelector(".hero");
    if (!hero) throw new Error(".hero not found");
    const rect = hero.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const travel = Math.max(1, rect.height - window.innerHeight);
    window.scrollTo({ top: top + p * travel, behavior: "instant" });
  }, progress);
  // The narrative clock is a damper, not a direct binding: at NARRATIVE_LAMBDA = 4
  // it needs a little over a second of wall time to settle after the scroll lands.
  await page.waitForTimeout(1400);
}

export async function heroPhase(page) {
  return page.evaluate(() => document.querySelector(".hero")?.getAttribute("data-phase") ?? null);
}

/**
 * App.tsx only runs the cinematic when the tier is webgl/webgpu AND reduced
 * motion is off; otherwise the hero is pinned to the `payoff` poster. Ask the
 * DOM rather than inferring it from flags — the tier probe can also decline.
 */
export async function isHeroStatic(page) {
  return page.evaluate(() => document.querySelector(".hero")?.getAttribute("data-static") === "true");
}

/** Resolves once the lazy WebGL hero has painted its first frame. */
export async function waitForCinematic(page, timeout = 15000) {
  await page
    .waitForFunction(() => document.querySelector(".hero")?.getAttribute("data-enhanced") === "true", null, { timeout })
    .catch(() => false);
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
