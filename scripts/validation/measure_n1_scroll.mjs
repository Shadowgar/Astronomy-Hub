// Representative Chromium device input, against the served application.
// Baselines may fail product expectations; retain those results for comparison.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'../../node_modules/playwright/index.mjs');
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4202',out=process.env.N1_EVIDENCE_DIR||'output/n1/scroll-before';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
const proof={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),started:new Date().toISOString(),base,measurements:[],pageErrors:[],limitations:['Headless Chromium software rendering; the owner’s ChatGPT browser and physical wheel/trackpad hardware cannot be automated here. Device input is sent through Chromium, never synthetic DOM events.']};
page.on('pageerror',e=>proof.pageErrors.push(e.message));
await page.addInitScript(()=>{window.__wheel=[];document.addEventListener('wheel',e=>window.__wheel.push({delta:e.deltaY,at:e.timeStamp}),{capture:true,passive:true});});
const cdp=await context.newCDPSession(page);
const frame=()=>page.frames().find(f=>/\/(oras-sky-engine|earth-runtime)\//.test(f.url()));
const ready=async mode=>{await page.locator(`[data-runtime-mode=${mode}][data-runtime-status=ready]`).waitFor({timeout:90000});await page.locator('.ws-handoff').waitFor({state:'hidden',timeout:90000});};
const state=()=>frame().evaluate(()=>window.orasSkyAdapter?.navigation()||window.orasEarthDiagnostics());
const move=async()=>{const b=await frame().locator('canvas').first().boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);};
try {
 const paths=['/assets/','/oras-sky-engine/oras-runtime-build.json','/earth-runtime/release.json'];
 const html=await(await page.request.get(base+'/')).text(),asset=html.match(/src="(\/assets\/[^" ]+\.js)"/)[1];paths[0]=asset;
 proof.served=Object.fromEntries(await Promise.all(paths.map(async path=>[path,createHash('sha256').update(await(await page.request.get(base+path)).body()).digest('hex')])));
 for(const [name,delta,interval,count] of [['continuous mouse',120,100,24],['slow discrete mouse',120,600,14],['trackpad sized',12,20,280]]) {
  await page.goto(base+'/sky-engine?date=2026-10-14T02%3A10%3A00.000Z');await ready('sky');await page.waitForTimeout(1100);await move();
  const start=Date.now();let sent=0;
  if(process.env.N1_INPUT_STYLE==='queued'){const b=await frame().locator('canvas').first().boundingBox(),epoch=Date.now()/1000;await Promise.all(Array.from({length:count},(_,i)=>new Promise(r=>setTimeout(r,i*interval)).then(()=>{if(!page.url().includes('/sky-engine'))return;sent++;return cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:b.x+b.width/2,y:b.y+b.height/2,deltaX:0,deltaY:delta,timestamp:epoch+i*interval/1000});})));}else{for(;sent<count&&page.url().includes('/sky-engine');sent++){await page.mouse.wheel(0,delta);await page.waitForTimeout(interval);}}
  if(page.url().includes('/earth'))await ready('earth');
  proof.measurements.push({name,delta,intervalMs:interval,sent,elapsedMs:Date.now()-start,transitioned:page.url().includes('/earth'),state:await state()});
  await page.screenshot({path:`${out}/${name.replaceAll(' ','-')}.png`});console.log(JSON.stringify(proof.measurements.at(-1)));
 }
 if(process.env.N1_SCROLL_ONLY==='1')process.exitCode=0;else {
 await page.goto(base+'/sky-engine');await ready('sky');await page.getByRole('button',{name:'Explore',exact:true}).click();await page.getByRole('button',{name:'Earth Explore our planet',exact:true}).press('Enter');await ready('earth');await page.waitForTimeout(1100);await move();
 const initial=await state(),samples=[],start=Date.now();let sent=0;
 while(sent<100){await page.mouse.wheel(0,-120);sent++;await page.waitForTimeout(250);const s=await state();samples.push({sent,elapsedMs:Date.now()-start,heightM:s.cameraHeightM,observer:s.navigation?.observer});if(s.cameraHeightM<=1500)break;}
 proof.earth={delta:-120,intervalMs:250,initialHeightM:initial.cameraHeightM,sent,elapsedMs:Date.now()-start,samples};console.log(JSON.stringify(proof.earth));await page.screenshot({path:out+'/earth-approach.png'});
 }
 await page.goto(base+'/oras-sky-engine/');await page.waitForFunction(()=>window.orasSkyAdapter,{timeout:90000});await page.waitForTimeout(1200);
 proof.standalone=await page.evaluate(()=>({landscape:window.__ORAS_STEL.core.landscapes.current_id,visible:window.__ORAS_STEL.core.landscapes.visible}));
}finally{proof.finished=new Date().toISOString();await writeFile(out+'/measurements.json',JSON.stringify(proof,null,2)+'\n');await browser.close();}
