// Real browser regression: choosing a location must uncover map controls.
// Windows runner: use Windows node.exe; Linux defaults to installed Chromium.
import {chromium} from '../../node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.OWNER_URL||'http://localhost:4231',out=process.env.OWNER_OUT||'output/playwright/owner-acceptance/earth-search';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:process.platform!=='win32',...(process.platform==='win32'?{executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']}: {})});const proof={base,runs:[]};
try{for(const [width,height]of [[390,844],[844,390],[1440,900]]){
 const c=await browser.newContext({viewport:{width,height},hasTouch:width<900}),p=await c.newPage(),run={width,height};proof.runs.push(run);
 try{await p.goto(base+'/earth?date=2026-10-27T04:00:00Z');await p.locator('[data-runtime-mode=earth][data-runtime-status=ready]').waitFor({timeout:90000});
 await p.getByLabel('Search Earth',{exact:true}).fill('41.321903, -79.585394');await p.getByRole('button',{name:'Search Earth',exact:true}).click();
 await p.getByRole('list',{name:'Earth search results'}).getByRole('button').click();await p.getByRole('status').filter({hasText:'Approaching location…'}).waitFor({state:'hidden'});
 await p.screenshot({path:`${out}/${width}-selected.png`});assert.equal(await p.getByRole('button',{name:'Show search results and location'}).getAttribute('aria-expanded'),'false','Successful selection must collapse the results covering native controls');
 const frame=p.frames().find(f=>f.url().includes('/earth-runtime/')),before=await frame.evaluate(()=>window.orasEarthDiagnostics().cameraHeightM);
 await p.getByRole('button',{name:'Zoom in',exact:true}).click();await frame.waitForFunction(h=>window.orasEarthDiagnostics().cameraHeightM<h,before);run.pointerZoom=true;
 await p.getByRole('button',{name:'Show search results and location'}).click();assert.equal(await p.getByRole('list',{name:'Earth search results'}).isVisible(),true);run.resultsReopen=true;
 await p.getByRole('list',{name:'Earth search results'}).getByRole('button').focus();await p.keyboard.press('Enter');await p.getByRole('status').filter({hasText:'Approaching location…'}).waitFor({state:'hidden'});assert.equal(await p.getByRole('button',{name:'Show search results and location'}).evaluate(e=>document.activeElement===e),true);run.keyboardFocusRetained=true;assert.equal(await p.getByRole('region',{name:'Selected location'}).isVisible(),true);run.selectedLocationRetained=true;
 await p.getByLabel('Search Earth',{exact:true}).fill('91, 200');await p.getByRole('button',{name:'Search Earth',exact:true}).click();await p.getByRole('alert').filter({hasText:'Invalid coordinates'}).waitFor();run.validationVisible=true;run.status='PASS';console.log(width,height,'PASS');
 }catch(e){run.status='FAIL';run.error=String(e);throw e}finally{await c.close()}
}}finally{await writeFile(out+'/proof.json',JSON.stringify(proof,null,2));await browser.close()}
