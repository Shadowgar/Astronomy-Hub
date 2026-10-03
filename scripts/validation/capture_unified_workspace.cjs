// Production-app screenshots and measurements. Renderer data are live or source-backed.
const {chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),pass=process.env.VISUAL_PASS||'pass-1',base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4181',out=path.join(root,'output/playwright/unified-workspace',pass);
const entries=[['D01',1440,900,'sky','default'],['D02',1440,900,'sky','tonight'],['D03',1440,900,'sky','observe'],['D04',1440,900,'sky','selection'],['D05',1440,900,'earth','default'],['D06',1440,900,'earth','layers'],['D07',1440,900,'earth','selection'],['D08',1440,900,'earth','provider'],['D09',1920,1080,'sky','immersive'],['D10',1920,1080,'earth','immersive'],['T11',1024,768,'sky','default'],['T12',1024,768,'earth','layers'],['M13',390,844,'sky','default'],['M14',390,844,'sky','selection'],['M15',390,844,'earth','default'],['M16',390,844,'earth','layers'],['M17',390,844,'earth','selection'],['S18',1440,900,'earth','loading'],['S19',1440,900,'earth','error'],['S20',1440,900,'earth','pinned'],['S21',1440,900,'sky','auto-hidden']];
(async()=>{fs.mkdirSync(out,{recursive:true});const b=await chromium.launch();const results=process.env.VISUAL_IDS&&fs.existsSync(path.join(out,'measurements.json'))?JSON.parse(fs.readFileSync(path.join(out,'measurements.json'))).filter(r=>!process.env.VISUAL_IDS.split(',').includes(r.id)):[];
for(const [id,width,height,mode,state] of entries){if(process.env.VISUAL_IDS&&!process.env.VISUAL_IDS.split(',').includes(id))continue;const p=await b.newPage({viewport:{width,height},hasTouch:width<768,isMobile:width<768,timezoneId:'America/New_York'});const started=Date.now();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(pin=>sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin,context:'tonight',layers:['oras-site','satellites']})),state!=='auto-hidden');
try{
 if(state==='loading')await p.route('**/earth-runtime/release.json',()=>{});if(state==='error')await p.route('**/earth-runtime/release.json',r=>r.fulfill({status:503,body:'Qualification unavailable'}));
 const query=mode==='sky'?'date=2026-10-03T02%3A00%3A00Z':'date=2026-10-03T16%3A00%3A00Z';const source=mode==='sky'&&state==='selection'?'&catalog=Messier%20(local)&source_id=M31&model=dso':'';
 await p.goto(base+(mode==='earth'?'/earth':'/')+'?'+query+source);await p.locator('.ws-header').waitFor();const shellMs=Date.now()-started;let readyMs=null,selected=null;
 if(!['loading','error'].includes(state)){await p.locator(`[data-runtime-mode=${mode}][data-runtime-status=ready]`).waitFor({timeout:90000});readyMs=Date.now()-started;
  const frame=p.frames().find(f=>f.url().includes(mode==='sky'?'/oras-sky-engine/':'/earth-runtime/'));
  await p.waitForTimeout(mode==='earth'?9000:4000);
  if(state==='tonight')await p.getByRole('button',{name:'Tonight',exact:true}).click();
  if(mode==='sky'&&width>=768&&['default','tonight'].includes(state))await p.getByText('Preparing your night plan…',{exact:true}).waitFor({state:'hidden',timeout:65000});
  if(state==='observe'){await p.getByRole('button',{name:'Observe',exact:true}).click();await p.locator('.ws-target').first().waitFor({timeout:60000});}
  if(state==='layers'||state==='provider'){await p.getByRole('button',{name:'Layers',exact:true}).click();await p.locator('.ws-layer').first().waitFor();if(state==='provider'){await p.route('**/api/earth/aircraft?*',r=>r.fulfill({status:503,body:'Qualification unavailable'}));await p.getByRole('switch',{name:'Aircraft near ORAS'}).click();await p.locator('.ws-layer[data-layer-id=aircraft] [data-provider-status=unavailable]').waitFor({timeout:20000});}}
  if(state==='selection'){
   if(mode==='earth'){
    let points=await frame.evaluate(()=>window.orasEarthVisibleTargets());let point=points.find(v=>v.kind==='satellites'&&v.x>80&&v.x<width-80&&v.y>80&&v.y<height-140)||points.find(v=>v.kind==='oras-site');
    if(!point)throw Error('No real visible selectable Earth target');await frame.locator('canvas').first().click({position:{x:point.x,y:point.y}});selected=point.name;
   }
   await p.getByRole('tab',{name:'Selection',exact:true}).waitFor({timeout:30000});if(mode==='sky'){await p.getByRole('button',{name:'Focus',exact:true}).click();await p.waitForTimeout(1500);}if(width>=768){await p.getByRole('button',{name:'Details',exact:true}).click();}await p.waitForTimeout(250);
  }
  if(state==='immersive')await p.getByRole('button',{name:'Immersive',exact:true}).click();
  if(state==='auto-hidden'){await p.locator('iframe').click({position:{x:500,y:300}});await p.locator('.ws-shell[data-chrome-state=AUTO_HIDDEN]').waitFor({timeout:10000});}
  const runtime=mode==='earth'?await frame.evaluate(()=>window.orasEarthDiagnostics()):null;
  results.push({id,width,height,mode,state,shellMs,readyMs,selected,runtime,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors});
 }else{await p.locator(`[data-runtime-status=${state==='error'?'error':'checking'}]`).waitFor();results.push({id,width,height,mode,state,shellMs,errors});}
 await p.screenshot({path:path.join(out,id+'.png')});console.log('CAPTURE',id,readyMs,selected||'');
}catch(error){results.push({id,error:String(error),errors});await p.screenshot({path:path.join(out,id+'-failed.png')});console.log('FAILED',id,String(error));}
await p.close();fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(results,null,2));}
await b.close();if(results.some(r=>r.error||r.overflow||r.errors?.length))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
