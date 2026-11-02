import * as T from 'three'
import {SolarResourceOwner} from '../solar/solarAssets'
import {sunMaterial,earthMaterial,planetMaterial,cloudsMaterial,ringMaterial,setSolarMaterialLight} from '../solar/solarMaterials'
import {atmosphereForBody,atmosphereShellRatio} from '../solar/solarAtmosphere'
import {SATURN_RING_INNER_RATIO,SATURN_RING_OUTER_RATIO} from '../solar/solarRings'
import {solarRingAsset} from '../solar/solarVisualAssets'
import {celestialAppearance,KM_PER_AU,type CelestialAppearance} from './celestialAssets'

const cloudUrl=new URL('../solar/assets/earth-clouds-2002.jpg',import.meta.url).href
export type CelestialSourceIdentity=Readonly<{target:string;origin:string;frame:string;source?:string}>
type Options={id:string;appearanceId?:string;radiusAU:number;sourceIdentity:CelestialSourceIdentity;assets:SolarResourceOwner;keep:<R extends {dispose:()=>void}>(r:R)=>R;request:()=>void;onError?:(name:string)=>void;onOverview?:(map:any)=>void;onCloud?:(map:any)=>void}
export type CelestialBody={id:string;mesh:any;extras:any[];sourceIdentity:CelestialSourceIdentity;appearance:CelestialAppearance|null;overviewReady:boolean;cloudsReady:boolean;envelopeAU:number;setDetailMap:(map:any|null)=>void;diagnostics:()=>unknown}

/** Copy source geometry; a measured COM-centred shape is never recentered or
 * projected onto a mean sphere. The conservative envelope is about the COM. */
export function adoptCelestialGeometry(node:any,radiusAU:number,mode:'visualization-sphere'|'measured-shape-km',kmPerAU=KM_PER_AU){
 if(!node?.geometry?.attributes.position||!Number.isFinite(radiusAU)||radiusAU<=0||!Number.isFinite(kmPerAU)||kmPerAU<=0)throw Error('Invalid celestial geometry')
 const geometry=node.geometry.clone();try{geometry.applyMatrix4(node.matrixWorld)
 if(mode==='measured-shape-km')geometry.scale(1/kmPerAU,1/kmPerAU,1/kmPerAU)
 else{
  if(!geometry.attributes.uv)throw Error('Source texture geometry lacks UV registration')
  geometry.computeBoundingSphere();const sphere=geometry.boundingSphere
  if(!sphere||!Number.isFinite(sphere.radius)||sphere.radius<=0)throw Error('Invalid source model bounds')
  geometry.translate(-sphere.center.x,-sphere.center.y,-sphere.center.z)
  const positions=geometry.attributes.position
  for(let i=0;i<positions.count;i++){const v=new T.Vector3().fromBufferAttribute(positions,i);if(!Number.isFinite(v.lengthSq())||v.lengthSq()===0)throw Error('Invalid source model vertex');v.normalize().multiplyScalar(radiusAU);positions.setXYZ(i,v.x,v.y,v.z)}
  positions.needsUpdate=true
 }
 geometry.computeVertexNormals();geometry.computeBoundingSphere()
 const positions=geometry.attributes.position;let envelope=0
 for(let i=0;i<positions.count;i++)envelope=Math.max(envelope,new T.Vector3().fromBufferAttribute(positions,i).length())
 geometry.userData.physicalEnvelopeAU=envelope
 return geometry
 }catch(error){geometry.dispose();throw error}
}

/** Shared Solar/system appearance. Scene owns lifecycle/clock/camera; the passed
 * owner owns loaded assets and the streamer owns detail maps borrowed here. */
export function createCelestialBody(options:Options):CelestialBody{
 const {id,radiusAU:radius,assets,keep,request}=options,appearanceId=options.appearanceId??id,appearance=celestialAppearance(appearanceId)
 const material=keep(appearanceId==='sun'?sunMaterial():appearanceId==='earth'?earthMaterial():planetMaterial(appearanceId))
 // A source-less moon has a neutral reference body, never invented terrain.
 if(!['sun','earth','mercury','venus','mars','jupiter','saturn','uranus','neptune'].includes(appearanceId)&&material.uniforms.dark){material.uniforms.dark.value.setRGB(.28,.28,.28);material.uniforms.light.value.setRGB(.28,.28,.28)}
 if(appearanceId==='titan'){material.uniforms.particulate.value=.08;material.uniforms.limbExponent.value=.12;material.userData.calibration='illustrative haze disk response; NASA visible-haze visualization, not infrared surface'}
 const mesh=new T.Mesh(keep(new T.SphereGeometry(radius,appearanceId==='earth'?256:64,appearanceId==='earth'?128:40)),material)
 mesh.rotation.x=Math.PI/2+(appearanceId==='saturn'?.48:0);mesh.rotation.y=appearanceId==='earth'?-.7:.35
 const extras:any[]=[],timing={requested:performance.now(),overviewReady:null as number|null,detailApplied:null as number|null},errors:string[]=[]
 let baseMap:any=null,detailMap:any=null
 const body:CelestialBody={id,mesh,extras,appearance,sourceIdentity:Object.freeze({...options.sourceIdentity}),overviewReady:false,cloudsReady:false,envelopeAU:Math.max(radius,(appearance?.envelopeKm??0)/KM_PER_AU),setDetailMap(map){if(assets.signal.aborted)return;detailMap=map;install();timing.detailApplied=performance.now()},diagnostics(){const map=material.uniforms.map?.value;return{sourceIdentity:body.sourceIdentity,appearanceSource:appearance?.source??null,geometryKind:appearance?.geometryKind??'visualization-sphere',overviewReady:body.overviewReady,cloudsReady:body.cloudsReady,envelopeAU:body.envelopeAU,textureSize:map?.image?[map.image.width,map.image.height]:null,orientation:appearance?.orientation??'illustrative-source-registration',errors:[...errors],timing:{...timing}}}}
 function install(){if(appearance?.mapping==='source-uv'&&!body.overviewReady)return;if(material.uniforms.map){material.uniforms.map.value=detailMap??baseMap;material.uniforms.hasMap.value=!!(detailMap??baseMap)}}
 function ready(map:any){if(assets.signal.aborted)return;baseMap=map;body.overviewReady=true;timing.overviewReady=performance.now();install();options.onOverview?.(map);request()}
 function failed(name:string){if(assets.signal.aborted)return;errors.push(name);options.onError?.(name);request()}
 if(appearance?.modelUrl){
  void assets.model(appearance.modelUrl,1024).then(gltf=>{
   if(assets.signal.aborted)return
   gltf.scene.updateMatrixWorld(true);const nodes:any[]=[];gltf.scene.traverse((n:any)=>{if(n.isMesh)nodes.push(n)})
   // Pinned NASA Saturn GLB includes its original globe and two ring planes.
   // The shared source-qualified radial ring renderer owns the visible rings.
   const admitted=appearanceId==='saturn'?nodes.filter(n=>n.name==='Saturn001'||n.name==='Saturn.001'):nodes
   if(admitted.length!==1)throw Error('Source must contain exactly one admitted body primitive')
   const node=admitted[0],mode=appearance.geometryKind??'visualization-sphere'
   if(mode!=='measured-shape-km'&&!node.material.map)throw Error('Source body map unavailable')
   const geometry=keep(adoptCelestialGeometry(node,radius,mode));mesh.geometry=geometry
   body.envelopeAU=Math.max(body.envelopeAU,geometry.userData.physicalEnvelopeAU)
   mesh.userData.visualSource=appearance.source;ready(node.material.map??null)
  }).catch(()=>failed(`${id} source model`))
 }else if(appearance?.mapUrl){
  void assets.texture(appearance.mapUrl,1024,true,appearance.overview).then(map=>{if(assets.signal.aborted)return;map.wrapS=T.RepeatWrapping;mesh.userData.visualSource=appearance.source;ready(map)}).catch(()=>failed(`${id} overview imagery`))
 }
 if(appearanceId==='earth'){
  const clouds=new T.Mesh(keep(new T.SphereGeometry(radius*1.008,256,128)),keep(cloudsMaterial()));clouds.rotation.copy(mesh.rotation);clouds.userData.clouds=true;extras.push(clouds)
  void assets.texture(cloudUrl,2048,false).then(map=>{if(assets.signal.aborted)return;clouds.material.uniforms.map.value=map;material.uniforms.cloudMap.value=map;body.cloudsReady=true;options.onCloud?.(map);request()}).catch(()=>failed('Earth cloud imagery'))
 }
 if(appearanceId==='saturn'){
  const rings=new T.Mesh(keep(new T.RingGeometry(SATURN_RING_INNER_RATIO,SATURN_RING_OUTER_RATIO,256)),keep(ringMaterial()));rings.scale.setScalar(radius);rings.rotation.x=.48;rings.userData.baseScale=radius;rings.userData.rings=true;extras.push(rings)
  void assets.texture(solarRingAsset.url,4096).then(map=>{if(assets.signal.aborted)return;rings.material.uniforms.radialMap.value=map;rings.material.uniforms.hasRadialMap.value=true;rings.material.uniforms.mapInner.value=solarRingAsset.innerEquatorialRadiusRatio*60268/58232;rings.material.uniforms.mapOuter.value=solarRingAsset.outerEquatorialRadiusRatio*60268/58232;request()}).catch(()=>failed('Saturn radial ring imagery'))
 }
 const shell=atmosphereShellRatio(appearanceId)
 if(shell){const atmosphere=new T.Mesh(keep(new T.SphereGeometry(radius*shell,48,32)),keep(atmosphereForBody(appearanceId)!));atmosphere.userData.atmosphere=true;extras.push(atmosphere)}
 return body
}

export function setCelestialRingFrame(body:CelestialBody,bodyFixedToIcrf:{x:number;y:number;z:number;w:number}){
 for(const ring of body.extras.filter(m=>m.userData.rings))ring.quaternion.copy(bodyFixedToIcrf)
 body.mesh.material.uniforms.ringNormal?.value.set(0,0,1).applyQuaternion(bodyFixedToIcrf).normalize()
}
export function setCelestialLight(body:CelestialBody,position:readonly number[],sun:readonly number[]){
 for(const mesh of [body.mesh,...body.extras])setSolarMaterialLight(mesh.material,position,sun)
}
