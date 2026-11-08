// Genuine pointer proof: native settings remain usable while Hub context is open.
import {chromium} from '../../node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const base=process.env.CIN_SKY_BASE||'http://127.0.0.1:4217',out=process.env.CIN_SKY_OUT||'output/cinematic-acceptance/sky/green'
await mkdir(out,{recursive:true})
const inputs=['runtimes/sky-adapter/plugin.js','frontend/src/features/workspace/skyCinematic.css','frontend/public/oras-sky-engine/oras-runtime-build.json','scripts/validation/verify_cinematic_sky_acceptance.mjs']
const sourceHashes=Object.fromEntries(await Promise.all(inputs.map(async path=>[path,createHash('sha256').update(await readFile(path)).digest('hex')])))
const proof={base,sourceHashes,status:'RUNNING',steps:[],errors:[]},browser=await chromium.launch({headless:true})
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(12000)
 page.on('pageerror',e=>proof.errors.push(e.message))
 const ready=()=>page.locator('[data-runtime-mode=sky][data-runtime-status=ready]').waitFor({timeout:90000})
 const sky=()=>page.frames().find(f=>f.url().includes('/oras-sky-engine/'))
 const native=()=>sky().evaluate(()=>({navigation:window.orasSkyAdapter.navigation(),atmosphere:window.__ORAS_STEL.core.atmosphere.visible,landscape:window.__ORAS_STEL.core.landscapes.current_id,choice:localStorage.getItem('oras.sky.atmosphere.v1')}))
 await page.goto(base+'/sky-engine?date=2026-08-13T04:00:00Z');await ready();proof.initial=await native()
 proof.servedArtifact=await (await page.request.get(base+'/oras-sky-engine/oras-runtime-build.json')).json()
 if(process.env.CIN_SKY_CHECK!=='overlap'){assert.equal(proof.initial.atmosphere,false,'Fresh native Sky must apply the approved atmosphere-off default');proof.steps.push('Fresh native atmosphere off; no forced time/observer/profile changes')}
 await page.getByRole('button',{name:"Tonight's targets",exact:true}).click()
 await page.locator('.ws-context').waitFor();await page.screenshot({path:out+'/context-and-native-rail.png'})
 // This must use real pointer hit testing; no force/evaluate click or panel close.
 await sky().getByRole('button',{name:'Observing tools',exact:true}).click()
 const toggle=sky().locator('[data-sky-control=atmosphere]');await toggle.waitFor()
 await toggle.click();proof.toggled=await native()
 assert.notEqual(proof.toggled.atmosphere,proof.initial.atmosphere)
 assert.equal(await page.locator('.ws-context').count(),1,'Hub context remains mounted during native panel use')
 await page.screenshot({path:out+'/native-observing-with-context-retained.png'})
 await sky().getByRole('button',{name:'Close Observing tools',exact:true}).click()
 assert.equal(await page.locator('.ws-context').isVisible(),true,'Hub context returns after native panel close')
 proof.steps.push('Real pointer opens and operates native observing controls beside retained Tonight context')
 await page.reload();await ready();proof.reloaded=await native()
 if(process.env.CIN_SKY_CHECK!=='overlap'){assert.equal(proof.reloaded.atmosphere,proof.toggled.atmosphere);assert.equal(proof.reloaded.choice,String(proof.toggled.atmosphere));proof.steps.push('Explicit native atmosphere choice survives renderer recreation/reload')}
 assert.equal(proof.reloaded.navigation.utc,proof.initial.navigation.utc);assert.deepEqual(proof.reloaded.navigation.observer,proof.initial.navigation.observer);assert.equal(proof.reloaded.landscape,'pennsylvania-woodland-v1')
 if(process.env.CIN_SKY_CHECK!=='overlap'){
  await page.getByRole('button',{name:'Choose exploration mode',exact:true}).click()
  await page.getByRole('navigation',{name:'Exploration modes'}).getByRole('button',{name:'Solar System',exact:true}).click()
  await page.locator('[data-solar-status=ready]').waitFor({timeout:30000})
  assert.equal(await page.locator('iframe').count(),0)
  await page.getByRole('button',{name:'Return to Sky',exact:true}).click();await ready();proof.returned=await native()
  assert.equal(proof.returned.atmosphere,proof.toggled.atmosphere);assert.equal(proof.returned.navigation.utc,proof.initial.navigation.utc);assert.deepEqual(proof.returned.navigation.observer,proof.initial.navigation.observer);assert.equal(proof.returned.landscape,'pennsylvania-woodland-v1');assert.equal(await page.locator('iframe').count(),1)
  proof.steps.push('Explicit native atmosphere choice survives Sky→Solar→Sky with observer/UTC/landscape and one renderer')
 }
 assert.deepEqual(proof.errors,[]);proof.steps.push('Native observer/UTC/Pennsylvania retained; zero page errors')
 for(const path of inputs)assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'),sourceHashes[path],'Qualification source changed during proof')
 proof.status='PASS';await context.close()
}catch(error){proof.status='FAIL';proof.error=error.stack;throw error}
finally{await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');await browser.close()}
