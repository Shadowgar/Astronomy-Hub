// Isolated GPU material verification, NOT an application/owner acceptance capture.
// Run against the local Vite server so that source modules are importable.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
const base=process.argv[2]||'http://127.0.0.1:4234'
const out=process.argv[3]||'output/playwright/solar2/materials.json'
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const errors=[]
let result
try{
 const page=await browser.newPage()
 page.on('pageerror',e=>errors.push(e.message))
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 // Only the empty verification document is supplied here. All graphics modules
 // are the actual worktree source; no application or scientific API is mocked.
 await page.route('**/__solar_material_verification__',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated material verification</title><body></body>'}))
 await page.goto(base+'/__solar_material_verification__')
 result=await page.evaluate(async()=>{
  const T=await import('/node_modules/.vite/deps/three.js')
  const M=await import('/src/features/solar/solarMaterials.ts')
  const R=await import('/src/features/solar/solarRings.ts')
  const A=await import('/src/features/solar/solarAtmosphere.ts')
  const P=await import('/src/features/solar/solarRenderPipeline.ts')
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,logarithmicDepthBuffer:true})
  renderer.setSize(256,192)
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info')
  const device={renderer:gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER),vendor:gl.getParameter(debug?debug.UNMASKED_VENDOR_WEBGL:gl.VENDOR)}
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(40,256/192,.01,200)
  camera.position.set(0,-4,6);camera.lookAt(0,0,0)
  const surface=M.planetMaterial('saturn'),body=new T.Mesh(new T.SphereGeometry(1,64,40),surface)
  body.rotation.x=Math.PI/2;scene.add(body)
  const ring=new T.Mesh(new T.RingGeometry(R.SATURN_RING_INNER_RATIO,R.SATURN_RING_OUTER_RATIO,256),R.ringMaterial())
  ring.rotation.x=.48;scene.add(ring)
  for(const material of [surface,ring.material])M.setSolarMaterialLight(material,[0,0,0],[1,-2,3])
  const pipeline=P.createSolarRenderPipeline(renderer,scene,camera);pipeline.resize(256,192,1)
  const sample=()=>{const pixels=new Uint8Array(256*192*4);gl.readPixels(0,0,256,192,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let nonblack=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]+pixels[i+1]+pixels[i+2]>3)nonblack++;return{error:gl.getError(),nonblack,center:[...pixels.slice((96*256+128)*4,(96*256+128)*4+3)]}}
  const frames=[]
  for(const quality of ['efficient','balanced','detailed']){pipeline.setQuality(quality);pipeline.render();frames.push({quality,...sample(),pipeline:pipeline.diagnostics()})}
  const sunward=sample()
  M.setSolarMaterialLight(surface,[0,0,0],[-1,2,-3]);M.setSolarMaterialLight(ring.material,[0,0,0],[-1,2,-3]);pipeline.render()
  const backlit=sample()
  // Reproduce the reported radial shimmer with the old linear-only sampler,
  // then measure the same subpixel motion with trilinear mip integration.
  body.visible=false;pipeline.setQuality('efficient');M.setSolarMaterialLight(ring.material,[0,0,0],[1,-2,3])
  const aliasMotion=(filter)=>{
   const profile=ring.material.uniforms.ringProfile.value;profile.minFilter=filter;profile.needsUpdate=true
   const captures=[]
   for(const offset of [0,.005]){
    camera.position.set(offset,-4,6);camera.lookAt(offset,0,0);pipeline.render()
    const data=new Uint8Array(256*192*4);gl.readPixels(0,0,256,192,gl.RGBA,gl.UNSIGNED_BYTE,data);captures.push(data)
   }
   let delta=0;for(let i=0;i<captures[0].length;i++)if(i%4!==3)delta+=Math.abs(captures[0][i]-captures[1][i])
   return delta/(256*192*3)
  }
  const ringSampling={linearMotionDelta:aliasMotion(T.LinearFilter),mipmappedMotionDelta:aliasMotion(T.LinearMipmapLinearFilter)}
  camera.position.set(0,-4,6);camera.lookAt(0,0,0);body.visible=true;pipeline.setQuality('balanced')
  scene.remove(ring);ring.geometry.dispose();ring.material.dispose()
  const compiled=[]
  for(const [name,material] of [['earth',M.earthMaterial()],['jupiter',M.planetMaterial('jupiter')],['sun',M.sunMaterial()],['clouds',M.cloudsMaterial()],...['earth','mars','venus','jupiter','saturn','uranus','neptune'].map(id=>['atmosphere:'+id,A.atmosphereForBody(id)])]){
   body.material=material;M.setSolarMaterialLight(material,[0,0,0],[1,-2,3]);pipeline.render();compiled.push({name,...sample()});material.dispose()
  }
  surface.dispose();body.geometry.dispose();scene.remove(body)
  // A uniform HDR surface should receive exactly the same output mapping in
  // direct and composer modes. Sample the center, away from FXAA edge handling.
  const control=new T.Mesh(new T.SphereGeometry(1,32,24),new T.MeshBasicMaterial({color:new T.Color().setRGB(4,2,.5)}));scene.add(control)
  pipeline.setEffects(false);pipeline.setQuality('efficient');pipeline.render();const direct=sample()
  pipeline.setQuality('balanced');pipeline.render();const hdr=sample()
  const difference=Math.max(...direct.center.map((n,i)=>Math.abs(n-hdr.center[i])))
  pipeline.dispose();control.geometry.dispose();control.material.dispose();renderer.dispose();renderer.forceContextLoss()
  return{device,frames,sunward,backlit,compiled,ringSampling,toneMapping:{direct,hdr,maxChannelDifference:difference}}
 })
}finally{await browser.close()}
const pass=errors.length===0&&result.frames.every(f=>f.error===0&&f.nonblack>1000)&&result.compiled.every(f=>f.error===0)&&result.toneMapping.maxChannelDifference<=2&&result.sunward.center.some((n,i)=>Math.abs(n-result.backlit.center[i])>5)&&result.ringSampling.mipmappedMotionDelta<result.ringSampling.linearMotionDelta*.75
await mkdir(path.dirname(out),{recursive:true});await writeFile(out,JSON.stringify({schema:'solar-material-verification.v1',scope:'isolated GLSL/HDR verification; not application or hardware qualification',pass,errors,result},null,2)+'\n')
console.log(JSON.stringify({pass,errors,device:result.device,toneMapping:result.toneMapping.maxChannelDifference,ringSampling:result.ringSampling,receipt:out},null,2))
if(!pass)process.exitCode=1
