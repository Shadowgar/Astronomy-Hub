import {parseCoordinateQuery}from'../../../../packages/earth-search/coordinateParser.mjs'
export type EarthDestination={lat:number;lon:number;name?:string;description?:string;source?:string}
export type EarthSearchResult=EarthDestination&{id:string;name:string;description:string;kind:string;source:string}
export function earthTargetFromSearch(search:string):{lat:number;lon:number}|null{
 const p=new URLSearchParams(search),lat=p.get('earthLat'),lon=p.get('earthLon'),decimal=/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/
 if(!lat||!lon||p.getAll('earthLat').length!==1||p.getAll('earthLon').length!==1||!decimal.test(lat)||!decimal.test(lon))return null
 const point={lat:Number(lat),lon:Number(lon)};return Math.abs(point.lat)<=90&&Math.abs(point.lon)<=180?point:null
}
export async function searchEarth(query:string,signal:AbortSignal,fetcher:typeof fetch=fetch):Promise<EarthSearchResult[]>{
 const q=query.trim(),point=parseCoordinateQuery(q);signal.throwIfAborted()
 if(point)return[{...point,id:`coordinates:${point.lat}:${point.lon}`,name:point.label,description:'Decimal latitude, longitude',kind:'coordinates',source:'Coordinates you entered'}]
 const numericHemisphere=/\d/.test(q)&&/^[\d\s.,;+\-°NSEW]+$/i.test(q)
 const malformedPair=/^\s*(?:[NSEW]\s*)?[+\-]?(?:\d+(?:\.\d+)?|NaN|Infinity)[A-Za-z°]*\s*[,;]\s*(?:[NSEW]\s*)?[+\-]?(?:\d+(?:\.\d+)?|NaN|Infinity)[A-Za-z°]*\s*$/i.test(q)
 const coordinateLike=numericHemisphere||malformedPair
 if(coordinateLike)throw Error('Invalid coordinates. Use latitude −90 to 90, longitude −180 to 180.')
 if(q.length<2||q.length>200)throw Error('Enter 2–200 characters for a place or street address.')
 const response=await fetcher('/api/earth/search?'+new URLSearchParams({q}),{signal})
 if(response.status===429)throw Error('Place search is busy. Wait a moment and try again, or enter coordinates.')
 if(!response.ok)throw Error('Place search is unavailable. Try again, or enter coordinates.')
 const body=await response.json();signal.throwIfAborted()
 if(!Array.isArray(body.results)||body.results.length>5)throw Error('The place provider returned invalid results. Coordinates still work.')
 return body.results.map((row:unknown)=>{
  const v=row as EarthSearchResult
  if(!v||typeof v.id!=='string'||typeof v.name!=='string'||!v.name||v.name.length>240||typeof v.description!=='string'||v.description.length>1000||typeof v.kind!=='string'||!Number.isFinite(v.lat)||!Number.isFinite(v.lon)||Math.abs(v.lat)>90||Math.abs(v.lon)>180)throw Error('The place provider returned invalid coordinates or details.')
  return{...v,source:'Photon / OpenStreetMap'}
 })
}
