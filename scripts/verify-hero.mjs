/* Real-GPU verification for the lensed hero backdrop.
   scripts/lib/capture.mjs forces SwiftShader for fx=webgl, and the renderer
   deliberately refuses software rasterisers, so nothing else in the repo can
   prove the hero actually draws. This drives a GPU-backed Chromium instead and
   fails if the canvas is missing, blank or below 24fps.
   Manual only: stock CI runners have no GPU. */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { startSite } from "./lib/site-server.mjs";


const OUT = new URL("../outputs/hero/", import.meta.url).pathname.replace(/^\//, "");
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, scale: 1 },
  { name: "laptop", viewport: { width: 1180, height: 800 }, scale: 1 },
  { name: "mobile", viewport: { width: 390, height: 844 }, scale: 2 },
];

const site = await startSite();
const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-angle=default",
    "--enable-gpu",
    "--ignore-gpu-blocklist",
    "--enable-features=Vulkan",
    "--use-gl=angle",
  ],
});

let allGood = true;

for (const view of VIEWS) {
  const context = await browser.newContext({
    viewport: view.viewport,
    deviceScaleFactor: view.scale,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`${site.url}/?fx=webgl`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  const renderer = await page.evaluate(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return "no-webgl2";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "unknown";
  });

  await page.waitForFunction(() => document.querySelector(".hero")?.getAttribute("data-motion") === "active", null, { timeout: 8000 }).catch(() => {});

  const canvasCount = await page.locator(".hero canvas.hero-void").count();
  const staticFlag = await page.locator(".hero").getAttribute("data-static");

  // Is the canvas actually drawing, or is it a black rectangle?
  const stats = canvasCount
    ? await page.evaluate(async () => {
        const c = document.querySelector("canvas.hero-void");
        const gl = c.getContext("webgl2");
        const w = c.width, h = c.height;
        const px = new Uint8Array(w * h * 4);
        // Must sample inside the frame: without preserveDrawingBuffer the
        // buffer is cleared once the compositor has taken it.
        await new Promise((r) => requestAnimationFrame(() => { gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); r(); }));
        let lit = 0, max = 0, sum = 0;
        for (let i = 0; i < px.length; i += 4) {
          const v = Math.max(px[i], px[i + 1], px[i + 2]);
          if (v > 16) lit++;
          if (v > max) max = v;
          sum += v;
        }
        return { w, h, litFraction: lit / (w * h), max, mean: sum / (w * h) };
      })
    : null;

  // Sustained frame rate over 3 seconds.
  const fps = canvasCount
    ? await page.evaluate(() => new Promise((res) => {
        let n = 0;
        const t0 = performance.now();
        const tick = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res(n / ((performance.now() - t0) / 1000)); };
        requestAnimationFrame(tick);
      }))
    : 0;

  await page.screenshot({ path: `${OUT}${view.name}.png` });

  const ok = canvasCount === 1 && stats && stats.litFraction > 0.02 && stats.max > 90 && fps > 24;
  if (!ok) allGood = false;
  console.log(`\n[${view.name}] ${view.viewport.width}x${view.viewport.height} @${view.scale}x  ${ok ? "PASS" : "FAIL"}`);
  console.log(`  renderer   : ${renderer}`);
  console.log(`  canvas     : ${canvasCount}  data-static=${staticFlag}`);
  console.log(`  buffer     : ${stats ? `${stats.w}x${stats.h}` : "n/a"}`);
  console.log(`  lit px     : ${stats ? (stats.litFraction * 100).toFixed(2) + "%" : "n/a"}  peak=${stats?.max}  mean=${stats?.mean.toFixed(1)}`);
  console.log(`  fps        : ${fps.toFixed(1)}`);
  if (errors.length) console.log(`  errors     : ${errors.slice(0, 3).join(" | ")}`);

  await context.close();
}

await browser.close();
await site.close();
console.log(`\nshots -> ${OUT}`);
console.log(allGood ? "ALL VIEWS PASS" : "SOME VIEWS FAILED");
if (!allGood) process.exitCode = 1;
