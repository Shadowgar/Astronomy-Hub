// Bounded ordinary-Live discovery measurements. No scene/brightness overrides.
import {chromium} from '../../node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {sample,pixelStats} from './native_satellite_measurements.mjs';
const base=process.env.P0_URL||'http://127.0.0.1:4230',out=process.env.P0_BENCH_OUT||'output/playwright/p0-satellite-finalization/discovery';await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),proof={runs:[],method:'First source-projected moving white pixels after native catalog parse, bounded 25-second window. PNG sampling adds overhead; separate RAF responsiveness phase performs no image reads.'};
try{for(const viewport of [{width:1440,height:900},{width:390,height:900},{width:667,height:390}]){
 const ctx=await browser.newContext({viewport,hasTouch:viewport.width<768}),p=await ctx.newPage(),run={viewport,samples:[]};proof.runs.push(run);const opened=Date.now();
 p.on('console',m=>{if(m.text().startsWith('P0'))console.log(m.text());if(/Parsed 15901 satellites/.test(m.text()))run.catalogParsedAtMs=Date.now();});
 await p.goto(base+'/sky-engine');await p.locator('[data-runtime-status=ready]').waitFor({timeout:60000});const f=p.frames().find(f=>f.url().includes('/oras-sky-engine/'));
 await f.waitForFunction(()=>{const o=window.__ORAS_STEL?.getObj('NORAD 25544');if(!o)return false;o.destroy();return true;},null,{timeout:30000});
 console.log(viewport.width,'native ready');const scanStart=Date.now(),initial=await sample(f,null,false,8);console.log(viewport.width,'native loaded; diagnostic ms',Date.now()-scanStart);run.inspectionMs=Date.now()-scanStart;run.count=initial.count;run.observer=initial.navigation.observer;run.fov=initial.navigation.camera.fovRad;
 const ids=initial.rows.filter(x=>x.onScreen&&x.altitudeDeg>15&&x.pixel.x>90&&x.pixel.x<viewport.width-80&&x.pixel.y>170).slice(0,12).map(x=>x.id);run.candidates=ids;run.modelMagnitudeRange=initial.rows.slice(0,5).map(x=>({id:x.id,mag:x.mag,onScreen:x.onScreen}));
 const started=Date.now();let proved=false;
 while(Date.now()-started<25000&&ids.length){
  const s=await sample(f,ids,true),image=Buffer.from(s.image,'base64');delete s.image;const pixels=await pixelStats(p,image,null,s.rows);const seen={elapsedFromParseMs:Date.now()-(run.catalogParsedAtMs||opened),utc:s.navigation.utc,rows:s.rows.map(x=>({id:x.id,mag:x.mag,pixel:x.pixel})),pixels};run.samples.push(seen);
  if(run.samples.length>=3){const a=run.samples[0];proved=a.pixels.some(x=>{const y=pixels.find(y=>y.id===x.id);return x.centroid&&y?.centroid&&Math.hypot(x.centroid.x-y.centroid.x,x.centroid.y-y.centroid.y)>3&&Math.hypot(x.centroid.x-x.expected.x,x.centroid.y-x.expected.y)<3&&Math.hypot(y.centroid.x-y.expected.x,y.centroid.y-y.expected.y)<3;});if(proved)break;}
  await p.waitForTimeout(1000);
 }
 run.firstSeen=ids.map(id=>{const s=run.samples.find(s=>s.pixels.some(p=>p.id===id&&p.centroid&&Math.hypot(p.centroid.x-p.expected.x,p.centroid.y-p.expected.y)<3));return {id,firstPixelMs:s?.elapsedFromParseMs??null};});run.motionCandidateObserved=proved;
 run.responsiveness=await f.evaluate(()=>new Promise(resolve=>{const a=[],start=performance.now();let last=start;function tick(now){a.push(now-last);last=now;if(now-start<3000){requestAnimationFrame(tick);return;}a.sort((x,y)=>x-y);resolve({frames:a.length,elapsedMs:now-start,fps:a.length*1000/(now-start),medianMs:a[Math.floor(a.length*.5)],p95Ms:a[Math.floor(a.length*.95)],maxMs:a.at(-1)});}requestAnimationFrame(tick);}));
 await p.screenshot({path:`${out}/${viewport.width}-ordinary.png`});console.log(viewport.width,'firstSeen',run.firstSeen.filter(x=>x.firstPixelMs!==null).slice(0,3),'fps',run.responsiveness.fps.toFixed(1));await ctx.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');
}}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');}
