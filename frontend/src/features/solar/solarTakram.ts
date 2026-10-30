import * as T from 'three'
import {Pass,FullScreenQuad} from 'three/addons/postprocessing/Pass.js'
import {EffectPass} from 'postprocessing'
import {SolarAerialPerspectiveEffect} from './solarTakramDepth'
import {Ellipsoid} from '@takram/three-geospatial'
import {common,definitions,runtime} from '@takram/three-atmosphere/shaders/bruneton'
import type {SolarQuality} from './solarPresentation'

// Exact published 0.19.1 assets, MIT. No provider request or run-time precompute.
export const TAKRAM_LUTS=[
 {name:'transmittance',bytes:131072,dimensions:[256,64],sha256:'a2a0dd1464048d92e7bfdf385a9108e8d9c3e2748684f1f64523587d5894180a'},
 {name:'scattering',bytes:8388608,dimensions:[256,128,32],sha256:'82c505fe6e3b7f1995c650cc8a1478f42bd510029bf63845e9485c078aef6617'},
 {name:'irradiance',bytes:8192,dimensions:[64,16],sha256:'126bd4ff0419e04c877639caf9e3cd64a139ae511cf315a23a0c989fc47b51a5'}
] as const
export const TAKRAM_VERSION='0.19.1'
type V=readonly number[]
export interface SolarTakramFrame {
 cameraPositionAU:V;earthPositionAU:V;sunPositionAU:V
 /** Row-major orthonormal ICRF to ITRS rotation for this scientific epoch. */
 icrfToItrs:V;kmPerAu:number;earthRadiusM:number;physicalScale:number;frameAvailable:boolean
 /** Physical camera-relative scene units per AU during this pass. */
 sceneUnitsPerAU?:number
}
const rotate=(r:V,v:V)=>[r[0]*v[0]+r[1]*v[1]+r[2]*v[2],r[3]*v[0]+r[4]*v[1]+r[5]*v[2],r[6]*v[0]+r[7]*v[1]+r[8]*v[2]]
const validVector=(v:V)=>v.length===3&&v.every(Number.isFinite)
function validRotation(r:V){
 if(r.length!==9||!r.every(Number.isFinite))return false
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(Math.abs(r[i*3]*r[j*3]+r[i*3+1]*r[j*3+1]+r[i*3+2]*r[j*3+2]-(i===j?1:0))>1e-5)return false
 return Math.abs(r[0]*(r[4]*r[8]-r[5]*r[7])-r[1]*(r[3]*r[8]-r[5]*r[6])+r[2]*(r[3]*r[7]-r[4]*r[6])-1)<1e-5
}
/** Floating-origin subtraction occurs in JS doubles, before any GPU uniform. */
export function solarTakramFrame(f:SolarTakramFrame){
 let reason:string|null=null
 if(!f.frameAvailable)reason='earth-frame-unavailable'
 else if(!validRotation(f.icrfToItrs)||![f.cameraPositionAU,f.earthPositionAU,f.sunPositionAU].every(validVector)||!Number.isFinite(f.kmPerAu)||f.kmPerAu<=0||!Number.isFinite(f.earthRadiusM)||f.earthRadiusM<6300000||f.earthRadiusM>6400000)reason='invalid-earth-frame'
 else if(Math.abs(f.physicalScale-1)>1e-6||!Number.isFinite(f.physicalScale))reason='cinematic-scale'
 else if(f.sceneUnitsPerAU!==undefined&&(!Number.isFinite(f.sceneUnitsPerAU)||f.sceneUnitsPerAU<=0))reason='invalid-scene-units'
 const cameraECEFM=reason?[0,0,0]:rotate(f.icrfToItrs,f.cameraPositionAU.map((n,i)=>(n-f.earthPositionAU[i])*f.kmPerAu*1000))
 const sun=reason?[0,0,0]:rotate(f.icrfToItrs,f.sunPositionAU.map((n,i)=>n-f.earthPositionAU[i]))
 const sunLength=Math.hypot(...sun),altitudeM=Math.hypot(...cameraECEFM)-f.earthRadiusM
 if(!reason&&sunLength===0)reason='invalid-sun-direction'
 // The shader remains Earth-local; no subpixel Solar-overview or underground claim.
 if(!reason&&(altitudeM<1||altitudeM>1e9))reason='outside-qualified-altitude'
 return{reason,cameraECEFM,sunDirectionECEF:sun.map(n=>sunLength?n/sunLength:0),altitudeM}
}

/** Fetch, byte-bound and hash-check all tables before allocating GPU textures.
 * Reading the stream is bounded even when a server omits Content-Length. */
export async function loadSolarTakramTextures(signal:AbortSignal,fetcher:typeof fetch=fetch){
 const buffers=await Promise.all(TAKRAM_LUTS.map(async entry=>{
  const response=await fetcher(`/assets/solar/takram-0.19.1/${entry.name}.bin`,{signal,credentials:'same-origin'})
  if(!response.ok||!response.body)throw Error(`Takram LUT response ${response.status}`)
  const advertised=response.headers.get('content-length')
  if(advertised!==null&&Number(advertised)!==entry.bytes)throw Error('Takram LUT length mismatch')
  const reader=response.body.getReader(),data=new Uint8Array(entry.bytes)
  let offset=0
  try{for(;;){const{done,value}=await reader.read();if(done)break;if(signal.aborted)throw new DOMException('Aborted','AbortError');if(offset+value.length>data.length)throw Error('Takram LUT length overflow');data.set(value,offset);offset+=value.length}}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
  if(offset!==entry.bytes)throw Error('Takram LUT length mismatch')
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(n=>n.toString(16).padStart(2,'0')).join('')
  if(digest!==entry.sha256)throw Error('Takram LUT hash mismatch')
  if(signal.aborted)throw new DOMException('Aborted','AbortError')
  return data
 }))
 const textures:Record<string,any>={}
 for(let i=0;i<TAKRAM_LUTS.length;i++){
  const entry=TAKRAM_LUTS[i],d=entry.dimensions,bytes=new Uint16Array(buffers[i].buffer)
  const texture=d.length===3?new T.Data3DTexture(bytes,d[0],d[1],d[2]):new T.DataTexture(bytes,d[0],d[1])
  texture.type=T.HalfFloatType;texture.format=T.RGBAFormat;texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter
  texture.wrapS=T.ClampToEdgeWrapping;texture.wrapT=T.ClampToEdgeWrapping;texture.generateMipmaps=false;texture.unpackAlignment=1;texture.needsUpdate=true
  textures[`${entry.name}Texture`]=texture
 }
 return textures
}

export type SolarTakramStatus={state:'loading'|'ready'|'active'|'fallback'|'disposed';reason:string|null;version:string}
type Options={onStatus?:(status:SolarTakramStatus)=>void;requestFrame?:()=>void}

// This is composition glue, not a replacement atmospheric model. The complete
// scattering/transmittance functions below are the package's exported Bruneton
// shaders. AerialPerspectiveEffect provides actual depth-aware surface radiance.
const compositionFragment=`
precision highp sampler3D;
#define TRANSMITTANCE_TEXTURE_WIDTH 256
#define TRANSMITTANCE_TEXTURE_HEIGHT 64
#define SCATTERING_TEXTURE_R_SIZE 32
#define SCATTERING_TEXTURE_MU_SIZE 128
#define SCATTERING_TEXTURE_MU_S_SIZE 32
#define SCATTERING_TEXTURE_NU_SIZE 8
#define IRRADIANCE_TEXTURE_WIDTH 64
#define IRRADIANCE_TEXTURE_HEIGHT 16
#define COMBINED_SCATTERING_TEXTURES 1
${definitions}
uniform AtmosphereParameters ATMOSPHERE;
uniform vec3 SUN_SPECTRAL_RADIANCE_TO_LUMINANCE;
uniform vec3 SKY_SPECTRAL_RADIANCE_TO_LUMINANCE;
uniform sampler2D transmittance_texture;
uniform sampler3D scattering_texture;
uniform sampler2D irradiance_texture;
uniform sampler3D single_mie_scattering_texture;
${common}
${runtime}
varying vec2 vUv;
uniform sampler2D originalBuffer;
uniform sampler2D atmosphericBuffer;
uniform sampler2D sceneDepth;
uniform mat4 inverseProjectionMatrix;
uniform mat4 inverseViewMatrix;
uniform mat4 worldToECEFMatrix;
uniform vec3 localCameraKm;
uniform vec3 sunDirection;
uniform float sceneFar;
uniform float metrePerSceneUnit;
uniform bool logarithmicDepth;
uniform float sceneNear;
void main(){
 vec4 original=texture2D(originalBuffer,vUv);
 vec4 view=inverseProjectionMatrix*vec4(vUv*2.0-1.0,1.0,1.0);
 vec3 rayWorld=(inverseViewMatrix*vec4(view.xyz,0.0)).xyz;
 vec3 ray=normalize((worldToECEFMatrix*vec4(rayWorld,0.0)).xyz);
 float b=dot(localCameraKm,ray);
 float c=dot(localCameraKm,localCameraKm)-ATMOSPHERE.top_radius*ATMOSPHERE.top_radius;
 float disc=b*b-c;
 if(disc<0.0||-b+sqrt(max(disc,0.0))<=0.0){gl_FragColor=original;return;}
 float entry=max(0.0,-b-sqrt(disc));
 float boundaryExit=-b+sqrt(disc);
 float depth=texture2D(sceneDepth,vUv).r;
 if(depth<1.0-1e-8){
  float viewDistance=logarithmicDepth?exp2(depth*log2(sceneFar+1.0))-1.0:sceneNear*sceneFar/(sceneFar-depth*(sceneFar-sceneNear));
  float rayDistance=viewDistance*length(view.xyz)/abs(view.z)*metrePerSceneUnit*0.001;
  if(rayDistance<entry){gl_FragColor=original;return;}
  if(rayDistance<boundaryExit){gl_FragColor=texture2D(atmosphericBuffer,vUv);return;}
 }
 // A distant opaque Sun/planet behind the entire atmosphere has the same
 // optical path as sky radiance. Using the actual upstream sky function also
 // avoids its finite-point helper's near-horizon mu clamp outside the domain.
 vec3 transmittance;
 vec3 scatter=GetSkyRadiance(localCameraKm,ray,0.0,sunDirection,transmittance);
 gl_FragColor=vec4(original.rgb*transmittance+scatter,original.a);
}`

/** One externally scheduled Three composer pass; owns no RAF, camera or clock.
 * Place immediately after RenderPass with its depth texture, before bloom/output.
 * The caller owns and disposes this adapter, including across composer rebuilds. */
export function createSolarTakram(renderer:any,camera:any,options:Options={}){
 let disposed=false,enabled=true,quality:SolarQuality='balanced',frame:ReturnType<typeof solarTakramFrame>|null=null
 let inputFrame:SolarTakramFrame|null=null,status:SolarTakramStatus={state:'loading',reason:null,version:TAKRAM_VERSION}
 let textures:Record<string,any>|null=null,effect:any=null,effectPass:any=null,material:any=null,quad:any=null,target:any=null,copyMaterial:any=null
 let width=1,height=1,renders=0,loadMilliseconds=0,failure:string|null=null
 const abort=new AbortController(),start=performance.now()
 const notify=(state:SolarTakramStatus['state'],reason:string|null)=>{
  if(status.state===state&&status.reason===reason)return
  status={state,reason,version:TAKRAM_VERSION};options.onStatus?.(status)
 }
 const policy=()=>disposed?'disposed':failure||(!enabled?'comparison-selected':quality==='efficient'?'efficient-quality':frame?.reason||(!frame?'earth-frame-unavailable':null))
 const refresh=()=>{
  const reason=policy();pass.enabled=!reason&&!!effectPass
  notify(disposed?'disposed':reason?'fallback':effectPass?'active':'loading',reason)
 }
 const release=()=>{
  effectPass?.screen?.geometry.dispose();effectPass?.dispose();effectPass=null;effect=null
  material?.dispose();material=null;copyMaterial?.dispose();copyMaterial=null;quad?.dispose();quad=null;target?.dispose();target=null
  if(textures)for(const texture of Object.values(textures))texture.dispose()
  textures=null
 }
 const copyFrame=()=>{
  if(!effect||!frame||!inputFrame||frame.reason)return
  const r=inputFrame.icrfToItrs,s=inputFrame.kmPerAu*1000/(inputFrame.sceneUnitsPerAU||1),p=frame.cameraECEFM
  effect.worldToECEFMatrix.set(r[0]*s,r[1]*s,r[2]*s,p[0],r[3]*s,r[4]*s,r[5]*s,p[1],r[6]*s,r[7]*s,r[8]*s,p[2],0,0,0,1)
  effect.sunDirection.fromArray(frame.sunDirectionECEF)
  material.uniforms.metrePerSceneUnit.value=s
 }
 class AtmospherePass extends Pass{
  constructor(){super();this.enabled=false;this.needsSwap=true}
  setSize(w:number,h:number){width=Math.max(1,w);height=Math.max(1,h);target?.setSize(width,height);effectPass?.setSize(width,height)}
  render(r:any,write:any,read:any,delta:number){
   if(disposed||!effectPass)return
   try{
    if(!read.depthTexture)throw Error('missing-scene-depth')
    effectPass.mainCamera=camera
    effectPass.setDepthTexture(read.depthTexture,T.BasicDepthPacking)
    effectPass.render(r,read,target,delta,false)
    const u=material.uniforms
    u.originalBuffer.value=read.texture;u.atmosphericBuffer.value=target.texture;u.sceneDepth.value=read.depthTexture
    u.localCameraKm.value.copy(effect.uniforms.get('cameraPosition').value).applyMatrix4(effect.worldToECEFMatrix).add(effect.uniforms.get('altitudeCorrection').value).multiplyScalar(.001)
    u.sceneNear.value=camera.near;u.sceneFar.value=camera.far
    r.setRenderTarget(this.renderToScreen?null:write);quad.render(r);renders++
    if(r.info.programs?.some((p:any)=>p.diagnostics?.runnable===false))throw Error('shader-compilation-failed')
   }catch(error){
    // Preserve the current linear scene if this frame cannot be scattered.
    if(quad&&copyMaterial&&!r.getContext().isContextLost()){
     copyMaterial.uniforms.inputBuffer.value=read.texture;quad.material=copyMaterial
     r.setRenderTarget(this.renderToScreen?null:write);quad.render(r);quad.material=material
    }
    failure=error instanceof Error?error.message:'atmosphere-render-failed';refresh();options.requestFrame?.()
   }
  }
  // Composer lifecycle belongs to root. Disposal here is intentionally explicit.
  dispose(){}
 }
 const pass=new AtmospherePass()
 const contextLost=()=>{failure='webgl-context-lost';abort.abort();release();refresh()}
 renderer.domElement.addEventListener('webglcontextlost',contextLost)
 if(!renderer.capabilities.isWebGL2||!renderer.extensions.has('EXT_color_buffer_float'))failure='unsupported-gpu'
 const timeout=setTimeout(()=>abort.abort(),30000)
 const ready=(failure?Promise.reject(Error(failure)):loadSolarTakramTextures(abort.signal)).then(loaded=>{
  if(disposed||abort.signal.aborted){for(const texture of Object.values(loaded))texture.dispose();return}
  textures=loaded
  // Earth is a qualified mean-radius sphere. Upstream altitude correction
  // aligns its standard 6360km Bruneton LUT reference near the camera. Keep
  // geometric correction OFF: this shared depth buffer also contains space
  // objects, which must never be projected onto the ground sphere.
  const radius=inputFrame?.earthRadiusM||6371000
  effect=new SolarAerialPerspectiveEffect(camera,{...loaded,ellipsoid:new Ellipsoid(radius,radius,radius),correctAltitude:true,correctGeometricError:false,sky:false,sun:false,moon:false,sunLight:false,skyLight:false,transmittance:true,inscatter:true})
  effectPass=new EffectPass(camera,effect);effectPass.renderToScreen=false
  // Upstream uses shared fullscreen geometry. Give this adapter an owned copy
  // so repeated route lifetimes release every uploaded geometry it introduced.
  effectPass.screen.geometry=effectPass.screen.geometry.clone()
  effectPass.initialize(renderer,false,T.HalfFloatType);effectPass.setSize(width,height)
  target=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:false,stencilBuffer:false})
  const uniforms=Object.fromEntries(effect.uniforms)
  material=new T.ShaderMaterial({name:'SolarTakramLibraryComposition',toneMapped:false,depthTest:false,depthWrite:false,uniforms:{...uniforms,originalBuffer:{value:null},atmosphericBuffer:{value:null},sceneDepth:{value:null},localCameraKm:{value:new T.Vector3()},sceneFar:{value:camera.far},sceneNear:{value:camera.near},metrePerSceneUnit:{value:1},logarithmicDepth:{value:!!renderer.capabilities.logarithmicDepthBuffer}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:compositionFragment})
  quad=new FullScreenQuad(material);copyFrame();loadMilliseconds=performance.now()-start;refresh();options.requestFrame?.()
  copyMaterial=new T.ShaderMaterial({toneMapped:false,depthTest:false,depthWrite:false,uniforms:{inputBuffer:{value:null}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:'varying vec2 vUv; uniform sampler2D inputBuffer; void main(){gl_FragColor=texture2D(inputBuffer,vUv);}'})
 }).catch(error=>{if(!disposed){failure=abort.signal.aborted?(failure||'lookup-table-timeout'):error instanceof Error?error.message:'initialization-failed';abort.abort();release();refresh();options.requestFrame?.()}}).finally(()=>clearTimeout(timeout))
 refresh()
 return{
  pass,ready,
  updateFrame(value:SolarTakramFrame){if(disposed)return;inputFrame=value;frame=solarTakramFrame(value);copyFrame();refresh()},
  setEnabled(value:boolean){enabled=value;refresh()},setQuality(value:SolarQuality){quality=value;refresh()},
  diagnostics(){return{...status,active:pass.enabled,renders,loadMilliseconds,altitudeM:frame?.altitudeM,lookupBytes:textures?8527872:0,targetBytes:target?width*height*8:0,width,height,atmosphereModel:'Takram Bruneton Earth',toneMappingStages:0,independentAnimationLoops:0,disposed}},
  dispose(){if(disposed)return;disposed=true;abort.abort();clearTimeout(timeout);renderer.domElement.removeEventListener('webglcontextlost',contextLost);release();refresh()}
 }
}
