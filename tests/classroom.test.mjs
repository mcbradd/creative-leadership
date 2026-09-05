import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { startSite } from "../scripts/lib/site-server.mjs";

let browser, site;
before(async () => { if (!process.env.CLASSROOM_URL) site = await startSite(); browser = await chromium.launch({args:["--use-angle=swiftshader", "--enable-webgl"]}); await mkdir(".impeccable/review/classroom", { recursive: true }); });
after(async () => { await browser?.close(); await site?.close(); });

for (const [name, viewport] of [["desktop", {width:1440,height:900}], ["mobile", {width:390,height:844}]]) {
  test(`${name}: classroom renders, camera and discoveries respond, and controls are accessible`, async () => {
    const context = await browser.newContext({viewport, reducedMotion:"reduce", hasTouch:name === "mobile"});
    const page = await context.newPage();
    const errors = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto(process.env.CLASSROOM_URL ?? `${site.url}/classroom/`);
    await page.getByRole("button", {name:"Zoom in", exact:true}).waitFor();
    await page.waitForFunction(() => !document.querySelector('[aria-label="Zoom in"]').disabled);
    assert.equal(await page.locator("canvas").count(), 1);
    await page.screenshot({path:`.impeccable/review/classroom/${name}.png`});
    const initial = await page.locator("canvas").screenshot();
    await page.getByRole("button", {name:"Rotate right", exact:true}).click();
    const rotated = await page.locator("canvas").screenshot();
    assert.notDeepEqual(initial, rotated, "Camera controls must change the rendered view");
    await page.getByRole("button", {name:"Take a seat", exact:true}).click();
    assert.equal(await page.getByRole("button", {name:"Take a seat",exact:true}).getAttribute("aria-pressed"), "true");
    await page.getByRole("button", {name:"Reset camera",exact:true}).click();
    await page.getByRole("button", {name:"Golden hour", exact:true}).click();
    assert.equal(await page.locator("main").getAttribute("class"), "classroom light-golden");
    await page.getByRole("button", {name:"After hours", exact:true}).click();
    let violations = (await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations;
    assert.deepEqual(violations.map(v => ({id:v.id, nodes:v.nodes.map(n=>n.target)})), []);
    await page.getByRole("button", {name:"Daylight", exact:true}).click();
    for (const id of ["globe", "board", "books", "plant", "bell"]) {
      await page.getByRole("button", {name:`Explore ${id}`, exact:true}).click();
      if (id === "globe") { await page.getByRole("button", {name:"Turn the globe",exact:true}).click(); assert.equal(await page.getByRole("button", {name:"Turn the globe",exact:true}).count(), 1); }
      if (id === "board") { await page.getByRole("button", {name:/Next lesson/}).click(); assert.match(await page.getByRole("button", {name:/Next lesson/}).innerText(), /2 \/ 3/); }
      await page.keyboard.press("Escape"); assert.equal(await page.locator(".discovery-panel").count(), 0);
    }
    assert.match(await page.locator(".discovery-count").innerText(), /5 of 5/);
    violations = (await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations;
    assert.deepEqual(violations.map(v => ({id:v.id, nodes:v.nodes.map(n=>n.target)})), []);
    assert.deepEqual(errors, []);
    await context.close();
  });
}
