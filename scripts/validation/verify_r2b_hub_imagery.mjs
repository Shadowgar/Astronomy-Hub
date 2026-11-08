// Actual product search, accepted wheel navigation and native imagery refinement.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '../../node_modules/playwright/index.mjs';
const width=Number(process.env.R2B_WIDTH||1440),out=`output/playwright/r2-b-hub-${width}`,sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir(out,{recursive:true});
const proof={status:'RUNNING',width,sourceHashes:{},scenes:[],limitations:['Software Chromium and emulated mobile; genuine source availability varies.','PEMA captures remain owner-local, not licensed for public redistribution.']};
for(const path of ['scripts/validation/verify_r2b_hub_imagery.mjs','integrations/renderers.lock.json','frontend/public/runtime-versions.json','frontend/src/features/workspace/WorkspaceShell.tsx','frontend/src/features/workspace/DiagnosticsSurface.tsx','frontend/src/features/workspace/ImageryCacheSection.tsx'])proof.sourceHashes[path]=sha(await readFile(path));
const b=await chromium.launch({headless:true}),c=await b.newContext({viewport:{width,height:844},isMobile:width<768,hasTouch:width<768});
await c.addInitScript(()=>sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']})));
const p=await c.newPage();p.setDefaultTimeout(15000);
const frame=()=>p.frames().find(f=>f.url().includes('/earth-runtime/')),state=()=>frame().evaluate(()=>window.orasEarthDiagnostics());
try{
 await p.goto('http://127.0.0.1:4204/earth?date=2026-06-05T17:00:00.000Z');await p.locator('[data-runtime-mode=earth][data-runtime-status=ready]').waitFor({timeout:90000});
 for(const [label,lat,lon,target]of [['paris',48.8566,2.3522,2000],['oras-local',41.321903,-79.585394,900]]){
  await p.getByRole('button',{name:'Explore',exact:true}).click();await p.getByLabel('Find a place or address',{exact:true}).fill(`${lat}, ${lon}`);await p.getByRole('button',{name:'Search Earth',exact:true}).click();await p.getByRole('list',{name:'Earth search results'}).getByRole('button').first().click();await p.getByRole('status').filter({hasText:'Approaching location…'}).waitFor({state:'hidden'});await p.getByRole('button',{name:'Close dialog',exact:true}).click();
  const box=await frame().locator('canvas').first().boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);
  let count=0;while((await state()).cameraHeightM>target*1.1&&count++<30){await p.mouse.wheel(0,-180);await p.waitForTimeout(450)}
  const before=await state();assert.ok(before.cameraHeightM>300&&before.cameraHeightM<target*1.5,'Accepted wheel reaches imagery detail without entering Sky');
  await frame().waitForFunction(()=>{const d=window.orasEarthDiagnostics();return d.imagery.actual!=='local'&&d.imagery.sources[d.imagery.actual]?.loaded>0},null,{timeout:30000});
  const row={label,native:await state(),file:label+'.png'};assert.ok(Math.abs(row.native.navigation.observer.lat-lat)<.001&&Math.abs(row.native.navigation.observer.lon-lon)<.001);assert.equal(row.native.navigation.utc,'2026-06-05T17:00:00.000Z');assert.equal(await p.locator('iframe').count(),1);await p.screenshot({path:out+'/'+row.file,timeout:12000});row.sha256=sha(await readFile(out+'/'+row.file));proof.scenes.push(row);console.log(width,label,row.native.imagery.actual,row.native.cameraHeightM);
 }
 await p.getByRole('button',{name:'Workspace menu',exact:true}).click();await p.getByRole('button',{name:'Diagnostics',exact:true}).click();await p.getByRole('heading',{name:'Imagery Cache',exact:true}).waitFor();proof.sourcesFile='sources-quality.png';await p.screenshot({path:out+'/'+proof.sourcesFile,timeout:12000});proof.sourcesSha256=sha(await readFile(out+'/'+proof.sourcesFile));proof.status='PASS';
}catch(e){proof.status='FAIL';proof.error=e.stack;throw e}finally{await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');await c.close();await b.close()}
