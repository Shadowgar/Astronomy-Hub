import type {TerrainManifest} from './terrainContracts'

/** Session-owned transport: root and content share cancellation and a byte ceiling. */
export class TerrainTransport{
 readonly name='ORAS_BOUNDED_LUNAR_TRANSPORT'
 private controller=new AbortController()
 private receivedBytes=0
 private active=0
 private requests=0
 private failures=0
 private aborted=0
 private disposed=false
 constructor(private manifest:TerrainManifest,private origin:string,private fetcher:typeof fetch=fetch){}
 async fetchData(raw:string|URL,options:RequestInit={}){
  const url=new URL(raw,this.origin),prefix=`/planet-terrain/${this.manifest.regionId}/`
  if(this.disposed)throw new DOMException('Terrain departed','AbortError')
  if(url.origin!==this.origin||!url.pathname.startsWith(prefix)||url.search||url.hash||!/^[-a-zA-Z0-9_/.]+\.(json|glb)$/.test(url.pathname)||url.pathname.endsWith('.json')&&url.pathname!==this.manifest.tilesetUrl)throw Error('Terrain resource is outside the qualified local pack.')
  const root=url.pathname.endsWith('.json'),maximum=root?256*1024:this.manifest.tiles.maxContentBytes
  const abort=new AbortController(),cancel=()=>abort.abort()
  this.controller.signal.addEventListener('abort',cancel,{once:true});options.signal?.addEventListener('abort',cancel,{once:true})
  if(options.signal?.aborted)abort.abort()
  this.requests++;this.active++
  try{
   const fetcher=this.fetcher
   const response=await fetcher(url.href,{...options,credentials:'same-origin',redirect:'error',signal:abort.signal})
   if(!response.ok)throw Error(`Local terrain request failed (${response.status}).`)
   const length=Number(response.headers.get('content-length')||0)
   if(length>maximum)throw Error('Terrain content exceeds its qualified file budget.')
   if(!response.body)throw Error('Terrain response has no body.')
   const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0
   try{while(true){const part=await reader.read();if(part.done)break;if(abort.signal.aborted)throw new DOMException('Terrain departed','AbortError');size+=part.value.byteLength;this.receivedBytes+=part.value.byteLength;if(size>maximum||this.receivedBytes>160*1024**2)throw Error('Terrain transfer budget reached. Return or reload the terrain view.');chunks.push(part.value)}}catch(error){await reader.cancel().catch(()=>{});throw error}finally{reader.releaseLock()}
   if(abort.signal.aborted)throw new DOMException('Terrain departed','AbortError')
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
   if(root)this.validateTileset(JSON.parse(new TextDecoder().decode(bytes)))
   return new Response(bytes,{headers:{'content-type':root?'application/json':'model/gltf-binary'}})
  }catch(error){if(abort.signal.aborted)this.aborted++;else this.failures++;throw error}finally{this.active--;this.controller.signal.removeEventListener('abort',cancel);options.signal?.removeEventListener('abort',cancel)}
 }
 private validateTileset(value:any){
  let count=0;const walk=(tile:any,depth:number)=>{if(!tile||depth>=this.manifest.tiles.levels||++count>this.manifest.tiles.count||!Number.isFinite(tile.geometricError)||tile.geometricError<0)throw Error('Terrain tile hierarchy is outside its qualified contract.');if(tile.content&&!/^(?:[-a-zA-Z0-9_]+\/)*[-a-zA-Z0-9_]+\.glb$/.test(tile.content.uri))throw Error('Terrain content must be a local GLB.');if(tile.children){if(!Array.isArray(tile.children)||tile.children.length>4)throw Error('Terrain hierarchy is not the qualified quadtree.');tile.children.forEach((child:any)=>walk(child,depth+1))}}
  if(!value?.root||!Array.isArray(value.root.transform)||value.root.transform.length!==16||value.root.transform.some((n:unknown)=>typeof n!=='number'||!Number.isFinite(n)))throw Error('Terrain has no qualified lunar body-fixed transform.')
  walk(value.root,0)
  if(count!==this.manifest.tiles.count)throw Error('Terrain tile count differs from its source manifest.')
 }
 diagnostics(){return{requests:this.requests,active:this.active,failures:this.failures,aborted:this.aborted,receivedBytes:this.receivedBytes,sessionByteLimit:160*1024**2,disposed:this.disposed}}
 dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort()}
}
