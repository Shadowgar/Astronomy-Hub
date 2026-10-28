// Actual upstream GPU verification on controlled geometry. This does not
// substitute for the application's JPL/epoch/owner/physical-device qualification.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
const base=process.argv[2]||'http://127.0.0.1:4235'
const output=process.argv[3]||'docs/validation/solar-system-2.1/evidence/takram-gpu.json'
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/home/rocco/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const errors=[]
let result
try{
 const page=await browser.newPage({viewport:{width:512,height:384}})
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
 await page.route('**/__takram_proof__',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Actual Takram controlled GPU proof</title><style>body{margin:0}</style><body></body>'}))
 await page.goto(base+'/__takram_proof__')
 result=await page.evaluate(async()=>{
  const T=await import('/node_modules/.vite/deps/three.js')
  const A=await import('/src/features/solar/solarTakram.ts')
  const M=await import('/src/features/solar/solarMaterials.ts')
  const Old=await import('/src/features/solar/solarAtmosphere.ts')
  const {EffectComposer}=await import('/node_modules/three/examples/jsm/postprocessing/EffectComposer.js')
  const {RenderPass}=await import('/node_modules/three/examples/jsm/postprocessing/RenderPass.js')
  const {OutputPass}=await import('/node_modules/three/examples/jsm/postprocessing/OutputPass.js')
  const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true,logarithmicDepthBuffer:true})
  renderer.setSize(512,384);renderer.setClearColor('#04070c');renderer.toneMapping=T.ACESFilmicToneMapping;renderer.outputColorSpace=T.SRGBColorSpace
  document.body.append(renderer.domElement)
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),device=gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER)
  const au=149597870700,R=6371000/au
  const camera=new T.PerspectiveCamera(45,512/384,R*.01*au,200*au),scene=new T.Scene()
  scene.scale.setScalar(au)
  camera.lookAt(0,0,-1);camera.updateMatrixWorld()
  const surface=M.earthMaterial(),sphere=new T.Mesh(new T.SphereGeometry(R,96,64),surface)
  sphere.position.set(0,0,-3*R);scene.add(sphere)
  const custom=new T.Mesh(new T.SphereGeometry(R*Old.atmosphereShellRatio('earth'),64,48),Old.atmosphereForBody('earth'));custom.position.copy(sphere.position);scene.add(custom)
  const target=new T.WebGLRenderTarget(512,384,{type:T.HalfFloatType,depthBuffer:true,stencilBuffer:false})
  target.depthTexture=new T.DepthTexture(512,384,T.UnsignedIntType)
  const composer=new EffectComposer(renderer,target),renderPass=new RenderPass(scene,camera),output=new OutputPass()
  const statuses=[],adapter=A.createSolarTakram(renderer,camera,{onStatus:s=>statuses.push(s)})
  composer.addPass(renderPass);composer.addPass(adapter.pass);composer.addPass(output)
  const setup=(distance,sun)=>{
   camera.lookAt(distance<1.1?1:0,0,distance<1.1?-.2:-1);camera.updateMatrixWorld()
   sphere.position.z=-distance*R;custom.position.copy(sphere.position)
   M.setSolarMaterialLight(surface,[0,0,0],sun);M.setSolarMaterialLight(custom.material,[0,0,0],sun)
   adapter.updateFrame({cameraPositionAU:[1,0,distance*R],earthPositionAU:[1,0,0],sunPositionAU:[1+sun[0],sun[1],sun[2]],icrfToItrs:[1,0,0,0,1,0,0,0,1],kmPerAu:au/1000,earthRadiusM:6371000,physicalScale:1,frameAvailable:true,sceneUnitsPerAU:au})
  }
  const pixels=()=>{const data=new Uint8Array(512*384*4);gl.readPixels(0,0,512,384,gl.RGBA,gl.UNSIGNED_BYTE,data);return data}
  const stats=data=>{let sum=0,nonblack=0;for(let i=0;i<data.length;i+=4){sum+=data[i]+data[i+1]+data[i+2];if(data[i]+data[i+1]+data[i+2]>20)nonblack++}return{sum,nonblack,center:[...data.slice((192*512+256)*4,(192*512+256)*4+3)],corner:[...data.slice(0,3)]}}
  setup(3,[0,0,1]);adapter.setEnabled(false);composer.render();const before=pixels(),beforeStats=stats(before)
  custom.visible=false;adapter.setEnabled(true);await adapter.ready
  const views=[]
  for(const [name,distance,sun] of [['full',3,[0,0,1]],['terminator',3,[1,0,0]],['crescent',3,[1,0,-2]],['backlit',3,[0,0,-1]],['close',1.02,[1,0,.05]],['atmospheric',1.0001,[1,0,.05]],['far',30,[1,0,1]]]){
   setup(distance,sun);const start=performance.now();composer.render();const renderMilliseconds=performance.now()-start,data=pixels()
   let maximumInteriorStep=0
   if(name==='full')for(let x=112;x<400;x++)for(let c=0;c<3;c++)maximumInteriorStep=Math.max(maximumInteriorStep,Math.abs(data[(192*512+x)*4+c]-data[(192*512+x-1)*4+c]))
   views.push({name,distance,sun,...stats(data),renderMilliseconds,maximumInteriorStep,webglError:gl.getError(),diagnostics:adapter.diagnostics(),png:renderer.domElement.toDataURL()})
  }
  setup(3,[0,0,1]);composer.render();const after=pixels();let changed=0,delta=0
  for(let i=0;i<before.length;i+=4){let difference=0;for(let c=0;c<3;c++)difference+=Math.abs(before[i+c]-after[i+c]);if(difference>6)changed++;delta+=difference}
  const memoryActive={...renderer.info.memory}
  const foreground=new T.Mesh(new T.SphereGeometry(R*.08,32,24),new T.MeshBasicMaterial({color:new T.Color().setRGB(4,2,.5)}));foreground.position.z=-R;scene.add(foreground)
  adapter.setEnabled(false);composer.render();const controlBefore=stats(pixels()).center
  adapter.setEnabled(true);composer.render();const controlAfter=stats(pixels()).center
  const foregroundToneMapping={before:controlBefore,after:controlAfter,maximumDifference:Math.max(...controlBefore.map((value,i)=>Math.abs(value-controlAfter[i])))}
  scene.remove(foreground);foreground.geometry.dispose();foreground.material.dispose()
  // A source behind the whole atmosphere must match the same radiance on the
  // sky background. Projecting that distant source onto Earth's ground breaks
  // this equivalence even when its physical ray misses the surface.
  const hdrBackground=new T.Mesh(new T.SphereGeometry(100,32,16),new T.MeshBasicMaterial({color:new T.Color().setRGB(4,2,.5),side:T.BackSide,depthWrite:false}));hdrBackground.renderOrder=-3;scene.add(hdrBackground)
  setup(3,[1,0,0]);composer.render()
  const backgroundRadiance=pixels(),correctedEye=3*6371000-11000
  let chosen=null
  for(let x=256;x<512;x++){
   const ray=new T.Vector3((x+.5)/512*2-1,(192+.5)/384*2-1,1).unproject(camera).normalize()
   const impact=correctedEye*Math.hypot(ray.x,ray.y),error=Math.abs(impact-6390000)
   if(!chosen||error<chosen.error)chosen={x,ray,impact,error}
  }
  const behind=new T.Mesh(new T.SphereGeometry(1e9/au,32,24),new T.MeshBasicMaterial({color:new T.Color().setRGB(4,2,.5)}))
  behind.position.copy(chosen.ray).multiplyScalar(130e9/au);scene.add(behind);composer.render();const behindRadiance=pixels(),pixel=(192*512+chosen.x)*4
  const limbBackground=[...backgroundRadiance.slice(pixel,pixel+3)],limbOpaque=[...behindRadiance.slice(pixel,pixel+3)]
  const backgroundOpaqueEquivalence={impactParameterM:chosen.impact,pixel:[chosen.x,192],background:limbBackground,opaque:limbOpaque,maximumDifference:Math.max(...limbBackground.map((value,i)=>Math.abs(value-limbOpaque[i])))}
  scene.remove(behind,hdrBackground);behind.geometry.dispose();behind.material.dispose();hdrBackground.geometry.dispose();hdrBackground.material.dispose()
  composer.setSize(390,844);composer.render();const portrait=adapter.diagnostics()
  composer.setSize(844,390);composer.render();const landscape=adapter.diagnostics()
  adapter.setQuality('efficient');composer.render();const efficient=adapter.diagnostics()
  adapter.setQuality('balanced');composer.render()
  const programs=renderer.info.programs.map(program=>({name:program.name,runnable:program.diagnostics?.runnable??true}))
  const lost=new Promise(resolve=>renderer.domElement.addEventListener('webglcontextlost',resolve,{once:true}));renderer.forceContextLoss();await lost
  const contextLoss=adapter.diagnostics();adapter.dispose();composer.dispose();renderPass.dispose();output.dispose();surface.dispose();sphere.geometry.dispose();custom.material.dispose();custom.geometry.dispose();renderer.dispose()
  return{device,beforeStats,views,changedPixels:changed,totalChannelDelta:delta,foregroundToneMapping,backgroundOpaqueEquivalence,memoryActive,memoryDisposed:{...renderer.info.memory},portrait,landscape,efficient,contextLoss,disposed:adapter.diagnostics(),statuses,programs}
 })
}finally{await browser.close()}
await mkdir(path.dirname(output),{recursive:true})
for(const view of result.views){const filename=`takram-${view.name}.png`;await writeFile(path.join(path.dirname(output),filename),Buffer.from(view.png.split(',')[1],'base64'));delete view.png;view.capture=filename}
const pass=errors.length===0&&result.views.every(v=>v.webglError===0&&v.diagnostics.active)&&result.views[0].maximumInteriorStep<10&&result.foregroundToneMapping.maximumDifference<=2&&result.backgroundOpaqueEquivalence.maximumDifference<=3&&result.changedPixels>100&&result.contextLoss.reason==='webgl-context-lost'&&result.disposed.lookupBytes===0&&result.memoryDisposed.geometries===0&&result.efficient.reason==='efficient-quality'&&result.programs.every(p=>p.runnable)
await writeFile(output,JSON.stringify({schema:'solar21-takram-gpu.v1',scope:'controlled real Takram/Three GPU proof; not application, hardware or owner acceptance',pass,errors,result},null,2)+'\n')
console.log(JSON.stringify({pass,errors,device:result.device,changedPixels:result.changedPixels,views:result.views.map(v=>({name:v.name,active:v.diagnostics.active,reason:v.diagnostics.reason})),output},null,2))
if(!pass)process.exitCode=1
