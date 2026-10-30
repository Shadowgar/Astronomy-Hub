import {chromium} from '../../node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.P0_URL||'http://127.0.0.1:4230',out=process.env.P0_CONTROLS_OUT||'output/playwright/p0-native-satellites/tracking-controls';await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),proof={status:'RUNNING',runs:[]};
try{for(const viewport of [{width:1440,height:900},{width:390,height:900},{width:667,height:390}]){
 const context=await browser.newContext({viewport,hasTouch:viewport.width<768}),page=await context.newPage(),run={viewport};proof.runs.push(run);page.setDefaultTimeout(7000);
 try{await page.goto(base+'/sky-engine');await page.locator('[data-runtime-status=ready]').waitFor({timeout:60000});const frame=page.frames().find(f=>f.url().includes('/oras-sky-engine/'));
 await frame.waitForFunction(()=>{const o=window.__ORAS_STEL?.getObj('NORAD 25544');if(!o)return false;o.destroy();return true;},null,{timeout:30000});
 const state=()=>frame.evaluate(()=>{const c=window.__ORAS_STEL.core;return {utc:c.observer.utc,speed:c.time_speed,selection:c.selection?.jsonData?.model_data?.norad_number,lock:c.lock?.jsonData?.model_data?.norad_number??null,navigation:window.orasSkyAdapter.navigation()};});
 // Source-backed native selection is setup for this layout regression. The
 // separate Live proof selects a moving point using real pointer/touch input.
 await frame.evaluate(()=>{const s=window.__ORAS_STEL,o=s.getObj('NORAD 25544');s.core.selection=o;o.destroy();});
 await frame.waitForFunction(()=>window.orasSkyAdapter.snapshot().selection?.trackable===true);
 await page.getByRole('button',{name:'Track',exact:true}).first().waitFor({state:'visible',timeout:10000});
 run.before=await state();await page.getByRole('button',{name:'Track',exact:true}).first().click();await frame.waitForFunction(()=>window.__ORAS_STEL.core.lock?.jsonData?.model_data?.norad_number===25544);run.tracked=await state();
 const stop=viewport.width>=768?page.getByRole('region',{name:'Selected object',exact:true}).getByRole('button',{name:'Stop tracking',exact:true}):page.getByRole('button',{name:'Stop tracking',exact:true}).first();
 run.stopHit=await stop.evaluate(button=>{const r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {bounds:r.toJSON(),hit:hit?.outerHTML,reachable:button===hit||button.contains(hit)};});
 await page.screenshot({path:`${out}/${viewport.width}-before-stop.png`});await stop.click();await frame.waitForFunction(()=>!window.__ORAS_STEL.core.lock);run.stopped=await state();assert.equal(run.stopped.speed,run.before.speed);assert.deepEqual(run.stopped.navigation.observer,run.before.navigation.observer);assert.equal(run.stopped.navigation.camera.fovRad,run.before.navigation.camera.fovRad);run.status='PASS';
 }catch(error){run.status='FAIL';run.error=error.stack;run.body=await page.locator('body').innerText();await page.screenshot({path:`${out}/${viewport.width}-failure.png`});throw error;}finally{await context.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');}
}proof.status='PASS';}catch(error){proof.status='FAIL';console.error(error.stack);process.exitCode=1;}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');}
