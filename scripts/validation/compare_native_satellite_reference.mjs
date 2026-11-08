// Compare the original pinned native binary, not a public remote sky service.
import {chromium} from '../../node_modules/playwright/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.P0_URL||'http://127.0.0.1:4230',out=process.env.P0_REFERENCE_OUT||'output/playwright/p0-native-satellites/reference';await mkdir(out,{recursive:true});
const originalWasm=await readFile('output/recovery/p0-reference/engine.wasm');
const digest=createHash('sha256').update(originalWasm).digest('hex');
const lock=JSON.parse(await readFile('integrations/renderers.lock.json'));
assert.equal(digest,lock.sky.baseline_artifacts.find(x=>x.path.endsWith('.wasm')).sha256);
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const proof={originalWasmSha256:digest,anchor:lock.sky.comparison_anchor,runs:[],limitations:['Matched native engine scene, not the upstream website UI. The original binary lacks the Hub-only landscape styling hook.','Reference catalog propagation and photometry are compared at an identical current epoch; this paused comparison is separate from ordinary Live motion proof.']};
async function state(f,engine,ids){return f.evaluate(({engine,ids})=>{
 const s=window[engine],c=s.core,o=c.observer;
 const fields=['fov','projection','exposure_scale','star_linear_scale','star_relative_scale','bortle_index','tonemapper_p','display_limit_mag','center_hints_mag_offset','mount_frame','flip_view_vertical','flip_view_horizontal'];
 const observerFields=['utc','latitude','longitude','elevation','yaw','pitch','roll','pressure'];
 let count=0;const cb=s.addFunction(()=>{count++;return 0;},'iii');try{s._module_list_objs2(c.satellites.v,o.v,NaN,0,cb);}finally{s.removeFunction(cb);}
 const rows=ids.map(id=>{const obj=s.getObj('NORAD '+String(id).padStart(5,'0'));try{return {id,vmag:obj.getInfo('vmag',o),radec:obj.getInfo('radec',o),data:obj.jsonData};}finally{obj.destroy();}});
 return {count,core:Object.fromEntries(fields.map(k=>[k,c[k]])),observer:Object.fromEntries(observerFields.map(k=>[k,o[k]])),visible:c.satellites.visible,hints:c.satellites.hints_visible,offset:c.satellites.hints_mag_offset,atmosphere:c.atmosphere.visible,landscape:c.landscapes.visible,selection:!!c.selection,lock:!!c.lock,rows};
},{engine,ids});}
try{for(const viewport of [{width:1440,height:900},{width:390,height:900}]){
 const ctx=await browser.newContext({viewport}),hub=await ctx.newPage();await hub.goto(base+'/sky-engine');await hub.locator('[data-runtime-status=ready]').waitFor({timeout:60000});const f=hub.frames().find(x=>x.url().includes('/oras-sky-engine/'));
 await f.waitForFunction(()=>{const o=window.__ORAS_STEL?.getObj('NORAD 25544');if(!o)return false;o.destroy();return true;},null,{timeout:30000});
 await f.evaluate(()=>{window.__ORAS_STEL.core.time_speed=0;});
 const ids=['25544','20580','64322','64267','68789','55361','57875'],a=await state(f,'__ORAS_STEL',ids),reference=await ctx.newPage();
 await reference.goto(base+'/evidence/p0-reference/index.html');await reference.waitForFunction(()=>!!window.ref?.core,null,{timeout:45000});
 await reference.evaluate(({a,base})=>{const s=window.ref,c=s.core;c.time_speed=0;for(const[k,v]of Object.entries(a.core))if(v!==undefined)c[k]=v;for(const[k,v]of Object.entries(a.observer))if(v!==undefined)c.observer[k]=v;c.atmosphere.visible=a.atmosphere;c.landscapes.visible=a.landscape;c.satellites.visible=a.visible;c.satellites.hints_visible=a.hints;c.satellites.hints_mag_offset=a.offset;c.satellites.addDataSource({url:base+'/oras-sky-engine/skydata/tle_satellite.jsonl.gz',key:'jsonl/sat'});c.stars.addDataSource({url:base+'/oras-sky-engine/skydata/dense-star-tiles/profiles/visual-default',key:'hip'});},{a,base});
 await reference.waitForFunction(()=>{const o=window.ref.getObj('NORAD 25544');if(!o)return false;o.destroy();return true;},null,{timeout:30000});
 const b=await state(reference,'ref',ids),deltas=a.rows.map((r,i)=>({id:r.id,magnitude:Math.abs(r.vmag-b.rows[i].vmag),coordinates:Math.max(...r.radec.map((v,j)=>Math.abs(v-b.rows[i].radec[j])))}));
 assert.deepEqual(a.core,b.core);for(const key of Object.keys(a.observer)){if(key==='utc')assert.ok(Math.abs(a.observer[key]-b.observer[key])<1e-10,'Native JSON MJD roundtrip within 8.64 microseconds');else assert.equal(a.observer[key],b.observer[key]);}for(const d of deltas){assert.ok(d.magnitude<1e-8);assert.ok(d.coordinates<1e-12);}
 assert.equal(a.count,15901);assert.equal(b.count,15901);assert.deepEqual(a.rows.map(r=>r.data),b.rows.map(r=>r.data));
 await reference.evaluate(n=>new Promise(resolve=>{let k=0;function step(){if(++k>=n)resolve();else requestAnimationFrame(step);}requestAnimationFrame(step);}),Math.ceil(15901/32)+1);
 await reference.screenshot({path:`${out}/${viewport.width}-original.png`});await hub.screenshot({path:`${out}/${viewport.width}-hub.png`});
 proof.runs.push({viewport,stateHub:a,stateOriginal:b,deltas,status:'MATCHED_NATIVE_GEOMETRY_PHOTOMETRY_AND_SETTINGS'});await ctx.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');console.log(viewport.width,'original native and Hub match');
}}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');}
