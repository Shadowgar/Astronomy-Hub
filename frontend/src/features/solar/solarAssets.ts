import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'

type Resource={dispose:()=>void}
/** Shared by overview and demand owners. Count GPU Texture allocations, even
 * when two texture objects share one decoded ImageBitmap. */
export class SolarTextureBudget{
 private used=0
 private allocations=0
 constructor(private limit:number){}
 reserve(bytes:number){if(!Number.isFinite(bytes)||bytes<=0||this.used+bytes>this.limit)throw Error('Solar texture budget exceeded.');this.used+=bytes;this.allocations++}
 release(bytes:number,count=1){this.used-=bytes;this.allocations-=count}
 setLimit(bytes:number){if(bytes<this.used)throw Error('Solar texture budget exceeded.');this.limit=bytes}
 diagnostics(){return{textureBytes:this.used,textureBudget:this.limit,textureAllocations:this.allocations}}
}
type TextureOptions={width?:number;height?:number;flipY?:boolean}
/** Per-renderer ownership, bounded decoding and cancellation; never a global cache. */
export class SolarResourceOwner{
 private controller=new AbortController()
 private resources=new Set<Resource>()
 private textureBytes=0
 private textureAllocations=0
 private decodingBytes=0
 private decodingAllocations=0
 private disposed=false
 private requests=0
 private decodes:{kind:string;milliseconds:number}[]=[]
 private budget:SolarTextureBudget
 constructor(textureBudget:number|SolarTextureBudget=192*1024*1024){this.budget=typeof textureBudget==='number'?new SolarTextureBudget(textureBudget):textureBudget}
 get signal(){return this.controller.signal}
 keep<A extends Resource>(resource:A):A{
  if(this.disposed){resource.dispose();throw Error('Solar assets disposed.')}
  this.resources.add(resource);return resource
 }
 reserveTexture(width:number,height:number){
  this.signal.throwIfAborted()
  const bytes=Math.ceil(width*height*4*4/3)
  this.budget.reserve(bytes);this.textureBytes+=bytes;this.textureAllocations++;return bytes
 }
 private pendingDecode(bytes:number,count=1){this.decodingBytes+=bytes;this.decodingAllocations+=count}
 private finishDecode(bytes:number,count=1,release=false){this.decodingBytes-=bytes;this.decodingAllocations-=count;if(release){this.textureBytes-=bytes;this.textureAllocations-=count;this.budget.release(bytes,count)}}
 async bytes(url:string,fetcher:typeof fetch=fetch){
  this.signal.throwIfAborted();this.requests++
  try{
   const response=await fetcher(url,{signal:this.signal})
   if(!response.ok)throw Error('Solar asset unavailable.')
   if(Number(response.headers.get('content-length'))>16*1024*1024)throw Error('Solar asset network budget exceeded.')
   const data=await response.arrayBuffer();this.signal.throwIfAborted()
   if(data.byteLength>16*1024*1024)throw Error('Solar asset network budget exceeded.')
   return data
  }finally{this.requests--}
 }
 async texture(url:string,maxSize:number,colour=true,options:TextureOptions={}){
  const bytes=await this.bytes(url),blob=new Blob([bytes]),start=performance.now()
  let source:ImageBitmap|undefined,image:ImageBitmap|undefined,reserved=0
  try{
   // Known manifest dimensions allow admission before decoding and a single
   // bounded decode. Unlisted legacy callers retain their previous behavior.
   if(!options.width||!options.height)source=await createImageBitmap(blob)
   this.signal.throwIfAborted()
   const sourceWidth=options.width??source!.width,sourceHeight=options.height??source!.height
   const scale=Math.min(1,maxSize/Math.max(sourceWidth,sourceHeight)),width=Math.max(1,Math.round(sourceWidth*scale)),height=Math.max(1,Math.round(sourceHeight*scale))
   reserved=this.reserveTexture(width,height);this.pendingDecode(reserved)
   image=await createImageBitmap(source??blob,{resizeWidth:width,resizeHeight:height,imageOrientation:options.flipY===false?'none':'flipY',premultiplyAlpha:'none',colorSpaceConversion:'none'})
   this.signal.throwIfAborted()
   this.finishDecode(reserved);reserved=0
   const texture=this.keep(new T.Texture(image));texture.flipY=false;texture.colorSpace=colour?T.SRGBColorSpace:T.NoColorSpace;texture.needsUpdate=true
   const retained=image;this.keep({dispose:()=>retained.close()});this.decodes.push({kind:'texture',milliseconds:performance.now()-start});return texture
  }catch(e){image?.close();if(reserved)this.finishDecode(reserved,1,true);throw e}
  finally{source?.close()}
 }
 async model(url:string,maxSize:number){
  const bytes=await this.bytes(url),start=performance.now(),gltf=await new GLTFLoader().parseAsync(bytes,'')
  const loaded=new Set<Resource>(),textures=new Set<any>()
  gltf.scene.traverse((node:any)=>{if(!node.isMesh)return;loaded.add(node.geometry);for(const m of Array.isArray(node.material)?node.material:[node.material]){loaded.add(m);for(const value of Object.values(m) as any[])if(value?.isTexture){loaded.add(value);textures.add(value)}}})
  const images=new Set<any>();for(const texture of textures)if(texture.image?.close)images.add(texture.image)
  const closeLoaded=()=>{for(const r of loaded)r.dispose();for(const image of images)image.close()}
  if(this.signal.aborted){closeLoaded();this.signal.throwIfAborted()}
  let reserved=0,reservedCount=0
  try{
   // One image may back several texture objects. Preserve the original UVs and
   // sampler settings; only the GPU resolution changes with the quality budget.
   const processed=new Map<any,any>()
   for(const texture of textures){
    const original=texture.image
    if(!original?.width||!original?.height)continue
    let image=processed.get(original)
    if(!image){
     const scale=Math.min(1,maxSize/Math.max(original.width,original.height))
     image=scale<1?await createImageBitmap(original,{resizeWidth:Math.max(1,Math.round(original.width*scale)),resizeHeight:Math.max(1,Math.round(original.height*scale))}):original
     if(image!==original&&image.close)images.add(image)
     processed.set(original,image)
    }
    const bytes=this.reserveTexture(image.width,image.height);this.pendingDecode(bytes);reserved+=bytes;reservedCount++
    texture.image=image;texture.needsUpdate=true
   }
   // Resized GPU inputs no longer reference the original decoded bitmaps.
   for(const [original,replacement] of processed)if(original!==replacement&&images.has(original)){original.close();images.delete(original)}
   this.signal.throwIfAborted()
   this.finishDecode(reserved,reservedCount);reserved=0;reservedCount=0
   for(const resource of loaded)this.keep(resource)
   for(const image of images)this.keep({dispose:()=>image.close()})
   this.decodes.push({kind:'model',milliseconds:performance.now()-start});return gltf
  }catch(e){this.finishDecode(reserved,reservedCount,true);closeLoaded();throw e}
 }
 diagnostics(){return{resources:this.resources.size,textureBytes:this.textureBytes,textureAllocations:this.textureAllocations,decodingBytes:this.decodingBytes,textureBudget:this.budget.diagnostics().textureBudget,shared:this.budget.diagnostics(),requests:this.requests,decodeSamples:this.decodes,disposed:this.disposed}}
 dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();for(const resource of this.resources)resource.dispose();this.resources.clear();this.budget.release(this.textureBytes-this.decodingBytes,this.textureAllocations-this.decodingAllocations);this.textureBytes=this.decodingBytes;this.textureAllocations=this.decodingAllocations}
}
