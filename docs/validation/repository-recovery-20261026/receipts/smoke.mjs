import {chromium} from '../../../node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const out=new URL('./',import.meta.url).pathname,base='http://127.0.0.1:4230';
const proof={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base,runs:[],limitations:['Chromium software rendering and emulated mobile; owner and physical device acceptance absent.']};
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{for(const viewport of [{width:1440,height:900},{width:390,height:900}]){
 const c=await b.newContext({viewport,hasTouch:viewport.width<768,reducedMotion:'reduce'}),p=await c.newPage();
 for(const route of ['/sky-engine','/earth','/solar-system','/planetary-system/earth?date=2026-10-23T01:05:00Z','/planet-view/moon?date=2026-10-23T01:05:00Z']){
  const row={viewport,route,errors:[],httpFailures:[]};proof.runs.push(row);
  const err=e=>row.errors.push(e.message),res=r=>{if(r.status()>=400)row.httpFailures.push({url:r.url(),status:r.status()})};p.on('pageerror',err);p.on('response',res);
  try{await p.goto(base+route,{timeout:30000});await p.waitForFunction(()=>document.querySelector('[data-runtime-status=ready], [data-solar-status=ready], [data-system-status=ready], [data-planet-status=ready]'),{},{timeout:45000});
   row.finalUrl=p.url();if(new URL(p.url()).pathname!==route.split('?')[0])throw Error('Unexpected route redirect: '+p.url());row.body=await p.locator('body').innerText();row.overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);row.frames=p.frames().map(f=>f.url());row.canvases=await p.locator('canvas').count();
   if(route==='/sky-engine'){
    const f=p.frames().find(f=>f.url().includes('/oras-sky-engine/'));
    const sample=()=>f.evaluate(()=>{const s=window.__ORAS_STEL;return {navigation:window.orasSkyAdapter.navigation(),snapshot:window.orasSkyAdapter.snapshot(),speed:s.core.time_speed,selection:s.core.selection?.jsonData||null,lock:s.core.lock?.jsonData||null,satellites:s.core.satellites.visible,hints:s.core.satellites.hints_visible,offset:s.core.satellites.hints_mag_offset,wallUtc:new Date().toISOString()}});
    row.nativeBefore=await sample();await p.waitForTimeout(3000);row.nativeAfter=await sample();row.liveTimeAdvances=Date.parse(row.nativeAfter.navigation.utc)>Date.parse(row.nativeBefore.navigation.utc)+2000;
   }
   row.screenshot=`${viewport.width}-${route.split('?')[0].replaceAll('/','_')}.png`;await p.screenshot({path:out+row.screenshot,timeout:15000});row.status='OBSERVED';
  }catch(e){row.status='FAIL';row.error=e.message;row.body=await p.locator('body').innerText().catch(()=>null);}
  p.off('pageerror',err);p.off('response',res);console.log(viewport.width,route,row.status,row.error||'');await writeFile(out+'smoke.json',JSON.stringify(proof,null,2));
 }
 await c.close();
}}finally{await b.close();await writeFile(out+'smoke.json',JSON.stringify(proof,null,2));}
