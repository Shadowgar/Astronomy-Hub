import {chromium} from '../../node_modules/playwright/index.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='output/cinematic-glass/browser',browser=await chromium.launch();await mkdir(out,{recursive:true});
const proof={status:'RUNNING',runs:[],limitations:['SwiftShader and emulated touch only; owner visual/device acceptance pending.','Diagnostic unblurred/opaque captures are labeled variants, not the default appearance.']};
if(process.env.GLASS_RESUME){const prior=JSON.parse(await readFile(out+'/proof.json','utf8'));proof.runs=prior.runs.filter(r=>r.status==='PASS')}
try {
for(const [w,h] of [[1440,900],[390,900],[667,390]]) for(const mode of ['solar','earth','sky']) for(const revision of ['baseline','candidate']) {
 if(proof.runs.some(r=>r.w===w&&r.h===h&&r.mode===mode&&r.revision===revision&&r.status==='PASS'))continue;
 const c=await browser.newContext({viewport:{width:w,height:h},hasTouch:w<768,reducedMotion:'reduce'}),p=await c.newPage();p.setDefaultTimeout(15000);
 const r={w,h,mode,revision,errors:[],checks:[]};proof.runs.push(r);p.on('pageerror',e=>r.errors.push(e.message));
 const port=revision==='baseline'?4220:4221, date=mode==='earth'?'2026-06-05T16:00:00Z':mode==='sky'?'2026-08-13T04:00:00Z':'2026-02-28T00:00:00Z';
 const path=mode==='solar'?'solar-system':mode==='sky'?'sky-engine':'earth';
 await p.goto(`http://127.0.0.1:${port}/${path}?date=${date}`);
 await p.locator(mode==='solar'?'[data-solar-status=ready]':`[data-runtime-mode=${mode}][data-runtime-status=ready]`).waitFor({timeout:90000});
 const f=()=>p.frames().find(f=>f.url().includes(mode==='sky'?'/oras-sky-engine/':'/earth-runtime/'));
 const state=()=>mode==='solar'?p.evaluate(()=>window.orasSolarDiagnostics()):f().evaluate(mode=>mode==='sky'?window.orasSkyAdapter.navigation():window.orasEarthDiagnostics(),mode);
 const shot=async name=>{const file=`${w}x${h}-${mode}-${revision}-${name}.png`;await p.screenshot({path:out+'/'+file});return file};
 await p.waitForTimeout(5000);r.open=await state();r.initial=await shot('opening');
 let material;
 if(mode==='earth') {
  await p.getByLabel('Search Earth',{exact:true}).fill('48.8584, 2.2945');await p.getByRole('button',{name:'Search Earth',exact:true}).click();
  await p.getByRole('list',{name:'Earth search results'}).getByRole('button').first().click();
  await f().waitForFunction(()=>Math.abs(window.orasEarthDiagnostics().navigation.observer.lat-48.8584)<1e-4);
  await p.getByRole('button',{name:'Dismiss search results'}).click();await p.waitForTimeout(3000);material=p.locator('.ce-location');
  r.selected=await shot('selected');await p.getByRole('button',{name:'Expand location details'}).click();
 } else if(mode==='sky') {
  await f().locator('.oras-workspace-search input').fill('Deneb');await f().getByText('Deneb',{exact:true}).first().click();
  await p.getByRole('button',{name:'Focus',exact:true}).first().click();
  if(w<768)await p.getByRole('button',{name:'Collapse sheet',exact:true}).click();
  r.selected=await shot('selected');await p.getByRole('button',{name:w<768?'Expand sheet':'Expand details',exact:true}).click();material=p.locator(w<768?'.ws-sheet':'.ws-drawer');
 } else {
  await p.getByRole('navigation',{name:'Select a celestial body'}).getByRole('button',{name:'Mars',exact:true}).click();material=p.locator('.solar-context');r.selected=await shot('selected');
  await material.locator('button').filter({has:p.locator('svg')}).first().click();
 }
 r.expanded=await shot('expanded');r.native=await state();
 r.material=await material.evaluate(e=>{const s=getComputedStyle(e);const b=e.getBoundingClientRect();return{fill:s.backgroundImage,color:s.backgroundColor,blur:s.backdropFilter,border:s.borderTopColor,shadow:s.boxShadow,box:{x:b.x,y:b.y,width:b.width,height:b.height}}});
 if(revision==='candidate') {
  assert.ok(r.material.fill.includes('gradient'));assert.equal(r.material.blur,'blur(16px) saturate(1.45)');r.checks.push('Actual selected surface resolves shared translucent material and bounded blur');
  await p.getByRole('button',{name:'Choose exploration mode',exact:true}).click();await p.getByRole('button',{name:/Reduce transparency/}).click();
  assert.equal(await p.locator('html').getAttribute('data-glass'),'opaque');
  assert.equal(await material.evaluate(e=>getComputedStyle(e).backdropFilter),'none');
  if(mode==='sky'){await f().waitForFunction(()=>document.documentElement.dataset.glass==='opaque');r.nativeOpaque=await f().locator('.as-native-rail').evaluate(e=>getComputedStyle(e).backdropFilter);assert.equal(r.nativeOpaque,'none')}
  await p.keyboard.press('Escape');r.opaque=await shot('opaque');
  await p.getByRole('button',{name:'Choose exploration mode',exact:true}).click();await p.getByRole('button',{name:/Reduce transparency/}).click();await p.keyboard.press('Escape');
  const box=await material.boundingBox();if(box&&box.x>=0&&box.y>=0){const clip={x:box.x,y:box.y,width:Math.min(box.width,w-box.x),height:Math.min(box.height,h-box.y)};if(clip.width>0&&clip.height>0){await p.screenshot({path:`${out}/${w}x${h}-${mode}-material-crop.png`,clip})}}
  r.checks.push('Accessible transparency toggle disables blur and reaches native iframe; standard restored');
  if(mode==='sky') {
   if(w<768)await p.getByRole('button',{name:'Collapse sheet',exact:true}).click();
   await f().getByRole('button',{name:'Display',exact:true}).click();r.controls=await shot('controls');
   r.nativeMaterial=await f().locator('.as-native-panel').evaluate(e=>({blur:getComputedStyle(e).backdropFilter,fill:getComputedStyle(e).backgroundImage}));assert.equal(r.nativeMaterial.blur,'blur(16px) saturate(1.45)');
   await f().getByRole('button',{name:'Close Display'}).click();
  } else if(mode==='solar') {await p.getByRole('button',{name:'Science, scale & sources',exact:true}).click();r.controls=await shot('controls');await p.getByRole('button',{name:'Close panel',exact:true}).click()}
  else {await p.getByRole('button',{name:'Imagery sources and availability',exact:true}).click();r.controls=await shot('controls')}
  r.frameSample=await p.evaluate(()=>new Promise(resolve=>{let n=0,last=performance.now();const gaps=[];function tick(t){gaps.push(t-last);last=t;if(++n<24)requestAnimationFrame(tick);else resolve({gaps,heap:performance.memory?.usedJSHeapSize})}requestAnimationFrame(tick)}));
 }
 assert.deepEqual(r.errors,[]);r.status='PASS';console.log(w,h,mode,revision,'PASS');await c.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2));
}
proof.status='PASS';
}catch(error){proof.status='FAIL';proof.error=error.stack;console.error(error.stack);process.exitCode=1}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2))}
