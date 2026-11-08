// Isolated shared-system shader regression proof. No scientific API is mocked.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
const base=process.argv[2]||'http://127.0.0.1:4234',out=process.argv[3]||'output/playwright/solar2/system-lighting.json'
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const errors=[];let result
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 await page.route('**/__system_lighting_verification__',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated planetary system lighting verification</title>'}))
 await page.goto(base+'/__system_lighting_verification__')
 result=await page.evaluate(async()=>{
  const T=await import('/node_modules/.vite/deps/three.js'),M=await import('/src/features/systems/systemMaterials.ts')
  const renderer=new T.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(128,128);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),device=gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER)
  const camera=new T.PerspectiveCamera(40,1,.01,1e6);camera.position.set(3,2,6);camera.lookAt(3,2,1)
  const scene=new T.Scene(),map=new T.DataTexture(new Uint8Array([160,160,160,255]),1,1,T.RGBAFormat);map.needsUpdate=true
  const bodyPositionKm=[3000,2000,1000],before=[...bodyPositionKm],results=[]
  for(const [kind,id] of [['earth','earth'],['clouds','earth'],['atmosphere','earth'],['moon','moon'],['planet','jupiter'],['planet','saturn'],['planet','mars']]){
   const material=M.systemMaterial(kind,id),mesh=new T.Mesh(new T.SphereGeometry(kind==='atmosphere'?1.018:1,48,32),material);mesh.position.set(3,2,1);scene.add(mesh)
   if(material.uniforms.map){material.uniforms.map.value=map;if(material.uniforms.hasMap)material.uniforms.hasMap.value=true}
   const samples=[]
   for(const sign of [1,-1]){
    const sunKm=[3000,2000,1000+sign*149000000]
    // Legacy branch reproduces the exact original SystemScene update contract.
    if(M.updateSystemMaterialLight)M.updateSystemMaterialLight(material,bodyPositionKm,sunKm)
    else material.uniforms.sourceSun.value.fromArray(sunKm.map(n=>n/1000))
    renderer.render(scene,camera);const pixels=new Uint8Array(128*128*4);gl.readPixels(0,0,128,128,gl.RGBA,gl.UNSIGNED_BYTE,pixels)
    let total=0;for(let i=0;i<pixels.length;i+=4)total+=pixels[i]+pixels[i+1]+pixels[i+2]
    samples.push({mean:total/(128*128*3),error:gl.getError()})
   }
   results.push({kind,id,samples,respondsToSourceSun:samples[0].mean>samples[1].mean+1})
   scene.remove(mesh);mesh.geometry.dispose();material.dispose()
  }
  map.dispose();renderer.dispose();renderer.forceContextLoss()
  return{device,explicitAdapter:!!M.updateSystemMaterialLight,positionsUnchanged:JSON.stringify(bodyPositionKm)===JSON.stringify(before),results}
 })
}finally{await browser.close()}
const pass=errors.length===0&&result.positionsUnchanged&&result.results.every(r=>r.respondsToSourceSun&&r.samples.every(s=>s.error===0))
await mkdir(path.dirname(out),{recursive:true});await writeFile(out,JSON.stringify({schema:'system-lighting-verification.v1',scope:'isolated shader regression; not application or device acceptance',pass,errors,result},null,2)+'\n')
console.log(JSON.stringify({pass,errors,device:result.device,materials:result.results.map(r=>({kind:r.kind,id:r.id,responds:r.respondsToSourceSun,means:r.samples.map(s=>s.mean)})),receipt:out},null,2))
if(!pass)process.exitCode=1
