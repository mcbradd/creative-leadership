import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import ts from 'typescript';
import { startSite } from '../scripts/lib/site-server.mjs';

const movementSource = await readFile(new URL('../src/classroom/movement.ts', import.meta.url), 'utf8');
const { moveWithCollisions, ROOM_LIMITS } = await import(`data:text/javascript;base64,${Buffer.from(ts.transpile(movementSource, {module:ts.ModuleKind.ESNext})).toString('base64')}`);
test('swept walking stops at furniture, slides along edges, and cannot leave the room', () => {
  const furniture = [{minX:-1,maxX:1,minZ:-1,maxZ:1}];
  const hit = moveWithCollisions({x:0,z:3}, 0, -10, furniture);
  assert.ok(hit.z >= 1.18 && hit.z < 1.3);
  const slide = moveWithCollisions({x:1.3,z:0}, -.5, 1, furniture);
  assert.ok(slide.x >= 1.18 && slide.z > .9);
  assert.deepEqual(moveWithCollisions({x:0,z:3}, 100, 100, []), {x:ROOM_LIMITS.maxX,z:ROOM_LIMITS.maxZ});
});

let browser, site;
before(async () => { if (!process.env.CLASSROOM_URL) site = await startSite(); browser = await chromium.launch({args:['--use-angle=swiftshader', '--enable-webgl']}); await mkdir('.impeccable/review/classroom', {recursive:true}); });
after(async () => { await browser?.close(); await site?.close(); });
const pose = async page => (await page.locator('canvas').getAttribute('data-position')).split(',').map(Number);
const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1]);

for (const [name, viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) {
  test(`${name}: first-person movement, pause, presets, discoveries, and accessible controls`, async () => {
    const context = await browser.newContext({viewport,reducedMotion:'reduce',hasTouch:name==='mobile'});
    try {
      const page = await context.newPage(); const errors=[]; page.on('pageerror', e=>errors.push(e.message));
      await page.goto(process.env.CLASSROOM_URL ?? `${site.url}/classroom/`);
      await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.position);
      await page.waitForFunction(()=>!document.querySelector('[aria-label="Rotate left"]').disabled);
      assert.equal(await page.getByRole('button',{name:'Walk inside',exact:true}).getAttribute('aria-pressed'),'true');
      await page.screenshot({path:`.impeccable/review/classroom/${name}.png`});
      const start=await pose(page);
      await page.getByRole('button',{name:'Step forward',exact:true}).click();
      await page.waitForFunction(p=>{const q=document.querySelector('canvas').dataset.position.split(',').map(Number);return Math.hypot(p[0]-q[0],p[1]-q[1])>.25;},start);
      assert.ok(distance(start,await pose(page)) > .25, 'Step control actually walks');
      await page.getByRole('button',{name:'Return to entrance',exact:true}).click();
      const leftHeading=Number(await page.locator('canvas').getAttribute('data-heading'));
      await page.getByRole('button',{name:'Rotate left',exact:true}).click();
      await page.waitForFunction(h=>Number(document.querySelector('canvas').dataset.heading)>h+.1,leftHeading);
      await page.getByRole('button',{name:'Return to entrance',exact:true}).click();
      if(name==='desktop') {
        const before=await pose(page);
        await page.keyboard.down('w');
        await page.waitForFunction(p => { const q=document.querySelector('canvas').dataset.position.split(',').map(Number); return Math.hypot(p[0]-q[0],p[1]-q[1])>.35; }, before);
        await page.keyboard.up('w');
        assert.ok(distance(before,await pose(page))>.3, 'WASD moves camera');
        const heading=await page.locator('canvas').getAttribute('data-heading');
        await page.keyboard.down('ArrowRight');
        await page.waitForFunction(h=>document.querySelector('canvas').dataset.heading!==h,heading);
        await page.keyboard.up('ArrowRight');
        assert.notEqual(await page.locator('canvas').getAttribute('data-heading'),heading);
      } else {
        const cdp = await context.newCDPSession(page);
        const stick=await page.locator('.joystick').boundingBox(); const cx=stick.x+stick.width/2,cy=stick.y+stick.height/2;
        const initial=await pose(page), heading=await page.locator('canvas').getAttribute('data-heading');
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1},{x:265,y:365,id:2}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy-30,id:1},{x:315,y:380,id:2}]});
        await page.waitForFunction(p=>{const q=document.querySelector('canvas').dataset.position.split(',').map(Number);return Math.hypot(p[0]-q[0],p[1]-q[1])>.2;},initial);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        assert.ok(distance(initial,await pose(page))>.2, 'Joystick moves while other finger looks');
        assert.notEqual(await page.locator('canvas').getAttribute('data-heading'),heading);
        await page.waitForTimeout(100); const released=await pose(page); await page.waitForTimeout(180);
        assert.ok(distance(released,await pose(page))<.005, 'Releasing touches stops walking');
        await page.setViewportSize({width:844,height:390}); await page.waitForTimeout(150);
        assert.ok(distance(released,await pose(page))<.005, 'Rotation preserves position');
        await page.screenshot({path:'.impeccable/review/classroom/landscape.png'});
        await page.setViewportSize(viewport);
      }
      await page.getByRole('button',{name:'Return to entrance',exact:true}).click();
      await page.getByRole('button',{name:'Explore board',exact:true}).click();
      const stopped=await pose(page); await page.keyboard.down('w'); await page.waitForTimeout(180); await page.keyboard.up('w');
      assert.ok(distance(stopped,await pose(page))<.005,'Panels pause walking');
      await page.getByRole('button',{name:/Next lesson/}).click();
      assert.match(await page.getByRole('button',{name:/Next lesson/}).innerText(),/2 \/ 3/);
      await page.keyboard.press('Escape');
      await page.getByRole('button',{name:'Front row',exact:true}).click(); await page.waitForTimeout(120);
      assert.ok((await pose(page))[1] < -1.5);
      await page.getByRole('button',{name:'Room overview',exact:true}).click();
      assert.equal(await page.locator('.walk-pad').count(),0);
      await page.getByRole('button',{name:'Zoom in',exact:true}).click();
      await page.getByRole('button',{name:'Walk inside',exact:true}).click();
      for(const id of ['globe','books','plant','bell']) {
        await page.getByRole('button',{name:`Explore ${id}`,exact:true}).click();
        if(id==='globe') await page.getByRole('button',{name:'Turn the globe',exact:true}).click();
        await page.keyboard.press('Escape');
      }
      assert.match(await page.locator('.discovery-count').innerText(),/5 of 5/);
      for(const light of ['Daylight','Golden hour','After hours']) {
        await page.getByRole('button',{name:light,exact:true}).click();
        const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations;
        assert.deepEqual(violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
      }
      assert.deepEqual(errors,[]);
    } finally { await context.close(); }
  });
}
