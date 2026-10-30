export type SourceOffer={schema:1;status:'candidate'|'published';source_revision:string;archive:{url:string;sha256:string;bytes:number};licenses:{name:string;url:string}[];runtime:{sky_artifact_sha256:string;native_wasm_sha256:string};limitations:string[]}
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value)
const text=(value:unknown,maximum:number):value is string=>typeof value==='string'&&value.trim().length>0&&value.length<=maximum
const digest=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value)
function localPath(value:unknown,prefix:string):value is string{
 return typeof value==='string'&&value.length<=512&&value.startsWith(prefix)&&value.length>prefix.length&&/^\/[a-zA-Z0-9/_.-]+$/.test(value)&&!value.includes('//')&&!value.split('/').some(part=>part==='.'||part==='..')
}
export function validateSourceOffer(raw:unknown):SourceOffer{
 const invalid=()=>{throw Error('The corresponding-source manifest is unavailable or invalid.')}
 if(!object(raw)||raw.schema!==1||!['candidate','published'].includes(String(raw.status))||typeof raw.source_revision!=='string'||!/^[a-f0-9]{40}$/.test(raw.source_revision))return invalid()
 const archive=raw.archive,runtime=raw.runtime,licenses=raw.licenses,limitations=raw.limitations
 if(!object(archive)||!localPath(archive.url,'/source-distribution/')||archive.url!==`/source-distribution/astronomy-hub-source-${raw.source_revision}.tar.gz`||!digest(archive.sha256)||!Number.isSafeInteger(archive.bytes)||Number(archive.bytes)<=0||!object(runtime)||!digest(runtime.sky_artifact_sha256)||!digest(runtime.native_wasm_sha256))return invalid()
 if(!Array.isArray(licenses)||licenses.length===0||licenses.length>32||licenses.some(item=>!object(item)||!text(item.name,120)||!localPath(item.url,'/licenses/'))||!licenses.some(item=>item.url==='/licenses/stellarium-web-engine-AGPL-3.0.txt'))return invalid()
 if(!Array.isArray(limitations)||limitations.length>32||limitations.some(item=>!text(item,1000)))return invalid()
 return raw as SourceOffer
}
export async function loadSourceOffer(signal:AbortSignal,fetcher:typeof fetch=fetch):Promise<SourceOffer>{
 const revision=import.meta.env.VITE_SOURCE_REVISION
 if(typeof revision!=='string'||!/^[a-f0-9]{40}$/.test(revision))throw Error('This Hub build has no qualified corresponding-source identity.')
 const read=async(path:string)=>{
  const response=await fetcher(path,{signal,cache:'no-store',headers:{Accept:'application/json'}})
  if(!response.ok)throw Error('Corresponding source identity is unavailable from this server.')
  const body=await response.text();signal.throwIfAborted()
  if(body.length>65536)throw Error('The corresponding-source identity is too large.')
  return JSON.parse(body) as unknown
 }
 const [descriptor,versions]=await Promise.all([read('/source-distribution/manifest.json'),read('/runtime-versions.json')])
 const offer=validateSourceOffer(descriptor),sky=object(versions)&&object(versions.sky)?versions.sky:null
 const native=sky&&object(sky.native_horizon)&&object(sky.native_horizon.native_output_sha256)?sky.native_horizon.native_output_sha256:null
 if(offer.source_revision!==revision||offer.runtime.sky_artifact_sha256!==sky?.artifact_sha256||offer.runtime.native_wasm_sha256!==native?.['stellarium-web-engine.wasm'])throw Error('The source distribution does not match this Hub and Sky runtime.')
 return offer
}
