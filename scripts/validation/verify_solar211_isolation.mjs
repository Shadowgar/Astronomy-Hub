import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
const out=process.argv[3],base=process.argv[2],epoch='2026-10-27T04:00:00.000Z'
await mkdir(out,{recursive:true})
const b=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const receipt={runs:[],errors:[]}
try{
const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'})
await ctx.addInitScript(()=>{
 window.__solarInspect={objects:[],flags:{},materials:new Set(),cameras:new Set()}
 window.__THREE_DEVTOOLS__=new EventTarget()
 window.__THREE_DEVTOOLS__.addEventListener('observe',e=>{
 const o=e.detail,s=window.__solarInspect;s.objects.push(o)
 if(!o.isWebGLRenderer)return
 const render=o.render.bind(o);s.renderer=o
 o.render=(scene,camera)=>{
 s.cameras.add(camera);const restore=[]
 scene.traverse?.(node=>{
 const m=node.material;if(!m)return;s.materials.add(m)
 if((s.flags.noClouds&&node.userData.clouds)||(s.flags.noCustom&&node.userData.atmosphere)){const v=node.visible;node.visible=false;restore.push(()=>node.visible=v)}
 if(m.uniforms?.hasCloudMap&&s.flags.noClouds){const v=m.uniforms.hasCloudMap.value;m.uniforms.hasCloudMap.value=false;restore.push(()=>m.uniforms.hasCloudMap.value=v)}
 if(m.uniforms?.customAtmosphere&&s.flags.noCustom){const v=m.uniforms.customAtmosphere.value;m.uniforms.customAtmosphere.value=false;restore.push(()=>m.uniforms.customAtmosphere.value=v)}
 if(m.uniforms?.customAtmosphere){if(!m.userData.originalFragment)m.userData.originalFragment=m.fragmentShader;const wanted=s.flags.scatterOnly?m.userData.originalFragment.replace('gl_FragColor=vec4(color,1.);','gl_FragColor=vec4(0.,0.,0.,1.);'):m.userData.originalFragment;if(m.fragmentShader!==wanted){m.fragmentShader=wanted;m.needsUpdate=true}}
 if(m.uniforms?.customAtmosphere&&s.flags.flat){const v=m.uniforms.hasMap.value;m.uniforms.hasMap.value=false;restore.push(()=>m.uniforms.hasMap.value=v)}
 if(m.uniforms?.map?.value&&s.flags.nearest){const t=m.uniforms.map.value,v=[t.minFilter,t.magFilter,t.generateMipmaps];t.minFilter=1003;t.magFilter=1003;t.generateMipmaps=false;t.needsUpdate=true;restore.push(()=>{[t.minFilter,t.magFilter,t.generateMipmaps]=v;t.needsUpdate=true})}
 });try{return render(scene,camera)}finally{restore.forEach(fn=>fn())}
 }
 })
})
const p=await ctx.newPage();p.on('pageerror',e=>receipt.errors.push(e.message))
const ready=()=>p.waitForFunction(()=>window.orasSolarDiagnostics?.().atmosphere.active&&!window.orasSolarDiagnostics().animating&&window.orasSolarDiagnostics().texturesReady>=9,null,{timeout:90000})
await p.goto(base+'/solar-system?solarBody=earth&date='+epoch);await ready()
receipt.initial=await p.evaluate(()=>window.orasSolarDiagnostics())
const d=receipt.initial,e=d.bodies.find(b=>b.id==='earth'),sun=d.bodies.find(b=>b.id==='sun'),l=sun.position.map((v,i)=>v-e.position[i]),norm=Math.hypot(...l),R=e.radiusAu
const view={schema:'oras.solar-return.v1',epoch,camera:e.position.map((v,i)=>v+l[i]/norm*R*3),target:e.position,cameraUp:d.earthOrientation.icrfToItrs.slice(6,9),cameraView:'custom',closeView:true,near:100/149597870700,preferences:{overview:'inner',quality:'balanced',sizeMode:'physical',orbits:false,effects:true,belt:false,beltDensity:2400,navigation:'orbit',asteroids:false,rate:86400}}
async function reset(near=view.near){await p.evaluate(v=>history.replaceState({...history.state,usr:{...history.state?.usr,r4SolarView:v}},''),{...view,near});await p.reload();await ready()}
async function capture(name,flags={}){await p.evaluate(flags=>window.__solarInspect.flags=flags,flags);await p.setViewportSize({width:1441,height:900});await p.setViewportSize({width:1440,height:900});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await p.screenshot({path:path.join(out,name+'.png')});receipt.runs.push({name,flags,diagnostics:await p.evaluate(()=>window.orasSolarDiagnostics())});console.log(name)}
await reset();await capture('takram-full');await capture('takram-no-clouds',{noClouds:true});await capture('takram-flat-no-clouds',{noClouds:true,flat:true});await capture('takram-nearest',{noClouds:true,nearest:true});
await capture('atmospheric-pass-only',{noClouds:true,scatterOnly:true});
const mats=await p.evaluate(()=>[...window.__solarInspect.materials].filter(m=>m.fragmentShader).map(m=>({name:m.name,type:m.type,defines:m.defines,fragmentShader:m.fragmentShader,uniforms:Object.fromEntries(Object.entries(m.uniforms).filter(([k,v])=>/cameraNear|cameraFar|logarithmic|sceneNear|sceneFar/.test(k)).map(([k,v])=>[k,v.value]))})))
await writeFile(path.join(out,'materials.json'),JSON.stringify(mats,null,2))
await reset(R*.01);await capture('takram-near-63710m');
await reset();await p.getByRole('button',{name:'Science, scale & sources',exact:true}).click();await p.getByLabel('Earth atmosphere method',{exact:true}).selectOption('custom');await p.getByRole('button',{name:'Close panel',exact:true}).click();await capture('custom-full');await capture('surface-only-hdr',{noClouds:true,noCustom:true});
 await p.getByRole('button',{name:'Science, scale & sources',exact:true}).click();await p.getByLabel('Rendering quality',{exact:true}).selectOption('efficient');await p.getByRole('button',{name:'Close panel',exact:true}).click();await capture('surface-only-direct',{noClouds:true,noCustom:true});
receipt.gpu=await p.evaluate(()=>{const gl=window.__solarInspect.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e.UNMASKED_RENDERER_WEBGL)})
await ctx.close()
}finally{await b.close();await writeFile(path.join(out,'isolation.json'),JSON.stringify(receipt,null,2))}
