import{chromium}from'../../node_modules/playwright/index.mjs'
import{mkdir,writeFile,readFile}from'node:fs/promises'
import{createHash}from'node:crypto'
import assert from'node:assert/strict'
const out=process.env.SOLAR_OUT||'output/solar-cinematic-balance/presentation',base='http://172.26.23.204:4218',browser=await chromium.launch(),proof={status:'RUNNING',runs:[],sourceHashes:{}}
await mkdir(out,{recursive:true});for(const n of ['SolarScene.ts','SolarWorkspace.tsx','solarPresentation.ts','solar.css','solarContracts.ts'])proof.sourceHashes[n]=createHash('sha256').update(await readFile('frontend/src/features/solar/'+n)).digest('hex')
try{
 for(const[width,height]of[[1440,900],[390,900],[540,390],[320,568]])for(const epoch of ['2026-02-28T00:00:00Z','2026-10-23T01:05:00.123Z']){
  const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce',hasTouch:width<768}),row={width,height,epoch,checks:[],states:[]};proof.runs.push(row);p.setDefaultTimeout(15000)
  await p.goto(base+'/solar-system?date='+epoch);await p.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.texturesReady===2&&d.cloudsReady&&!d.animating});const source=await p.evaluate(()=>window.orasSolarDiagnostics().bodies.map(b=>b.position))
  for(const[preset,label]of[['inner','Inner planets'],['full','All planets'],['outer','Outer planets']]){
   await p.getByRole('button',{name:label,exact:true}).click();await p.waitForFunction(()=>!window.orasSolarDiagnostics().animating);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
   const d=await p.evaluate(()=>window.orasSolarDiagnostics());row.states.push(d);assert.equal(d.sizeMode,'cinematic');assert.equal(d.cameraView,preset);assert.ok(d.bodies.every(b=>b.visible));assert.deepEqual(d.bodies.map(b=>b.position),source);assert.equal(Date.parse(d.epoch),Date.parse(epoch))
   const bodies=d.bodies.filter(b=>b.inView&&b.screenRadius>=2),hud=await p.locator('.solar-header,.solar-bodies,.solar-context,.solar-camera,.solar-time-bar').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()))
   for(let i=0;i<bodies.length;i++){
    const a=bodies[i],[x,y]=a.screen,r=a.screenRadius;if(a.displayFactor>1){assert.ok(x-r>=0&&x+r<=width&&y-r>=0&&y+r<=height,'Enlarged globe clears viewport '+a.id);for(const o of hud)assert.ok(x+r<=o.left||x-r>=o.right||y+r<=o.top||y-r>=o.bottom,'Enlarged globe clears HUD '+a.id)}
    for(const b of bodies.slice(i+1))assert.ok(Math.hypot(x-b.screen[0],y-b.screen[1])>=r+b.screenRadius-.5,'No false enlarged-disk overlap '+a.id+'/'+b.id)
   }
   await p.screenshot({path:out+'/'+width+'x'+height+'-'+(epoch.includes('02-28')?'historical':'current')+'-'+preset+'.png'});row.checks.push(preset+' cinematic frustum/source, nonoverlap and HUD clearance')
  }
  const before=await p.evaluate(()=>window.orasSolarDiagnostics());await p.getByRole('button',{name:'Science, scale & sources',exact:true}).click();await p.getByRole('combobox',{name:'Body size display',exact:true}).selectOption('physical');await p.getByRole('button',{name:'Close panel',exact:true}).click();const after=await p.evaluate(()=>window.orasSolarDiagnostics());assert.ok(after.bodies.every(b=>b.displayFactor===1));assert.deepEqual(after.bodies.map(b=>b.position),source);assert.deepEqual(after.camera,before.camera);assert.deepEqual(after.target,before.target);assert.equal(after.epoch,before.epoch);row.checks.push('True scale changes only display radii, preserving camera/source/time');row.status='PASS';await p.close();console.log('PASS',width,height,epoch,row.checks.length)
 }
 proof.status='PASS'
}catch(e){proof.status='FAIL';proof.error=e.stack;process.exitCode=1}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n')}
