import { chromium } from '../../node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.INTEGRATION_BASE||'http://127.0.0.1:4220', out=process.env.INTEGRATION_OUT||'output/earth-sky-completion/recovery';
await mkdir(out,{recursive:true});
const browser=await chromium.launch(), proof={status:'RUNNING',checks:[],errors:[]};
try {
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}), page=await context.newPage();
 page.setDefaultTimeout(15000);page.on('pageerror',e=>proof.errors.push(e.message));
 const ready=mode=>page.locator(`[data-runtime-mode=${mode}][data-runtime-status=ready]`).waitFor({timeout:90000});
 const sky=()=>page.frames().find(f=>f.url().includes('/oras-sky-engine/'));
 await page.goto(base+'/sky-engine?date=2026-08-13T04:00:00Z');await ready('sky');
 const before=await sky().evaluate(()=>window.orasSkyAdapter.navigation());
 await sky().getByRole('button',{name:'Observing tools',exact:true}).click();
 for(const control of ['landscape','atmosphere']) {
   const toggle=sky().locator(`[data-sky-control=${control}]`);
   const initial=await toggle.getAttribute('aria-pressed');await toggle.click();assert.notEqual(await toggle.getAttribute('aria-pressed'),initial);await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),initial);
 }
 await sky().getByRole('button',{name:'Close Observing tools'}).click();
 await sky().getByRole('button',{name:'Display',exact:true}).click();const night=sky().locator('[data-sky-control=night]');await night.click();assert.equal(await sky().evaluate(()=>document.querySelector('#app').__vue__.$store.state.nightmode),true);await night.click();await sky().getByRole('button',{name:'Close Display'}).click();assert.deepEqual(await sky().evaluate(()=>window.orasSkyAdapter.navigation()),before);proof.checks.push('Landscape, atmosphere and Night Mode toggle independently without changing UTC/observer/camera');
 const box=await sky().locator('#stel-canvas').boundingBox(),cdp=await context.newCDPSession(page);
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 // Same bounded genuine wheel dispatch used by the accepted controller harness.
 const epoch=Date.now()/1000;
 await Promise.all(Array.from({length:240},(_,i)=>new Promise(r=>setTimeout(r,i*20)).then(()=>cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:box.x+box.width/2,y:box.y+box.height/2,deltaX:0,deltaY:[16,14,12,13,8,16,19,14][i%8],timestamp:epoch+i*.02}))));
 await ready('earth');assert.equal(await page.locator('iframe').count(),1);
 proof.checks.push('Genuine continuous wheel continuation enters Earth with one native renderer');
 await page.getByRole('button',{name:'Choose exploration mode',exact:true}).click();
 await page.getByRole('navigation',{name:'Exploration modes'}).getByRole('button',{name:'Solar System',exact:true}).click();
 await page.locator('[data-solar-status=ready]').waitFor({timeout:30000});
 assert.equal(Date.parse((await page.evaluate(()=>window.orasSolarDiagnostics())).epoch),Date.parse(before.utc));
 await page.evaluate(()=>document.querySelector('.solar-canvas canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await page.getByRole('alert').filter({hasText:'renderer stopped'}).waitFor();
 assert.equal(await page.locator('.solar-canvas canvas').count(),0);
 await page.getByRole('button',{name:'Retry Solar System'}).click();
 await page.locator('[data-solar-status=ready]').waitFor({timeout:30000});
 assert.equal(await page.locator('.solar-canvas canvas').count(),1);
 proof.checks.push('Actual Solar WebGL loss disposes the canvas; explicit retry recreates one renderer');
 await page.getByRole('button',{name:'Return to Earth'}).click();await ready('earth');
 assert.equal(await page.evaluate(()=>typeof window.orasSolarDiagnostics),'undefined');
 proof.checks.push('Recovered Solar renderer is disposed on Earth return');
 assert.deepEqual(proof.errors,[]);proof.status='PASS';
} catch(error) {proof.status='FAIL';proof.error=error.stack;process.exitCode=1;console.error(error.stack)}
finally {await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2));console.log(proof.status,proof.checks)}
