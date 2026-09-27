const fs=require('fs'), path=require('path'), vm=require('vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname, '../..'), out=path.join(root,'output/playwright/star-contract-repair/visual');fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(root+'/scripts/skydata/validate_oras_dense_stars.js','utf8');
const context={require:(s)=>s==='playwright'?require(root+'/node_modules/playwright'):require(s),process,console,Buffer,URL};vm.createContext(context);vm.runInContext(source.slice(0,source.indexOf('async function validateDenseStars ()'))+'\nthis.metrics=computeScreenshotMetrics;',context);
const fields=[
{id:'orion',date:'2026-01-15T03:00:00Z',az:174.65,alt:43.03,fov:70},
{id:'cygnus',date:'2026-07-15T03:00:00Z',az:65.94,alt:49.37,fov:70},
{id:'sagittarius',date:'2026-07-15T03:00:00Z',az:165,alt:20,fov:70},
{id:'m31',date:'2026-01-15T03:00:00Z',az:294.34,alt:39.53,fov:70},
{id:'sparse',date:'2026-04-15T03:00:00Z',az:30,alt:72,fov:90},
{id:'twilight',date:'2026-06-04T01:00:00Z',az:285,alt:8,fov:100},
{id:'zenith-dark',date:'2026-09-21T04:00:00Z',az:180,alt:82,fov:90},
{id:'daylight',date:'2026-09-20T17:00:00Z',az:180,alt:45,fov:90}
];
(async()=>{const browser=await chromium.launch({headless:true});const results=[];
try {for(const [name,url] of [['oras','http://127.0.0.1:4173/oras-sky-engine/']]){
const c=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});const p=await c.newPage();const errors=[],bad=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push({url:r.url(),status:r.status()})});
await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await p.waitForFunction(()=>!!(window.__ORAS_STEL||window._stel)?.core,{timeout:60000});await p.waitForTimeout(4000);
for(const field of fields){const state=await p.evaluate((f)=>{const s=window.__ORAS_STEL||window._stel,core=s.core,obs=core.observer||core;
const mod=k=>core[k]||s.getModule(k);core.time_speed=0;core.selection=null;core.lock=null;
obs.latitude=41.44*Math.PI/180;obs.longitude=-79.69*Math.PI/180;obs.elevation=0;obs.utc=Date.parse(f.date)/86400000+40587;obs.pitch=f.alt*Math.PI/180;obs.yaw=f.az*Math.PI/180;obs.roll=0;
core.fov=f.fov*Math.PI/180;core.exposure_scale=2;core.star_linear_scale=.8;core.star_relative_scale=1.1;core.bortle_index=3;core.tonemapper_p=2.2;
for(const k of ['stars','dsos','planets','milkyway','dss','atmosphere','landscapes'])mod(k).visible=true;
for(const k of ['comets','minor_planets','satellites','meteors']){try{mod(k).visible=false}catch{}}
for(const k of ['lines_visible','labels_visible','images_visible','bounds_visible'])mod('constellations')[k]=false;
try{mod('landscapes').current_id='guereins'}catch{}
return {latitude:obs.latitude,longitude:obs.longitude,elevation:obs.elevation,utc:obs.utc,pitch:obs.pitch,yaw:obs.yaw,fov:core.fov,projection:core.projection,mount_frame:core.mount_frame,exposure_scale:core.exposure_scale,star_linear_scale:core.star_linear_scale,star_relative_scale:core.star_relative_scale,bortle_index:core.bortle_index,tonemapper_p:core.tonemapper_p,stars:mod('stars'),atmosphere:mod('atmosphere'),landscapes:mod('landscapes').current_id};},field);
await p.waitForTimeout(name==='public'?8000:4500);
const runtime=await p.evaluate(async()=>{const s=window.__ORAS_STEL||window._stel,core=s.core,obs=core.observer||core;const times=[];await new Promise(resolve=>{let prev;function step(t){if(prev)times.push(t-prev);prev=t;if(times.length>=30)resolve();else requestAnimationFrame(step)}requestAnimationFrame(step)});times.sort((a,b)=>a-b);return{utc:obs.utc,latitude:obs.latitude,longitude:obs.longitude,pitch:obs.pitch,yaw:obs.yaw,fov:core.fov,engine_fps:core.fps,frame_median_ms:times[15],wasm_heap_bytes:s.HEAPU8?.byteLength,js_heap_bytes:performance.memory?.usedJSHeapSize,resources:performance.getEntriesByType('resource').length,canvasCount:document.querySelectorAll('canvas').length,progressbars:core.progressbars}});
const file=name+'-'+field.id+'.png';const buf=await p.locator('canvas').first().screenshot({path:path.join(out,file)});const metrics=context.metrics(buf);
const row={name,field,settings:state,runtime,metrics,screenshot:file,page_errors:[...errors],http_errors:[...bad]};results.push(row);fs.writeFileSync(path.join(out,'visual-after.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({name,field:field.id,fps:runtime.engine_fps,frame:runtime.frame_median_ms,heap:runtime.wasm_heap_bytes,blobs:metrics.brightBlobCount,bright:metrics.brightPixelRatio,largest:metrics.maxBrightBlobArea,errors:bad.length}));
}await c.close();}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
