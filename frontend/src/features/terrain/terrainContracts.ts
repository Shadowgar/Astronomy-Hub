export type Vec3=[number,number,number]
export type TerrainQuality='balanced'|'efficient'
export const MOON_RADIUS_M=1737400
export const TERRAIN_REGION='apollo17-nac-v1'
export type TerrainManifest={schema:'oras.planet-terrain.v1';regionId:string;name:string;body:'moon';radiusM:number;frame:string;heightDatum:string;latitudeDeg:number;longitudeDeg:number;centerBodyFixedM:Vec3;extentM:[number,number];heightRangeM:[number,number];tilesetUrl:string;elevationResolutionM:number;imageryResolutionM:number;tiles:{count:number;levels:number;maxContentBytes:number;totalBytes:number};sources:{id:string;url:string;sha256:string;kind:string;license:string}[];limitations:string[]}
export type LunarFrame={origin:Vec3;east:Vec3;north:Vec3;up:Vec3}
const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)
const vector=(v:unknown):v is Vec3=>Array.isArray(v)&&v.length===3&&v.every(finite)
export function lunarFrame(latitudeDeg:number,longitudeDeg:number,origin?:Vec3):LunarFrame{
 const lat=latitudeDeg*Math.PI/180,lon=longitudeDeg*Math.PI/180
 const up:Vec3=[Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)]
 return{origin:origin??up.map(v=>v*MOON_RADIUS_M) as Vec3,east:[-Math.sin(lon),Math.cos(lon),0],north:[-Math.sin(lat)*Math.cos(lon),-Math.sin(lat)*Math.sin(lon),Math.cos(lat)],up}
}
export function bodyFixedToLocal(point:Vec3,f:LunarFrame):Vec3{const d=point.map((n,i)=>n-f.origin[i]);return[f.east,f.north,f.up].map(axis=>axis.reduce((sum,n,i)=>sum+n*d[i],0)) as Vec3}
export function localToBodyFixed(point:Vec3,f:LunarFrame):Vec3{return f.origin.map((n,i)=>n+f.east[i]*point[0]+f.north[i]*point[1]+f.up[i]*point[2]) as Vec3}
export function validateTerrainManifest(raw:unknown):TerrainManifest{
 const m=raw as TerrainManifest,fail=()=>{throw Error('The local lunar terrain source contract is unavailable or incompatible.')}
 if(!m||m.schema!=='oras.planet-terrain.v1'||m.regionId!==TERRAIN_REGION||m.body!=='moon'||m.radiusM!==MOON_RADIUS_M||!m.name||m.frame!=='LROC_ME'||!m.heightDatum||!finite(m.latitudeDeg)||Math.abs(m.latitudeDeg)>90||!finite(m.longitudeDeg)||Math.abs(m.longitudeDeg)>180||!vector(m.centerBodyFixedM))fail()
 const origin=lunarFrame(m.latitudeDeg,m.longitudeDeg).origin
 if(Math.hypot(...m.centerBodyFixedM.map((n,i)=>n-origin[i]))>20000||!Array.isArray(m.extentM)||m.extentM.length!==2||m.extentM.some(n=>!finite(n)||n<=0||n>20000)||!Array.isArray(m.heightRangeM)||m.heightRangeM.length!==2||m.heightRangeM.some(n=>!finite(n)||Math.abs(n)>20000)||m.heightRangeM[0]>m.heightRangeM[1])fail()
 const length=Math.hypot(...m.centerBodyFixedM),centerHeight=length-MOON_RADIUS_M
 if(Math.hypot(...m.centerBodyFixedM.map((n,i)=>n/length-origin[i]/MOON_RADIUS_M))>1e-8||centerHeight<m.heightRangeM[0]-1||centerHeight>m.heightRangeM[1]+1)fail()
 if(m.tilesetUrl!==`/planet-terrain/${TERRAIN_REGION}/tileset.json`||!finite(m.elevationResolutionM)||m.elevationResolutionM<=0||!finite(m.imageryResolutionM)||m.imageryResolutionM<=0||!m.tiles||!Number.isInteger(m.tiles.count)||m.tiles.count<1||m.tiles.count>100||!Number.isInteger(m.tiles.levels)||m.tiles.levels<1||m.tiles.levels>5||!finite(m.tiles.maxContentBytes)||m.tiles.maxContentBytes<1||m.tiles.maxContentBytes>4*1024**2||!finite(m.tiles.totalBytes)||m.tiles.totalBytes<=0||m.tiles.totalBytes>64*1024**2)fail()
 if(!Array.isArray(m.sources)||!m.sources.some(s=>s.kind==='elevation')||!m.sources.some(s=>s.kind==='imagery')||m.sources.some(s=>!s.id||!s.license||!/^https:\/\//.test(s.url)||!/^[a-f0-9]{64}$/.test(s.sha256))||!Array.isArray(m.limitations)||m.limitations.some(s=>typeof s!=='string'))fail()
 return m
}
export async function loadTerrainManifest(region:string,signal:AbortSignal){
 if(region!==TERRAIN_REGION)throw Error('This region has no qualified terrain pack. Return to the Moon globe.')
 const response=await fetch(`/planet-terrain/${region}/manifest.json`,{signal,credentials:'same-origin'})
 if(!response.ok)throw Error('The local Apollo 17 terrain pack is unavailable. Retry or return to the Moon globe.')
 const text=await response.text();if(text.length>128*1024)throw Error('Terrain source manifest exceeds its bounded contract.')
 return validateTerrainManifest(JSON.parse(text))
}
export function terrainBudget(quality:TerrainQuality,dpr=1){const efficient=quality==='efficient';return{pixelRatio:Math.min(Math.max(dpr,1),efficient?1:1.5),errorTarget:efficient?10:5,cacheBytes:(efficient?64:128)*1024**2,cacheTiles:efficient?40:90,downloadJobs:efficient?2:4,parseJobs:1,nodeJobs:1,maxTilesProcessed:100}}
export function terrainMoonReturn(raw:unknown,epoch:string,manifest?:Pick<TerrainManifest,'latitudeDeg'|'longitudeDeg'>,search=''){
 const entry=raw as {path?:string;state?:unknown}|undefined
 try{const url=new URL(entry?.path??'','http://local');if(url.origin==='http://local'&&url.pathname==='/planet-view/moon'){url.searchParams.set('date',epoch);return{path:url.pathname+url.search,state:entry?.state}}}catch{/* Direct bookmarks use the source-region view below. */}
 // Observer lat/lng belongs to the native/Solar return, never to lunar lat/lon.
 const observer=new URLSearchParams(search);observer.set('date',epoch)
 for(const key of [...observer.keys()])if(!['date','lat','lng','elev','elevationSource','catalog','source_id','model','ra','dec'].includes(key))observer.delete(key)
 const planetReturn={path:'/solar-system?'+observer,state:{solarReturn:{path:'/sky-engine?'+observer}}}
 return{path:'/planet-view/moon?'+new URLSearchParams({date:epoch,lat:String(manifest?.latitudeDeg??20.18),lon:String(manifest?.longitudeDeg??30.71),height:'30000'}),state:{planetReturn}}
}
