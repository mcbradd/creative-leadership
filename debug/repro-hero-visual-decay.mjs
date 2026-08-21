/* Debug-only reproduction for the three reported WebGL hero regressions.
 *
 * This file intentionally lives outside src/ and does not patch production
 * modules. It instruments WebGL from Playwright before the app starts, drives
 * the real hero, and writes evidence under outputs/debug-hero-visual-decay/.
 */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import { startSite } from "../scripts/lib/site-server.mjs";

const OUT = new URL("../outputs/debug-hero-visual-decay/", import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (m) => m.slice(1));
mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 1440, height: 900 };
const DPR = 2;
const TARGET_SIM_SECONDS = 30;
// Baseline ruler: 70 points / 189px = 37.0 points per 100px. A real stack is
// either a severe cluster or a dense alignment that persists across frames;
// an isolated three- or four-point crossing is ordinary orbital coincidence.
const MAX_RULER_DENSITY_PER_100_PX = 8;
const MAX_RULER_CLUSTER_POINTS = 12;
const MAX_DENSE_FRAME_FRACTION = 0.05;

function decode(buffer) {
  return PNG.sync.read(buffer);
}

function luma(data, at) {
  return 0.2126 * data[at] + 0.7152 * data[at + 1] + 0.0722 * data[at + 2];
}

function percentile(values, p) {
  if (!values.length) return 0;
  values.sort((a, b) => a - b);
  return values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))];
}

function textStats(normalBuffer, maskBuffer) {
  const normal = decode(normalBuffer);
  const mask = decode(maskBuffer);
  assert.equal(normal.width, mask.width);
  assert.equal(normal.height, mask.height);

  const interior = [];
  const edgeRetention = [];
  let edgePixels = 0;
  let referenceDarkEdgePixels = 0;
  for (let at = 0; at < mask.data.length; at += 4) {
    const m = luma(mask.data, at);
    const value = luma(normal.data, at);
    if (m >= 230) interior.push(value);
    else if (m >= 8) {
      edgePixels += 1;
      if (m < 24) referenceDarkEdgePixels += 1;
      edgeRetention.push(value / m);
    }
  }

  return {
    interiorPixels: interior.length,
    edgePixels,
    interiorP10: percentile(interior, 0.10),
    interiorMedian: percentile(interior, 0.50),
    interiorDarkFraction: interior.filter((v) => v < 48).length / Math.max(1, interior.length),
    referenceDarkEdgeFraction: referenceDarkEdgePixels / Math.max(1, edgePixels),
    edgeRetentionP10: percentile(edgeRetention, 0.10),
    edgeRetentionMedian: percentile(edgeRetention, 0.50),
  };
}

function particleStats(frames, edges) {
  let maxRulerDensityPer100Px = 0;
  let maxRulerClusterPoints = 0;
  let worst = null;
  const tolerance = 2.5 * DPR;
  const denseFrames = new Map();

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
    const frame = frames[frameIndex];
    for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex += 1) {
      const edge = edges[edgeIndex];
      for (const [side, xEdge] of [["left", edge.left], ["right", edge.right]]) {
        const hits = frame.filter((point) =>
          Math.abs(point.x - xEdge) <= tolerance &&
          point.y >= edge.bottom - tolerance &&
          point.y <= edge.top + tolerance,
        );
        const ys = hits.map((p) => p.y);
        const span = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
        // Require a visible vertical span so a compact glow is not mistaken for
        // the reported ruler-straight stack along a glyph/line edge.
        if (span <= 16 * DPR) continue;
        maxRulerClusterPoints = Math.max(maxRulerClusterPoints, hits.length);
        const densityPer100Px = hits.length / span * 100;
        const key = `${edgeIndex}:${side}`;
        if (densityPer100Px > MAX_RULER_DENSITY_PER_100_PX) denseFrames.set(key, (denseFrames.get(key) ?? 0) + 1);
        if (densityPer100Px <= maxRulerDensityPer100Px) continue;
        maxRulerDensityPer100Px = densityPer100Px;
        worst = { frameIndex, x: xEdge, count: hits.length, pointIndices: hits.map((point) => point.index), verticalSpan: span, densityPer100Px };
      }
    }
  }

  const maxDenseFrameFraction = Math.max(0, ...[...denseFrames.values()].map((count) => count / Math.max(1, frames.length)));
  return { frames: frames.length, maxRulerDensityPer100Px, maxRulerClusterPoints, maxDenseFrameFraction, worst };
}

function diskStats(buffer) {
  const png = decode(buffer);
  const { width, height, data } = png;
  // The desktop framing contract parks the well in the right half. This crop
  // contains the accretion disk while excluding the payoff text on the left.
  const x0 = Math.floor(width * 0.46);
  const x1 = width - 2;
  const y0 = 2;
  const y1 = Math.floor(height * 0.82);
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  let gradientPixels = 0;
  let brightPixels = 0;
  const tileSize = 72;
  const tileCols = Math.ceil(width / tileSize);
  const tileRows = Math.ceil(height / tileSize);
  const tileXX = new Float64Array(tileCols * tileRows);
  const tileYY = new Float64Array(tileCols * tileRows);
  const tileXY = new Float64Array(tileCols * tileRows);

  const sample = (x, y) => luma(data, (y * width + x) * 4);
  const diskLike = (x, y) => {
    const at = (y * width + x) * 4;
    const r = data[at];
    const g = data[at + 1];
    const b = data[at + 2];
    return Math.max(r, b) > 32 && Math.max(r, b) - g > 8;
  };

  for (let y = y0 + 1; y < y1 - 1; y += 1) {
    for (let x = x0 + 1; x < x1 - 1; x += 1) {
      if (!diskLike(x, y)) continue;
      brightPixels += 1;
      const gx = sample(x + 1, y) - sample(x - 1, y);
      const gy = sample(x, y + 1) - sample(x, y - 1);
      const mag2 = gx * gx + gy * gy;
      if (mag2 < 36) continue;
      sxx += gx * gx;
      syy += gy * gy;
      sxy += gx * gy;
      const tile = Math.floor(y / tileSize) * tileCols + Math.floor(x / tileSize);
      tileXX[tile] += gx * gx;
      tileYY[tile] += gy * gy;
      tileXY[tile] += gx * gy;
      gradientPixels += 1;
    }
  }

  const trace = sxx + syy;
  const root = Math.sqrt(Math.max(0, (sxx - syy) ** 2 + 4 * sxy * sxy));
  let localRoot = 0;
  let localTrace = 0;
  for (let tile = 0; tile < tileXX.length; tile += 1) {
    const xx = tileXX[tile];
    const yy = tileYY[tile];
    const xy = tileXY[tile];
    const tileTrace = xx + yy;
    if (tileTrace < 1) continue;
    localRoot += Math.sqrt(Math.max(0, (xx - yy) ** 2 + 4 * xy * xy));
    localTrace += tileTrace;
  }
  return {
    width,
    height,
    brightPixels,
    gradientPixels,
    anisotropy: trace ? root / trace : 1,
    localAnisotropy: localTrace ? localRoot / localTrace : 1,
  };
}

function outerEdgeDelta(aBuffer, bBuffer) {
  const a = decode(aBuffer);
  const b = decode(bBuffer);
  assert.equal(a.width, b.width);
  assert.equal(a.height, b.height);
  const { width, height } = a;
  // Outer/right feed edge of the wide desktop accretion disk.
  const x0 = Math.floor(width * 0.84);
  const y0 = Math.floor(height * 0.08);
  const y1 = Math.floor(height * 0.76);
  let sumDelta = 0;
  let sumSignal = 0;
  let pixels = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      const av = luma(a.data, at);
      const bv = luma(b.data, at);
      const ar = a.data[at];
      const ab = a.data[at + 2];
      const br = b.data[at];
      const bb = b.data[at + 2];
      if (Math.max(ar, ab, br, bb) < 24) continue;
      sumDelta += Math.abs(av - bv);
      sumSignal += Math.max(av, bv);
      pixels += 1;
    }
  }
  return { pixels, normalizedDelta: sumDelta / Math.max(1, sumSignal) };
}

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

let context;
try {
  context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DPR, reducedMotion: "no-preference" });

  // Instrument the exact WebGL point stream before React imports the hero.
  // A seeded RNG makes the otherwise random debris layout reproducible.
  await context.addInitScript(() => {
    let seed = 0x5eed1234;
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };

    window.__heroProbe = { frames: [], simTime: 0, octaves: 0, steps: 0, quality: [] };
    const names = new WeakMap();
    const getUniformLocation = WebGL2RenderingContext.prototype.getUniformLocation;
    WebGL2RenderingContext.prototype.getUniformLocation = function(program, name) {
      const location = getUniformLocation.call(this, program, name);
      if (location) names.set(location, name);
      return location;
    };
    const uniform1f = WebGL2RenderingContext.prototype.uniform1f;
    WebGL2RenderingContext.prototype.uniform1f = function(location, value) {
      if (location) {
        const name = names.get(location);
        if (name === "uTime") window.__heroProbe.simTime = value;
        if (name === "uOctaves") window.__heroProbe.octaves = value;
        if (name === "uSteps") window.__heroProbe.steps = value;
        if (name === "uOctaves" || name === "uSteps") {
          window.__heroProbe.quality.push({ name, value, at: performance.now() });
        }
      }
      return uniform1f.call(this, location, value);
    };

    const bufferSubData = WebGL2RenderingContext.prototype.bufferSubData;
    WebGL2RenderingContext.prototype.bufferSubData = function(target, offset, source, srcOffset = 0, length) {
      if (target === this.ARRAY_BUFFER && source instanceof Float32Array) {
        const end = length === undefined ? source.length : srcOffset + length;
        this.__heroPointUpload = source.slice(srcOffset, end);
      }
      return bufferSubData.apply(this, arguments);
    };
    const drawArrays = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function(mode, first, count) {
      if (mode === this.POINTS && this.__heroPointUpload) {
        const upload = this.__heroPointUpload;
        const points = [];
        for (let i = 0; i < count; i += 1) points.push({ x: upload[i * 6], y: upload[i * 6 + 1], index: i });
        window.__heroProbe.frames.push(points);
        if (window.__heroProbe.frames.length > 360) window.__heroProbe.frames.shift();
      }
      return drawArrays.call(this, mode, first, count);
    };
  });

  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(`${site.url}/?fx=webgl`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector(".hero")?.getAttribute("data-motion") === "active", null, { timeout: 10_000 });
  await page.waitForFunction(() => window.__heroProbe?.simTime >= 1.5, null, { timeout: 10_000 });
  assert.equal(await page.locator(".hero canvas.hero-void").count(), 1, "real WebGL hero canvas did not mount");

  const renderer = await page.evaluate(() => {
    const canvas = document.querySelector("canvas.hero-void");
    const gl = canvas?.getContext("webgl2");
    if (!gl) return "no-webgl2";
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "unknown";
  });

  const payoff = page.locator(".hero-payoff");
  const normalText = await payoff.screenshot({ animations: "disabled" });
  writeFileSync(`${OUT}/payoff-live.png`, normalText);

  const savedStyles = await page.evaluate(() => {
    const payoff = document.querySelector(".hero-payoff");
    const canvas = document.querySelector("canvas.hero-void");
    const furniture = [...document.querySelectorAll(".hero-grid,.hero-light-field,.hero-orbit")];
    const saved = {
      payoff: payoff?.getAttribute("style"),
      canvas: canvas?.getAttribute("style"),
      furniture: furniture.map((node) => node.getAttribute("style")),
    };
    payoff?.setAttribute("style", `${payoff.getAttribute("style") ?? ""};color:#fff!important;-webkit-text-fill-color:#fff!important;background:none!important;text-shadow:none!important`);
    canvas?.setAttribute("style", `${canvas.getAttribute("style") ?? ""};visibility:hidden!important`);
    furniture.forEach((node) => node.setAttribute("style", `${node.getAttribute("style") ?? ""};visibility:hidden!important`));
    return saved;
  });
  const textMask = await payoff.screenshot({ animations: "disabled" });
  writeFileSync(`${OUT}/payoff-reference-mask.png`, textMask);
  await page.evaluate((saved) => {
    const restore = (node, value) => value === null ? node?.removeAttribute("style") : node?.setAttribute("style", value);
    restore(document.querySelector(".hero-payoff"), saved.payoff);
    restore(document.querySelector("canvas.hero-void"), saved.canvas);
    [...document.querySelectorAll(".hero-grid,.hero-light-field,.hero-orbit")].forEach((node, i) => restore(node, saved.furniture[i]));
  }, savedStyles);

  const text = textStats(normalText, textMask);
  const initialDisk = await page.locator("canvas.hero-void").screenshot();
  writeFileSync(`${OUT}/disk-start.png`, initialDisk);
  const qualityStart = await page.evaluate(() => ({ octaves: window.__heroProbe.octaves, steps: window.__heroProbe.steps }));

  // Three-times simulation speed preserves the production path while keeping a
  // 30-second decay repro under roughly 12 wall-clock seconds.
  await page.evaluate(async () => {
    const { setHeroParam } = await import("/src/hero/params.ts");
    setHeroParam("timeScale", 3);
  });
  await page.waitForFunction((target) => window.__heroProbe?.simTime >= target, TARGET_SIM_SECONDS, { timeout: 20_000 });
  const lateDisk = await page.locator("canvas.hero-void").screenshot();
  writeFileSync(`${OUT}/disk-30s.png`, lateDisk);
  const qualityLate = await page.evaluate(() => ({ octaves: window.__heroProbe.octaves, steps: window.__heroProbe.steps, history: window.__heroProbe.quality }));
  const lateTime = await page.evaluate(() => window.__heroProbe.simTime);
  await page.waitForFunction((target) => window.__heroProbe?.simTime >= target, lateTime + 1, { timeout: 5_000 });
  const lateDiskNext = await page.locator("canvas.hero-void").screenshot();
  writeFileSync(`${OUT}/disk-31s.png`, lateDiskNext);

  const particleProbe = await page.evaluate(() => {
    const canvas = document.querySelector("canvas.hero-void");
    const hero = canvas?.parentElement;
    const heading = hero?.querySelector("h1");
    if (!canvas || !heading) return { frames: [], edges: [], penetration: { centers: 0, inside: 0, fraction: 1, maxPerFrame: Infinity } };
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    const range = document.createRange();
    range.selectNodeContents(heading);
    const edges = [...range.getClientRects()].map((box) => ({
      left: (box.left - canvasRect.left) * scaleX,
      right: (box.right - canvasRect.left) * scaleX,
      top: canvas.height - (box.top - canvasRect.top) * scaleY,
      bottom: canvas.height - (box.bottom - canvasRect.top) * scaleY,
    }));

    // Rebuild the production glyph-alpha collider and score the exact point
    // centers uploaded to WebGL. Debris is projected toward the camera before
    // drawing, so testing its private orbit state would miss visible overlaps.
    const box = heading.getBoundingClientRect();
    const pad = 5;
    const bandLeft = box.left - canvasRect.left - pad;
    const bandTop = box.top - canvasRect.top - pad;
    const bandWidth = box.width + pad * 2;
    const bandHeight = box.height + pad * 2;
    const width = Math.max(1, Math.ceil(bandWidth * scaleX));
    const height = Math.max(1, Math.ceil(bandHeight * scaleY));
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;
    const ctx = maskCanvas.getContext("2d", { willReadFrequently: true });
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const glyphRange = document.createRange();
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent) continue;
      const styles = getComputedStyle(parent);
      ctx.font = `${styles.fontStyle} ${styles.fontWeight} ${parseFloat(styles.fontSize)}px ${styles.fontFamily}`;
      const value = node.textContent ?? "";
      for (let index = 0; index < value.length; index += 1) {
        if (/\s/.test(value[index])) continue;
        glyphRange.setStart(node, index);
        glyphRange.setEnd(node, index + 1);
        const glyph = glyphRange.getBoundingClientRect();
        if (glyph.width < 0.5 || glyph.height < 0.5) continue;
        ctx.save();
        ctx.translate(
          (glyph.left + glyph.width / 2 - canvasRect.left - bandLeft) * scaleX,
          (glyph.top + glyph.height / 2 - canvasRect.top - bandTop) * scaleY,
        );
        ctx.scale(scaleX, scaleY);
        ctx.fillText(value[index], 0, 0);
        ctx.restore();
      }
    }
    const alpha = ctx.getImageData(0, 0, width, height).data;
    const maskBottom = canvas.height - (bandTop + bandHeight) * scaleY;
    const frames = window.__heroProbe.frames;
    const scoredFrames = frames.slice(-60);
    const sparkCounts = [460, 360, 260, 170, 110];
    let centers = 0;
    let inside = 0;
    let maxPerFrame = 0;
    for (const frame of scoredFrames) {
      const mainCount = sparkCounts.find((count) => count <= frame.length) ?? frame.length;
      let frameInside = 0;
      for (let index = 0; index < mainCount; index += 1) {
        const point = frame[index];
        const ix = Math.floor(point.x - bandLeft * scaleX);
        const iy = Math.floor(height - 1 - (point.y - maskBottom));
        centers += 1;
        if (ix < 0 || iy < 0 || ix >= width || iy >= height) continue;
        if (alpha[(iy * width + ix) * 4 + 3] < 48) continue;
        inside += 1;
        frameInside += 1;
      }
      maxPerFrame = Math.max(maxPerFrame, frameInside);
    }
    return { frames, edges, penetration: { centers, inside, fraction: inside / Math.max(1, centers), maxPerFrame } };
  });
  const particles = particleStats(particleProbe.frames, particleProbe.edges);
  const penetration = particleProbe.penetration;
  const diskStart = diskStats(initialDisk);
  const diskLate = diskStats(lateDisk);
  const feed = outerEdgeDelta(lateDisk, lateDiskNext);
  const anisotropyGrowth = diskLate.anisotropy - diskStart.anisotropy;
  const localAnisotropyGrowth = diskLate.localAnisotropy - diskStart.localAnisotropy;

  const checks = [
    {
      name: "payoff stays emissive",
      ok: text.interiorP10 >= 48 && text.interiorDarkFraction <= 0.15,
      detail: `interior p10=${text.interiorP10.toFixed(1)}/255 dark=${(text.interiorDarkFraction * 100).toFixed(1)}% (need p10>=48 and dark<=15%)`,
    },
    {
      name: "payoff edges retain antialiased light",
      // A perfect white browser reference itself has 39.5% of antialiased edge
      // pixels under 24/255, so absolute darkness cannot be the quality signal.
      // P10 >= .50 means at least 90% retain half the reference edge luminance.
      ok: text.edgeRetentionP10 >= 0.50,
      detail: `edge retention p10=${text.edgeRetentionP10.toFixed(3)}x median=${text.edgeRetentionMedian.toFixed(3)}x (need p10>=0.500x; white-reference dark=${(text.referenceDarkEdgeFraction * 100).toFixed(1)}%)`,
    },
    {
      name: "particles deflect without vertical edge stacks",
      ok: particles.maxRulerClusterPoints <= MAX_RULER_CLUSTER_POINTS && particles.maxDenseFrameFraction <= MAX_DENSE_FRAME_FRACTION,
      detail: `max cluster=${particles.maxRulerClusterPoints} points, max density=${particles.maxRulerDensityPer100Px.toFixed(2)}/100px, dense-frame persistence=${(particles.maxDenseFrameFraction * 100).toFixed(1)}% (need cluster<=${MAX_RULER_CLUSTER_POINTS} and >${MAX_RULER_DENSITY_PER_100_PX.toFixed(2)}/100px in <=${(MAX_DENSE_FRAME_FRACTION * 100).toFixed(1)}% frames)${particles.worst ? `; densest=${particles.worst.count} over ${particles.worst.verticalSpan.toFixed(1)}px at x=${particles.worst.x.toFixed(1)}` : ""}`,
    },
    {
      name: "particles deflect outside real glyph alpha",
      ok: penetration.fraction <= 0.001 && penetration.maxPerFrame <= 3,
      detail: `visible center penetration=${(penetration.fraction * 100).toFixed(3)}% (${penetration.inside}/${penetration.centers}), max=${penetration.maxPerFrame}/frame (need <=0.100% and <=3/frame)`,
    },
    {
      name: "disk texture does not shear into a stretched field by 30s",
      ok: localAnisotropyGrowth <= 0.08,
      detail: `local anisotropy start=${diskStart.localAnisotropy.toFixed(3)} late=${diskLate.localAnisotropy.toFixed(3)} growth=${localAnisotropyGrowth.toFixed(3)} (need growth<=0.080)`,
    },
    {
      name: "outer disk visibly replenishes after 30s",
      ok: feed.pixels >= 500 && feed.normalizedDelta >= 0.025,
      detail: `outer-edge temporal delta=${feed.normalizedDelta.toFixed(4)} over ${feed.pixels} lit px (need >=0.0250)`,
    },
  ];

  const report = { renderer, targetSimSeconds: TARGET_SIM_SECONDS, text, particles, penetration, qualityStart, qualityLate, diskStart, diskLate, anisotropyGrowth, localAnisotropyGrowth, outerFeed: feed, errors, checks };
  writeFileSync(`${OUT}/report.json`, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`renderer: ${renderer}`);
  console.log(`quality: ${qualityStart.steps} steps/${qualityStart.octaves} octaves -> ${qualityLate.steps} steps/${qualityLate.octaves} octaves`);
  for (const check of checks) console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
  console.log(`artifacts: ${OUT}`);
  if (errors.length) console.log(`browser errors: ${errors.slice(0, 3).join(" | ")}`);
  if (checks.some((check) => !check.ok)) process.exitCode = 1;
} finally {
  await context?.close();
  await browser.close();
  await site.close();
}
