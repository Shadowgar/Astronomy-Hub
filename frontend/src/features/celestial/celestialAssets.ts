import moonManifest from '../../../public/planetary-assets/v2.3/manifest.json'
import {solarOverviewAssets,type SolarOverviewAsset} from '../solar/solarVisualAssets'
import {SolarResourceOwner} from '../solar/solarAssets'
import * as T from 'three'

export const KM_PER_AU=149597870.7
export type CelestialAppearance=SolarOverviewAsset&{
 geometryKind?:'visualization-sphere'|'measured-shape-km'
 expectedOrientationFrame?:string
 expectedOrientationModelId?:string
 envelopeKm?:number
 orientation?:string
 disclosure?:string
}
const moons=moonManifest.assets as Record<string,any>
/** Appearance IDs do not change the scene's separate ephemeris target/center. */
export function celestialAppearance(id:string):CelestialAppearance|null{
 if(Object.hasOwn(solarOverviewAssets,id))return solarOverviewAssets[id]
 if(id==='moon')return{mapping:'equirectangular',source:'NASA/ASU LROC WAC; existing qualified native Moon source',mapUrl:'/planet-data/moon-wac.png',overview:{width:2880,height:1440,bytes:4256691,sha256:'218ddb0ed75af907dd0d8c6a1e5a41a6628a9654803a0b88fa352b17ca90c3d8'},detail:[{url:'/planet-data/moon-wac.png',width:2880,height:1440,bytes:4256691,sha256:'218ddb0ed75af907dd0d8c6a1e5a41a6628a9654803a0b88fa352b17ca90c3d8'}],orientation:'MOON_ME_DE440_ME421',disclosure:'Historical LROC WAC imagery; native Moon frame. No new terrain.'}
 if(!Object.hasOwn(moons,id))return null
 const m=moons[id]
 if(m.runtimeAllowed===false)return null
 return{mapping:m.mapping,source:m.source.url,modelUrl:m.modelUrl,overview:m.overview,detail:m.detail,geometryKind:m.kind==='measured-shape'?'measured-shape-km':'visualization-sphere',envelopeKm:m.geometry.maxBoundingRadiusKm,expectedOrientationFrame:m.geometry.expectedOrientationFrame,expectedOrientationModelId:m.geometry.expectedOrientationModelId,orientation:m.source.orientationClassification,disclosure:m.source.disclosure}
}
export function celestialDetailAsset(id:string,maxSize:number){
 const asset=celestialAppearance(id)
 if(!asset?.detail.length)return null
 const image=asset.detail.filter(image=>Math.max(image.width,image.height)<=maxSize).at(-1)??asset.detail[0]
 return{asset,image}
}
export async function loadCelestialDetail(id:string,maxSize:number,owner:SolarResourceOwner){
 const selected=celestialDetailAsset(id,maxSize)
 if(!selected)throw Error('No qualified body detail asset.')
 const {asset,image}=selected
 const map=await owner.texture(image.url,maxSize,true,{width:image.width,height:image.height,flipY:asset.mapping!=='source-uv'})
 map.wrapS=T.RepeatWrapping;map.wrapT=asset.mapping==='source-uv'?T.RepeatWrapping:T.ClampToEdgeWrapping
 map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter
 return{map,maxSize:Math.max(map.image.width,map.image.height),source:asset.source,mapping:asset.mapping as 'source-uv'|'equirectangular'}
}
