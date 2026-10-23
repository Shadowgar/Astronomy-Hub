// Read-only visual audit of the real Docker preview. Native UI toggles are restored.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
const base=process.env.CIN_SKY_BASE||'http://127.0.0.1:4216'
const out=process.env.CIN_SKY_OUT||'output/cinematic-acceptance/sky'
const widths=(process.env.CIN_SKY_WIDTHS||'1440,390,667').split(',').map(Number)
await mkdir(out,{recursive:true})
const proof={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base,status:'RUNNING',runs:[],limitations:['Chromium software rendering and emulated touch; owner visual and physical-device acceptance remain open.','Astronomical darkness is computed separately from actual site weather, transparency, seeing and light pollution. No measured site conditions are claimed.']}
const browser=await chromium.launch({headless:true})
try{
 for(const width of widths){
  const height=width===667?390:900
  const run={width,height,errors:[],failedRequests:[],httpErrors:[],scenes:[]};proof.runs.push(run)
  for(const [name,utc,target] of [['historical','2026-02-28T00:00:00Z','Sirius'],['astronomical-night','2026-08-13T04:00:00Z','Deneb']]){
   // These are independent default-scene comparisons. Preference continuity and
   // retained-context pointer behavior have a separate genuine journey proof.
   const context=await browser.newContext({viewport:{width,height},hasTouch:width<768,reducedMotion:'reduce'})
   const page=await context.newPage();page.setDefaultTimeout(15000)
   page.on('pageerror',error=>run.errors.push(error.message))
   page.on('requestfailed',request=>run.failedRequests.push({url:request.url(),error:request.failure()?.errorText}))
   page.on('response',response=>{if(response.status()>=400)run.httpErrors.push({url:response.url(),status:response.status()})})
   console.log(width,name,'load')
   const scene={name,utc,target,screens:[]};run.scenes.push(scene)
   await page.goto(base+'/sky-engine?date='+utc)
   await page.locator('[data-runtime-mode=sky][data-runtime-status=ready]').waitFor({timeout:90000})
   const frame=page.frames().find(frame=>frame.url().includes('/oras-sky-engine/'))
   const read=()=>frame.evaluate(()=>{
    const core=window.__ORAS_STEL.core,app=document.querySelector('#app').__vue__
    const pick=obj=>{try{return JSON.parse(JSON.stringify(obj.jsonData||obj))}catch{return String(obj)}}
    return {navigation:window.orasSkyAdapter.navigation(),selection:window.orasSkyAdapter.snapshot().selection,landscape:core.landscapes.current_id,atmosphere:core.atmosphere.visible,stars:pick(core.stars),milkyway:pick(core.milkyway),milkywayVisible:core.milkyway.visible,dssVisible:core.dss.visible,constellations:{lines:core.constellations.lines_visible,labels:core.constellations.labels_visible,art:core.constellations.images_visible},dsos:core.dsos.visible,night:app.$store.state.nightmode,denseProfile:app.$store.state.orasDenseStarsProfile,storage:Object.fromEntries(Object.entries(localStorage))}
   })
   const shot=async state=>{const file=`${width}x${height}-${name}-${state}.png`;await page.screenshot({path:out+'/'+file});scene.screens.push(file)}
   scene.initial=await read();await shot('initial')
   // Separate ready bootstrap from subsequently loaded native star/imagery tiles.
   await page.waitForTimeout(5000);scene.settled=await read();await shot('settled')
   if(scene.settled.atmosphere){
    await frame.getByRole('button',{name:'Observing tools',exact:true}).click()
    await frame.locator('[data-sky-control=atmosphere]').click()
    await frame.getByRole('button',{name:'Close Observing tools',exact:true}).click()
    await page.waitForTimeout(1500);scene.controlledAtmosphereOff=await read();await shot('native-atmosphere-off')
   }
   const response=await page.request.get(base+`/api/above-me?lat=41.321903&lng=-79.585394&elev=432.816&time=${encodeURIComponent(utc)}&limit=3`,{timeout:45000})
   scene.observabilityHttp=response.status();try{scene.observability=await response.json()}catch{scene.observability=await response.text()}
   await frame.locator('.oras-workspace-search input').fill(target)
   await frame.getByText(target,{exact:true}).first().click()
   await frame.waitForFunction(target=>window.orasSkyAdapter.snapshot().selection?.name?.includes(target),target)
   await page.getByRole('button',{name:'Focus',exact:true}).first().click()
   await page.waitForTimeout(1500);scene.selected=await read()
   if(width<768&&await page.getByRole('button',{name:'Collapse sheet',exact:true}).first().isVisible())await page.getByRole('button',{name:'Collapse sheet',exact:true}).first().click()
   await shot('selected-collapsed')
   const expand=page.getByRole('button',{name:width<768?'Expand sheet':'Expand details',exact:true})
   if(await expand.isVisible()){await expand.click();await shot('selected-expanded')}
   const close=page.getByRole('button',{name:width<768?'Close sheet':'Deselect',exact:true})
   if(await close.isVisible())await close.click()
   await frame.getByRole('button',{name:'Constellations',exact:true}).click()
   const toggle=frame.locator('[data-sky-control=constellations]')
   const was=await toggle.getAttribute('aria-pressed')
   if(was==='false')await toggle.click()
   await frame.getByRole('button',{name:'Close Constellations',exact:true}).click()
   await page.waitForTimeout(1500);scene.withConstellations=await read();await shot('constellations')
   if(was==='false'){await frame.getByRole('button',{name:'Constellations',exact:true}).click();await frame.locator('[data-sky-control=constellations]').click();await frame.getByRole('button',{name:'Close Constellations',exact:true}).click()}
   if(scene.settled.atmosphere){await frame.getByRole('button',{name:'Observing tools',exact:true}).click();await frame.locator('[data-sky-control=atmosphere]').click();await frame.getByRole('button',{name:'Close Observing tools',exact:true}).click()}
   scene.restored=await read()
   console.log(width,name,'captured',scene.screens.length,'screens')
   await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n')
   await context.close()
  }
 }
 proof.status='AUDIT_COMPLETE'
}catch(error){proof.status='FAILED';proof.error=error.stack;throw error}
finally{await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');await browser.close()}
