// Observe ordinary Live Sky; isolate native point/hint pixels only AFTER motion.
// No injected objects, photometry, observer, camera, epoch or display changes.
import {chromium} from '../../node_modules/playwright/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const base=process.env.P0_URL||'http://127.0.0.1:4230';
const out=process.env.P0_OUT||'output/playwright/p0-native-satellites/live';
await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const proof={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base,runs:[],
  method:'Ordinary route, new browser context, current Live UTC, native 1x, no selection/lock. Three screenshots precede the separate frozen native-layer isolation control.',
  limitations:['Chromium SwiftShader and emulated mobile, not physical-device or Windows GPU evidence.',
    'Native default standard magnitude is not a measured satellite magnitude when the source omits photometry.',
    'No eligible native point is recorded as a scientific/display limitation, never an automatic visual pass.']};
proof.validatorSha256=hash(await readFile('scripts/validation/verify_native_satellite_live_pixels.mjs'));
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});

// Stereographic projection follows the pinned native projection, using native
// ICRF -> VIEW conversion. This math measures pixels; it never drives the scene.
async function sample(f,ids=null,capture=false){return f.evaluate(({ids,capture})=>new Promise(resolve=>requestAnimationFrame(()=>{
  const s=window.__ORAS_STEL,c=s.core,canvas=document.querySelector('#stel-canvas'),r=canvas.getBoundingClientRect();
  const aspect=r.width/r.height,fovy=aspect<1?4*Math.atan(Math.tan(c.fov/4)/aspect):c.fov;
  const scale=r.height/(2*Math.tan(fovy/4));
  const position=o=>{const ra=o.getInfo('radec',c.observer),view=s.convertFrame(c.observer,'ICRF','VIEW',ra),obs=s.convertFrame(c.observer,'ICRF','OBSERVED',ra),n=Math.hypot(...view.slice(0,3)),v=view.map(x=>x/n);
    const x=r.x+r.width/2+scale*v[0]/(1-v[2]),y=r.y+r.height/2-scale*v[1]/(1-v[2]);
    return {radec:ra,view,observed:obs,pixel:{x,y},onScreen:v[2]<0&&x>r.x+30&&x<r.right-30&&y>r.y+100&&y<r.bottom-150,altitudeDeg:Math.asin(obs[2]/Math.hypot(...obs.slice(0,3)))*180/Math.PI};};
  let objects=[],count;
  if(ids){objects=ids.map(id=>s.getObj('NORAD '+String(id).padStart(5,'0'))).filter(Boolean);}
  else{const pointers=[],cb=s.addFunction((user,ptr)=>{pointers.push(ptr);return 0},'iii');
    try{s._module_list_objs2(c.satellites.v,c.observer.v,NaN,0,cb);}finally{s.removeFunction(cb);}
    count=pointers.length;
    // Upstream listObjs uses a shared scratch array overwritten by SweObj's
    // constructor. Keep our own pointer array and balance every retained handle.
    objects=pointers.map(ptr=>{const o=new s.SweObj(ptr);o.retain();return o;});}
  const rows=[];
  for(const o of objects){try{const mag=o.getInfo('vmag',c.observer);if(mag<18){const data=o.jsonData;rows.push({id:String(data.model_data.norad_number),mag,standardMagnitude:data.model_data.mag??null,tle:data.model_data.tle,names:data.names,...position(o)});}}finally{o.destroy();}}
  const stars=[];for(const id of ['HIP 24608','HIP 91262','HIP 32349','HIP 11767','HIP 69673','HIP 37826']){const o=s.getObj(id);if(!o)continue;try{stars.push({id,...position(o)});}finally{o.destroy();}}
  let image; if(capture){const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.getContext('2d').drawImage(canvas,0,0);image=copy.toDataURL('image/png').split(',')[1];}
  resolve({image,wallUtc:new Date().toISOString(),navigation:window.orasSkyAdapter.navigation(),speed:c.time_speed,selection:!!c.selection,lock:!!c.lock,
    count,visible:c.satellites.visible,hints:c.satellites.hints_visible,offset:c.satellites.hints_mag_offset,
    appearance:{atmosphere:c.atmosphere.visible,exposure:c.exposure_scale,starScale:c.star_linear_scale,bortle:c.bortle_index},
    canvas:{x:r.x,y:r.y,width:r.width,height:r.height},rows:rows.sort((a,b)=>a.mag-b.mag),stars});
})),{ids,capture});}

async function pixelStats(p,on,off,targets){return p.evaluate(async({on,off,targets})=>{
  async function decode(b){const bytes=Uint8Array.from(atob(b),c=>c.charCodeAt(0)),im=await createImageBitmap(new Blob([bytes]));const c=new OffscreenCanvas(im.width,im.height),x=c.getContext('2d');x.drawImage(im,0,0);return {width:im.width,height:im.height,data:x.getImageData(0,0,im.width,im.height).data};}
  const a=await decode(on),b=off?await decode(off):null;
  return targets.map(t=>{let white=0,green=0,mass=0,xsum=0,ysum=0;
    for(let y=Math.max(0,Math.floor(t.pixel.y)-4);y<=Math.min(a.height-1,Math.ceil(t.pixel.y)+4);y++)for(let x=Math.max(0,Math.floor(t.pixel.x)-4);x<=Math.min(a.width-1,Math.ceil(t.pixel.x)+4);x++){
      const i=(y*a.width+x)*4,r=a.data[i],g=a.data[i+1],bl=a.data[i+2],delta=b?Math.abs(r-b.data[i])+Math.abs(g-b.data[i+1])+Math.abs(bl-b.data[i+2]):r+g+bl;
      if(delta<6)continue;
      if(g>60&&g-r>20&&g-bl>15)green++;
      if(Math.min(r,g,bl)>3&&Math.max(r,g,bl)-Math.min(r,g,bl)<55){white++;mass+=delta;xsum+=x*delta;ysum+=y*delta;}
    }return {id:t.id,expected:t.pixel,white,green,centroid:mass?{x:xsum/mass,y:ysum/mass}:null};});
},{on:on.toString('base64'),off:off?.toString('base64'),targets});}

try{for(const viewport of (process.env.P0_VIEWPORT?[{width:Number(process.env.P0_VIEWPORT.split("x")[0]),height:Number(process.env.P0_VIEWPORT.split("x")[1])}]:[{width:1440,height:900},{width:390,height:900}])){
  const ctx=await browser.newContext({viewport,hasTouch:viewport.width<768}),p=await ctx.newPage(),run={viewport,errors:[],frames:[]};proof.runs.push(run);p.on('pageerror',e=>run.errors.push(e.message));
  try{
    await p.goto(base+'/sky-engine');await p.locator('[data-runtime-status=ready]').waitFor({timeout:60000});
    const f=p.frames().find(f=>f.url().includes('/oras-sky-engine/'));await f.waitForFunction(()=>{const o=window.__ORAS_STEL?.getObj('NORAD 25544');if(!o)return false;o.destroy();return true;},null,{timeout:30000});
    run.initial=await sample(f);assert.equal(run.initial.count,15901);assert.equal(run.initial.speed,1);assert.equal(run.initial.selection,false);assert.equal(run.initial.lock,false);assert.ok(Math.abs(Date.now()-Date.parse(run.initial.navigation.utc))<3000);assert.ok(!new URL(p.url()).searchParams.has('date'));
    const build=await(await p.request.get(base+'/oras-sky-engine/oras-runtime-build.json')).json();assert.deepEqual(build,JSON.parse(await readFile('frontend/public/oras-sky-engine/oras-runtime-build.json')));run.build=build;
    run.feed=await(await p.request.get(base+'/api/sky/satellite-feed')).json();
    const disk=await readFile(process.env.P0_FEED||'/tmp/astronomy-recovery-20261026/satellite-candidate/release/tle_satellite.jsonl.gz');assert.equal(hash(disk),run.feed.data.sha256);
    run.assetSha256={};
    const scripts=await f.locator('script[src]').evaluateAll(xs=>xs.map(x=>x.src));
    for(const url of scripts){const path=new URL(url).pathname;if(!path.startsWith('/oras-sky-engine/'))continue;const name=path.slice('/oras-sky-engine/'.length),served=await(await p.request.get(url)).body(),local=await readFile('frontend/public/oras-sky-engine/'+name);assert.equal(hash(served),hash(local));run.assetSha256[name]=hash(served);}
    // HTTP Content-Encoding removes the outer gzip layer; native consumes the inner gzip.
    const {gunzipSync}=await import('node:zlib');const response=await p.request.get(base+'/oras-sky-engine/skydata/tle_satellite.jsonl.gz');assert.equal(hash(await response.body()),hash(gunzipSync(disk)));run.nativeFeedSha256=hash(disk);
    const sweepStart=Date.now(); await f.evaluate(n=>new Promise(resolve=>{let count=0;const step=()=>{if(++count>=n)resolve();else requestAnimationFrame(step);};requestAnimationFrame(step);}),Math.ceil(run.initial.count/32)+1);run.nativeSweepWaitMs=Date.now()-sweepStart;run.initial=await sample(f);
    const ids=run.initial.rows.filter(x=>x.onScreen&&x.altitudeDeg>8).slice(0,12).map(x=>x.id);run.candidates=ids;
    for(let i=0;i<3;i++){
      if(i)await p.waitForTimeout(4000);
      const before=await sample(f,ids,true),bytes=Buffer.from(before.image,'base64');delete before.image;await writeFile(`${out}/${viewport.width}-live-${i}.png`,bytes);const after=before;
      run.frames.push({before,after,imageSha256:hash(bytes),pixels:await pixelStats(p,bytes,null,[...before.rows,...before.stars.filter(s=>s.onScreen)])});
      assert.equal(before.speed,1);assert.equal(before.selection,false);assert.equal(before.lock,false);
      assert.deepEqual(before.navigation.camera,run.initial.navigation.camera);assert.deepEqual(before.navigation.observer,run.initial.navigation.observer);
    }
    assert.ok(Date.parse(run.frames[2].before.navigation.utc)-Date.parse(run.frames[0].before.navigation.utc)>7000);
    // Separate diagnostic: briefly freeze this current epoch and toggle only
    // the native layer to distinguish its white points from green hints/stars.
    await f.evaluate(()=>{window.__ORAS_STEL.core.time_speed=0;});
    await p.waitForTimeout(500);run.isolationState=await sample(f,ids,true);
    const on=Buffer.from(run.isolationState.image,'base64');delete run.isolationState.image;await writeFile(`${out}/${viewport.width}-isolation-on.png`,on);
    await f.evaluate(()=>{window.__ORAS_STEL.core.satellites.visible=false;});await p.waitForTimeout(300);
    const offState=await sample(f,ids,true),off=Buffer.from(offState.image,'base64');await writeFile(`${out}/${viewport.width}-isolation-off.png`,off);
    await f.evaluate(()=>{const c=window.__ORAS_STEL.core;c.satellites.visible=true;c.satellites.hints_visible=false;});await p.waitForTimeout(300);
    const pointState=await sample(f,ids,true),pointOn=Buffer.from(pointState.image,'base64');await writeFile(`${out}/${viewport.width}-points-only.png`,pointOn);
    run.isolation=await pixelStats(p,pointOn,off,run.isolationState.rows);run.hintIsolation=await pixelStats(p,on,pointOn,run.isolationState.rows);
    await f.evaluate(hints=>{window.__ORAS_STEL.core.satellites.hints_visible=hints;},run.initial.hints);
    await f.evaluate(()=>window.orasSkyAdapter.setLive(true));
    run.pointIds=run.isolation.filter(x=>x.white>0).map(x=>x.id);
    run.hintIds=run.hintIsolation.filter(x=>x.green>0).map(x=>x.id);
    run.motion=run.pointIds.map(id=>{const a=run.frames[0].pixels.find(x=>x.id===id),b=run.frames[2].pixels.find(x=>x.id===id),ra=run.frames[0].before.rows.find(x=>x.id===id),rb=run.frames[2].before.rows.find(x=>x.id===id);
      const nativeScreenDisplacement=ra&&rb?Math.hypot(ra.pixel.x-rb.pixel.x,ra.pixel.y-rb.pixel.y):null;
      const token=ra.tle[0].slice(18,32),year=Number(token.slice(0,2)),tleEpochMs=Date.UTC(year>=57?1900+year:2000+year,0,1)+(Number(token.slice(2))-1)*86400000;
      const ageDays=(Date.parse(run.frames[0].before.navigation.utc)-tleEpochMs)/86400000;
      return {id,tleEpoch:new Date(tleEpochMs).toISOString(),ageDays,sourceQualified:ageDays>=-1&&ageDays<=14,centroids:[a?.centroid,b?.centroid],nativeScreenDisplacement,
        projectionErrors:[a,b].map(x=>x?.centroid?Math.hypot(x.centroid.x-x.expected.x,x.centroid.y-x.expected.y):null),
        pixelDisplacement:a?.centroid&&b?.centroid?Math.hypot(a.centroid.x-b.centroid.x,a.centroid.y-b.centroid.y):null};});
    await p.screenshot({path:`${out}/${viewport.width}-ordinary-full.png`});
    run.fixedStarMotion=run.frames[0].pixels.filter(x=>x.id==='HIP 11767'&&x.centroid).map(a=>{const b=run.frames[2].pixels.find(x=>x.id===a.id);return {id:a.id,pixelDisplacement:b?.centroid?Math.hypot(a.centroid.x-b.centroid.x,a.centroid.y-b.centroid.y):null};});
    run.status=run.motion.some(x=>x.sourceQualified&&x.pixelDisplacement>1&&x.nativeScreenDisplacement>1&&x.projectionErrors.every(e=>e!==null&&e<5))&&run.fixedStarMotion.some(x=>x.pixelDisplacement!==null&&x.pixelDisplacement<1)?'NATIVE_POINT_MOTION_OBSERVED':'NO_NATIVE_POINT_MOTION_PROOF';
    // Optional tracking is tested only after the unselected motion proof.
    if(run.status==='NATIVE_POINT_MOTION_OBSERVED'){
      const controlBefore=await sample(f,run.pointIds),target=controlBefore.rows.find(x=>x.onScreen&&x.pixel.x>100&&x.pixel.x<viewport.width-100&&x.pixel.y>170);
      if(target){
        // Upstream dispatches desktop mouse-down from its animation frame.
        // Keep a real press across frames instead of a zero-duration test click.
        if(viewport.width<768)await p.touchscreen.tap(target.pixel.x,target.pixel.y);else await p.mouse.click(target.pixel.x,target.pixel.y,{delay:200});
        await f.waitForFunction(id=>String(window.__ORAS_STEL.core.selection?.jsonData?.model_data?.norad_number)===id,target.id,{timeout:10000});
        await p.getByRole('button',{name:'Track',exact:true}).first().waitFor({state:'visible',timeout:10000});
        await p.getByRole('button',{name:'Track',exact:true}).first().click();
        await f.waitForFunction(id=>String(window.__ORAS_STEL.core.lock?.jsonData?.model_data?.norad_number)===id,target.id);
        const tracked=await sample(f,[target.id]);assert.equal(tracked.speed,1);assert.deepEqual(tracked.navigation.observer,controlBefore.navigation.observer);assert.equal(tracked.navigation.camera.fovRad,controlBefore.navigation.camera.fovRad);assert.deepEqual(tracked.appearance,controlBefore.appearance);
        await p.getByRole('button',{name:'Stop tracking',exact:true}).first().click();await f.waitForFunction(()=>!window.__ORAS_STEL.core.lock);
        const stopped=await sample(f,[target.id]);assert.equal(stopped.speed,1);run.controls={id:target.id,selection:'real pointer/touch',tracking:'native lock established',stop:'lock released, Live retained',before:controlBefore,tracked,stopped};
      }else run.controls={status:'NO_REMAINING_CLICKABLE_POINT_IN_CONTROL_WINDOW'};
    }
    assert.deepEqual(run.errors,[]);console.log(viewport.width,run.status,'pointIds',run.pointIds,'hintIds',run.hintIds);
  }catch(error){run.validationError=error.stack;throw error;}
  finally{await ctx.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');}
}if(proof.runs.some(r=>r.status!=='NATIVE_POINT_MOTION_OBSERVED'))process.exitCode=2;
}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');}
