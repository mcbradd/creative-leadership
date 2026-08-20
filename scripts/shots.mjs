/**
 * Screenshot harness.
 *
 *   node scripts/shots.mjs                       # all viewports, motion tier
 *   node scripts/shots.mjs --viewport=desktop --fx=webgl
 *   node scripts/shots.mjs --out=outputs/baseline # write a visual-diff baseline
 *   SITE_URL=https://... node scripts/shots.mjs   # shoot a deployed build
 *
 * Writes outputs/shots/<viewport>/<name>.png (outputs/ is gitignored).
 */
import { rm } from "node:fs/promises";
import path from "node:path";
import {
  SECTIONS,
  freezeHeroMotion,
  launch,
  openPage,
  parseFlags,
  pickViewports,
  shoot,
  waitForHeroMotion,
} from "./lib/capture.mjs";
import { withSite } from "./lib/site-server.mjs";

const flags = parseFlags(process.argv.slice(2));
const fx = flags.fx === undefined ? "motion" : flags.fx === true ? "motion" : String(flags.fx);
const outRoot = path.resolve(String(flags.out ?? "outputs/shots"));
const deviceScaleFactor = Number(flags.dsf ?? 1);
const live = Boolean(flags.live);
const viewports = pickViewports(flags.viewport);

await rm(outRoot, { recursive: true, force: true });

async function captureHero(browser, { url, viewport, fx, deviceScaleFactor, outDir, active }) {
  const { page, context } = await openPage(browser, {
    url,
    viewport,
    fx,
    live: active,
    deviceScaleFactor,
  });

  try {
    await waitForHeroMotion(page, active ? "active" : "reduced");
    if (active) await freezeHeroMotion(page);
    return await shoot(page, outDir, active ? "hero-active" : "hero-stable");
  } finally {
    await context.close();
  }
}

const shots = await withSite(async (url) => {
  const browser = await launch(fx);
  const written = [];

  try {
    for (const [viewportName, viewport] of viewports) {
      const before = written.length;
      const outDir = path.join(outRoot, viewportName);

      written.push(await captureHero(browser, { url, viewport, fx, deviceScaleFactor, outDir, active: false }));
      written.push(await captureHero(browser, { url, viewport, fx, deviceScaleFactor, outDir, active: true }));

      const { page, context } = await openPage(browser, { url, viewport, fx, live, deviceScaleFactor });
      try {
        for (const id of SECTIONS) {
          await page.evaluate((sectionId) => {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: "instant", block: "start" });
          }, id);
          await page.waitForTimeout(250);
          written.push(await shoot(page, outDir, `section-${id}`));
        }
      } finally {
        await context.close();
      }

      console.log(`${viewportName}: ${written.length - before} shots`);
    }
  } finally {
    await browser.close();
  }

  return written;
});

console.log(`\n${shots.length} screenshots → ${outRoot}`);
