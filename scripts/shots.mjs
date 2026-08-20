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
  HERO_PROGRESS,
  SECTIONS,
  heroPhase,
  isHeroStatic,
  launch,
  openPage,
  parseFlags,
  pickViewports,
  scrollHeroTo,
  settle,
  shoot,
  waitForCinematic,
} from "./lib/capture.mjs";
import { withSite } from "./lib/site-server.mjs";

const flags = parseFlags(process.argv.slice(2));
const fx = flags.fx === undefined ? "motion" : flags.fx === true ? "motion" : String(flags.fx);
const outRoot = path.resolve(String(flags.out ?? "outputs/shots"));
const deviceScaleFactor = Number(flags.dsf ?? 1);
const live = Boolean(flags.live);
const viewports = pickViewports(flags.viewport);

await rm(outRoot, { recursive: true, force: true });

const shots = await withSite(async (url) => {
  const browser = await launch(fx);
  const written = [];

  try {
    for (const [viewportName, viewport] of viewports) {
      const before = written.length;
      const { page, context } = await openPage(browser, { url, viewport, fx, live, deviceScaleFactor });
      const outDir = path.join(outRoot, viewportName);

      if (await isHeroStatic(page)) {
        // Static/motion tiers pin the hero to the payoff poster — six identical
        // scroll shots would be noise. Use --fx=webgl --live for the cinematic.
        written.push(await shoot(page, outDir, "hero-static"));
      } else {
        await waitForCinematic(page);
        for (const progress of HERO_PROGRESS) {
          await scrollHeroTo(page, progress);
          const phase = await heroPhase(page);
          written.push(await shoot(page, outDir, `hero-${String(progress).replace(".", "_")}-${phase}`));
        }
      }

      for (const id of SECTIONS) {
        await page.evaluate((sectionId) => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: "instant", block: "start" });
        }, id);
        await page.waitForTimeout(250);
        written.push(await shoot(page, outDir, `section-${id}`));
      }

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await settle(page, 200);
      await context.close();
      console.log(`${viewportName}: ${written.length - before} shots`);
    }
  } finally {
    await browser.close();
  }

  return written;
});

console.log(`\n${shots.length} screenshots → ${outRoot}`);
