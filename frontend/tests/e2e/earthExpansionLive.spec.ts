import {test,expect} from '@playwright/test'
import {writeFileSync,mkdirSync} from 'node:fs'
const names={earthquakes:'Earthquakes · M2.5+ · past day','fire-perimeters':'Fire perimeters · recent subset','weather-radar':'Radar reflectivity · CONUS'}
// Explicit opt-in: these checks acquire real providers and never substitute fixtures.
test('live providers render source-backed events and radar in Docker',async({page})=>{
 test.skip(process.env.ORAS_LIVE_EARTH!=='1','live provider opt-in required');test.setTimeout(180000)
 await page.setViewportSize({width:1440,height:900});await page.addInitScript(()=>sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']})))
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/earth');await expect(page.locator('[data-runtime-mode=earth][data-runtime-status=ready]')).toBeVisible({timeout:90000})
 const measurements:any[]=[]
 for(const id of Object.keys(names) as (keyof typeof names)[]){
  const earth=page.frames().find(frame=>frame.url().includes('/earth-runtime/'))!;const response=await page.request.get('/api/earth/'+id);expect(response.status()).toBe(200);const dto=await response.json();
  await page.getByRole('button',{name:'Layers',exact:true}).click();const started=Date.now();await page.getByRole('switch',{name:names[id],exact:true}).click();await expect(page.locator(`.ws-layer[data-layer-id=${id}]`)).toContainText(id==='earthquakes'?'Recent event feed':'Current snapshot',{timeout:25000})
  const diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics());measurements.push({id,activationMs:Date.now()-started,records:dto.records?.length??1,sourceTime:dto.observedAt??dto.latest,provider:diag.providers[id],entities:diag.entityCount})
  await page.screenshot({path:`../output/playwright/earth-expansion/live-${id}-enabled.png`});await page.getByRole('region',{name:'Earth layers'}).getByRole('button',{name:'Close panel',exact:true}).click()
  let target:any;await expect.poll(async()=>{target=await earth.evaluate(layer=>(window as any).orasEarthVisibleTargets().find((row:any)=>row.kind===layer&&row.x>30&&row.x<innerWidth-30&&row.y>100&&row.y<innerHeight-150),id);return !!target}).toBe(true)
  await earth.locator('canvas').first().click({position:{x:target.x,y:target.y}});await expect(page.getByRole('region',{name:'Selected object'})).toContainText(target.name);await page.getByRole('button',{name:'Focus',exact:true}).click();await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().cameraHeightM)).toBeLessThan(id==='weather-radar'?6000000:100000)
  await page.screenshot({path:`../output/playwright/earth-expansion/live-${id}-selected.png`});await page.getByRole('button',{name:'Deselect',exact:true}).click();await earth.locator('#home').evaluate((node:any)=>node.click());await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByRole('switch',{name:names[id],exact:true}).click();await expect(page.locator(`.ws-layer[data-layer-id=${id}]`)).toContainText('Off');await page.getByRole('region',{name:'Earth layers'}).getByRole('button',{name:'Close panel',exact:true}).click();await page.reload();await expect(page.locator('[data-runtime-mode=earth][data-runtime-status=ready]')).toBeVisible({timeout:90000})
 }
 expect(errors).toEqual([]);mkdirSync('../output/playwright/earth-expansion',{recursive:true});writeFileSync('../output/playwright/earth-expansion/live-measurements.json',JSON.stringify({measurements,errors},null,2))
})
