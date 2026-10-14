// Real Chromium wheel input and original standalone native controls.
import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'../../node_modules/playwright/index.mjs');
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4202',out=process.env.N1_EVIDENCE_DIR||'output/n1/scroll-safeguards';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),cdp=await context.newCDPSession(page);
const proof={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:'RUNNING',checks:[],pageErrors:[]};page.on('pageerror',e=>proof.pageErrors.push(e.message));
await page.addInitScript(()=>{window.__input=[];document.addEventListener('wheel',e=>window.__input.push({deltaY:e.deltaY,wheelDelta:e.wheelDelta,stamp:e.timeStamp}),{capture:true});if(window===parent){window.__removed=[];const remove=HTMLIFrameElement.prototype.remove;HTMLIFrameElement.prototype.remove=function(){window.__removed.push(this.contentWindow.__input);return remove.call(this)}}});
const frame=()=>page.frames().find(f=>f.url().includes('/oras-sky-engine/'));
const nav=()=>frame().evaluate(()=>window.orasSkyAdapter.navigation());
const ready=async mode=>{await page.locator(`[data-runtime-mode=${mode}][data-runtime-status=ready]`).waitFor({timeout:90000});await page.locator('.ws-handoff').waitFor({state:'hidden',timeout:90000});};
const wheel=async(deltas,interval)=>{const b=await frame().locator('canvas').first().boundingBox(),epoch=Date.now()/1000;await Promise.all(deltas.map((deltaY,i)=>new Promise(r=>setTimeout(r,i*interval)).then(()=>cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:b.x+b.width/2,y:b.y+b.height/2,deltaX:0,deltaY,timestamp:epoch+i*interval/1000}))));await page.waitForTimeout(150);};
try{
 await page.goto(base+'/sky-engine');await ready('sky');await page.waitForTimeout(1100);
 await wheel(Array(5).fill(120),20);assert.ok(Math.abs((await nav()).camera.fovRad-185*Math.PI/180)<1e-8);assert.ok(page.url().includes('/sky-engine'));proof.checks.push('ordinary arrival and short overshoot stay Sky');
 await wheel(Array.from({length:160},(_,i)=>120*.96**i),20);assert.ok(page.url().includes('/sky-engine'));proof.checks.push('decaying trackpad inertia at clamp stays Sky');
 await wheel([-120,-120],100);assert.ok((await nav()).camera.fovRad<180*Math.PI/180);proof.checks.push('reverse scroll cancels and leaves five-degree hysteresis');
 // Continuous varied trackpad input, with no special pause after arrival.
 await wheel(Array.from({length:220},(_,i)=>[16,14,12,13,8,16,19,14][i%8]),20);await ready('earth');proof.checks.push('varied small-delta trackpad continuation enters Earth');
 await page.screenshot({path:out+'/trackpad-earth.png'});
 await page.goto(base+'/oras-sky-engine/');await page.waitForFunction(()=>window.orasSkyAdapter,{timeout:90000});await page.waitForFunction(()=>window.__ORAS_STEL.core.landscapes.current_id==='guereins',{timeout:20000});
 const landscape=page.getByAltText('Landscape Button');await landscape.click();assert.equal(await page.evaluate(()=>window.__ORAS_STEL.core.landscapes.visible),false);await landscape.click();assert.equal(await page.evaluate(()=>window.__ORAS_STEL.core.landscapes.visible),true);assert.equal(await page.evaluate(()=>window.__ORAS_STEL.core.landscapes.current_id),'guereins');proof.checks.push('standalone native bundled landscape and original Landscape OFF/ON control work');
 await page.screenshot({path:out+'/standalone-landscape-on.png'});assert.deepEqual(proof.pageErrors,[]);proof.status='PASS';
}catch(e){proof.status='FAIL';proof.error=e.stack;proof.inputs=await page.evaluate(()=>({removed:window.__removed,frames:[...document.querySelectorAll('iframe')].map(f=>f.contentWindow.__input)}));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');await browser.close();}
