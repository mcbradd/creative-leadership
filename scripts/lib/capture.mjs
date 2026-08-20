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

/** The four authored states in the discrete scene director. */
export const HERO_SCENES = ["proposition", "partnership", "translation", "proof"];

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

/** Selects a scene through the same chapter control exposed to the audience. */
export async function showHeroScene(page, scene) {
  const index = typeof scene === "number" ? scene : HERO_SCENES.indexOf(scene);
  if (index < 0 || index >= HERO_SCENES.length) throw new Error(`Unknown hero scene: ${scene}`);
  await page.locator(".hero-scene-nav button").nth(index).click();
  await page.waitForFunction((id) => document.querySelector(".hero")?.getAttribute("data-scene") === id, HERO_SCENES[index]);
  await page.waitForTimeout(950);
}

export async function heroPhase(page) {
  return page.evaluate(() => document.querySelector(".hero")?.getAttribute("data-scene") ?? null);
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
    .waitForFunction(() => {
      const hero = document.querySelector(".hero");
      return hero?.getAttribute("data-enhanced") === "true" || hero?.getAttribute("data-static") === "true";
    }, null, { timeout })
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
