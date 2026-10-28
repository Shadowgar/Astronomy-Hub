import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import path from 'node:path'
import assert from 'node:assert/strict'

const base=process.argv[2]||'http://127.0.0.1:4231',out=process.argv[3]||'output/playwright/solar-system-2.1/terrain-handoffs',epoch='2026-10-28T00:00:00.000Z'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:process.platform!=='win32',...(process.platform==='win32'?{executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']}: {})})
const proof={base,platform:process.platform,browserVersion:browser.version(),epoch,runs:[]}
const sourceSha=createHash('sha256').update(await readFile(new URL('../public/planet-terrain/apollo17-nac-v1/manifest.json',import.meta.url))).digest('hex')
try{
 for(const failure of ['none','manifest pending','manifest failed','GPU initialization failed'])for(const mode of ['Earth','Sky']){
  const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),run={failure,mode,errors:[]};proof.runs.push(run)
  page.on('pageerror',e=>run.errors.push(e.message));let release=()=>{}
  try{
   const actual=await (await context.request.get(base+'/planet-terrain/apollo17-nac-v1/manifest.json')).body();run.manifestSha256=createHash('sha256').update(actual).digest('hex');assert.equal(run.manifestSha256,sourceSha)
   if(failure==='manifest failed')await page.route('**/planet-terrain/apollo17-nac-v1/manifest.json',route=>route.fulfill({status:503,body:'Controlled source failure'}))
   if(failure==='manifest pending'){const gate=new Promise(resolve=>release=resolve);await page.route('**/planet-terrain/apollo17-nac-v1/manifest.json',async route=>{await gate;await route.abort().catch(()=>{})})}
   if(failure==='GPU initialization failed')await page.addInitScript(()=>{if(window!==window.top)return;const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'||kind==='webgl'?null:original.call(this,kind,...args)};window.__restoreTerrainGpu=()=>HTMLCanvasElement.prototype.getContext=original})
   const response=await page.goto(base+'/planet-terrain/apollo17-nac-v1?'+new URLSearchParams({date:epoch,lat:'40',lng:'-80',elev:'400',elevationSource:'provided'}));assert.equal(response.status(),200);assert.equal(new URL(page.url()).origin,base)
   if(failure==='none'){await page.locator('[data-terrain-status="ready"]').waitFor({timeout:30000});run.terrain=await page.evaluate(()=>window.orasTerrainDiagnostics());assert.equal(run.terrain.library.instanceOfTilesRenderer,true)}
   else if(failure==='manifest pending')await page.locator('[data-terrain-status="loading"]').waitFor()
   else await page.locator('[data-terrain-status="error"]').waitFor({timeout:30000})
   if(failure==='GPU initialization failed')await page.evaluate(()=>window.__restoreTerrainGpu())
   await page.getByRole('button',{name:'Choose exploration mode',exact:true}).click();await page.getByRole('navigation',{name:'Exploration modes'}).getByRole('button',{name:mode,exact:true}).click();release()
   await page.locator(`[data-runtime-mode="${mode.toLowerCase()}"][data-runtime-status="ready"]`).waitFor({timeout:90000})
   const frame=page.frames().find(f=>f.url().includes(mode==='Earth'?'/earth-runtime/':'/oras-sky-engine/'))
   await frame.waitForFunction(mode=>{const n=mode==='Earth'?window.orasEarthDiagnostics()?.navigation:window.orasSkyAdapter?.navigation();return n&&Math.abs(n.observer.lat-40)<1e-5&&Math.abs(n.observer.lon+80)<1e-5&&n.observer.elevationM===400},mode,{timeout:15000})
   run.native=await frame.evaluate(mode=>mode==='Earth'?window.orasEarthDiagnostics().navigation:window.orasSkyAdapter.navigation(),mode)
   assert(Math.abs(Date.parse(run.native.utc)-Date.parse(epoch))<1000);assert.equal(await page.locator('.terrain-stage canvas').count(),0);assert.equal(await page.locator('iframe').count(),1)
   run.url=page.url();assert.equal(new URL(run.url).searchParams.get('elev'),'400');run.disposed=await page.evaluate(()=>window.orasTerrainDisposed?.at(-1)||null)
   if(failure==='none'){assert.equal(run.disposed.disposed,true);assert.equal(run.disposed.graphics.geometries,0);assert.equal(run.disposed.graphics.textures,0)}
   assert.deepEqual(run.errors,[]);run.status='PASS';console.log(failure,mode,'PASS');await page.screenshot({path:path.join(out,failure.replaceAll(' ','-')+'-'+mode.toLowerCase()+'.png')})
  }catch(error){run.status='FAIL';run.error=String(error);run.url=page.url();run.body=await page.locator('body').innerText().catch(()=>'unavailable');console.log(failure,mode,'FAIL',String(error));await page.screenshot({path:path.join(out,'failure-'+failure.replaceAll(' ','-')+'-'+mode.toLowerCase()+'.png')}).catch(()=>{})}
  finally{release();await context.close();await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2))}
 }
}finally{await browser.close();proof.status=proof.runs.length===8&&proof.runs.every(r=>r.status==='PASS')?'PASS':'FAIL';await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2))}
if(proof.status!=='PASS')process.exitCode=1
