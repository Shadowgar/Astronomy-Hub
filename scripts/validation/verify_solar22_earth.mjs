import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'
const base=process.argv[2]||'http://127.0.0.1:4231',out=process.argv[3]||'output/playwright/solar-system-2.2/earth'
await mkdir(out,{recursive:true})
const epoch='2026-10-27T04:00:00.000Z',receipt={base,epoch,platform:process.platform,runs:[],errors:[]}
const browser=await chromium.launch({headless:process.platform!=='win32',...(process.platform==='win32'?{executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']}: {})})
const norm=a=>a.map(v=>v/Math.hypot(...a)),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],add=(a,b,s=1)=>a.map((v,i)=>v+b[i]*s)
try{
 receipt.browserVersion=browser.version()
 const context=await browser.newContext({viewport:{width:Number(process.argv[4]||1440),height:Number(process.argv[5]||900)},reducedMotion:'reduce'}),page=await context.newPage()
 page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')receipt.errors.push(m.text())})
 async function ready(){await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d&&d.texturesReady>=9&&!d.detail.pending&&d.earthOrientation.frame==='ITRS'&&d.atmosphere.active&&!d.animating},null,{timeout:90000})}
 await page.goto(base+'/solar-system?date='+epoch+'&solarBody=earth');await ready()
 const initial=await page.evaluate(()=>window.orasSolarDiagnostics()),earth=initial.bodies.find(b=>b.id==='earth'),sun=initial.bodies.find(b=>b.id==='sun'),R=earth.radiusAu,auM=149597870700,light=norm(sun.position.map((v,i)=>v-earth.position[i])),north=initial.earthOrientation.icrfToItrs.slice(6,9),side=norm(cross(light,north))
 receipt.initial=initial;receipt.viewport=page.viewportSize()
 receipt.webgl=await page.evaluate(()=>{const gl=document.querySelector('.solar-canvas canvas').getContext('webgl2'),d=gl.getExtension('WEBGL_debug_renderer_info');return{vendor:gl.getParameter(d?d.UNMASKED_VENDOR_WEBGL:gl.VENDOR),renderer:gl.getParameter(d?d.UNMASKED_RENDERER_WEBGL:gl.RENDERER)}})
 for(const [name,direction,radius] of [['day',light,3*R],['limb',side,3*R],['crescent',norm(add(side,light,-1.4)),3*R],['backlit',light.map(v=>-v),3*R],['near-horizon',side,R+20000/auM]]){
  const camera=add(earth.position,direction,radius),target=name==='near-horizon'?add(add(camera,light,350000/auM),side,-5000/auM):earth.position
  const view={schema:'oras.solar-return.v1',epoch,camera,target,cameraUp:name==='near-horizon'?side:north,cameraView:'custom',closeView:true,near:100/auM,preferences:{overview:'inner',quality:'balanced',sizeMode:'physical',orbits:false,effects:true,belt:false,beltDensity:2400,navigation:'orbit',asteroids:false,rate:86400}}
  await page.evaluate(view=>history.replaceState({...history.state,usr:{...history.state?.usr,r4SolarView:view}},''),view);await page.reload();await ready()
  const run={name,variants:[]};receipt.runs.push(run)
  for(const method of ['takram','custom']){
   if(method==='custom'){await page.getByRole('button',{name:'Science, scale & sources',exact:true}).click();await page.getByLabel('Earth atmosphere method',{exact:true}).selectOption('custom');await page.getByRole('button',{name:'Close panel',exact:true}).click();await page.waitForFunction(()=>!window.orasSolarDiagnostics().atmosphere.active)}
   await page.screenshot({path:path.join(out,name+'-'+method+'.png')})
   const d=await page.evaluate(()=>window.orasSolarDiagnostics());assert.equal(d.pipeline.toneMappingStages,1);assert.equal(d.atmosphere.method,method);assert.equal(d.atmosphere.active,method==='takram');assert.equal(Date.parse(d.epoch),Date.parse(epoch))
   run.variants.push({method,diagnostics:d});console.log(name,method,'PASS')
  }
  const[a,b]=run.variants;assert.deepEqual(a.diagnostics.camera,b.diagnostics.camera);assert.deepEqual(a.diagnostics.target,b.diagnostics.target)
  await writeFile(path.join(out,'application.json'),JSON.stringify(receipt,null,2))
 }
 assert.deepEqual(receipt.errors,[])
 receipt.status='PASS';await context.close()
}finally{await browser.close();await writeFile(path.join(out,'application.json'),JSON.stringify(receipt,null,2))}
