import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'

type Resource={dispose:()=>void}
/** Per-renderer ownership, bounded decoding and cancellation; never a global cache. */
export class SolarResourceOwner{
 private controller=new AbortController()
 private resources=new Set<Resource>()
 private textureBytes=0
 private disposed=false
 private requests=0
 private decodes:{kind:string;milliseconds:number}[]=[]
 constructor(private textureBudget=192*1024*1024){}
 get signal(){return this.controller.signal}
 keep<A extends Resource>(resource:A):A{
  if(this.disposed){resource.dispose();throw Error('Solar assets disposed.')}
  this.resources.add(resource);return resource
 }
 reserveTexture(width:number,height:number){
  const bytes=Math.ceil(width*height*4*4/3)
  if(!Number.isFinite(bytes)||bytes<=0||this.textureBytes+bytes>this.textureBudget)throw Error('Solar texture budget exceeded.')
  this.textureBytes+=bytes;return bytes
 }
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
 async texture(url:string,maxSize:number,colour=true){
  const bytes=await this.bytes(url),blob=new Blob([bytes]),start=performance.now(),source=await createImageBitmap(blob)
  if(this.signal.aborted){source.close();this.signal.throwIfAborted()}
  const scale=Math.min(1,maxSize/Math.max(source.width,source.height)),width=Math.max(1,Math.round(source.width*scale)),height=Math.max(1,Math.round(source.height*scale))
  let image:ImageBitmap
  try{image=await createImageBitmap(source,{resizeWidth:width,resizeHeight:height,imageOrientation:'flipY'});}finally{source.close()}
  if(this.signal.aborted){image.close();this.signal.throwIfAborted()}
  try{this.reserveTexture(width,height)}catch(e){image.close();throw e}
  const texture=this.keep(new T.Texture(image));texture.flipY=false;texture.colorSpace=colour?T.SRGBColorSpace:T.NoColorSpace;texture.needsUpdate=true
  this.keep({dispose:()=>image.close()});this.decodes.push({kind:'texture',milliseconds:performance.now()-start});return texture
 }
 async model(url:string,maxSize:number){
  const bytes=await this.bytes(url),start=performance.now(),gltf=await new GLTFLoader().parseAsync(bytes,'')
  const loaded=new Set<Resource>(),textures=new Set<any>()
  gltf.scene.traverse((node:any)=>{if(!node.isMesh)return;loaded.add(node.geometry);for(const m of Array.isArray(node.material)?node.material:[node.material]){loaded.add(m);for(const value of Object.values(m) as any[])if(value?.isTexture){loaded.add(value);textures.add(value)}}})
  const images=new Set<any>();for(const texture of textures)if(texture.image?.close)images.add(texture.image)
  const closeLoaded=()=>{for(const r of loaded)r.dispose();for(const image of images)image.close()}
  if(this.signal.aborted){closeLoaded();this.signal.throwIfAborted()}
  let reserved=0
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
     reserved+=this.reserveTexture(image.width,image.height);processed.set(original,image)
    }
    texture.image=image;texture.needsUpdate=true
   }
   // Resized GPU inputs no longer reference the original decoded bitmaps.
   for(const [original,replacement] of processed)if(original!==replacement&&images.has(original)){original.close();images.delete(original)}
   this.signal.throwIfAborted()
   for(const resource of loaded)this.keep(resource)
   for(const image of images)this.keep({dispose:()=>image.close()})
   this.decodes.push({kind:'model',milliseconds:performance.now()-start});return gltf
  }catch(e){this.textureBytes-=reserved;closeLoaded();throw e}
 }
 diagnostics(){return{resources:this.resources.size,textureBytes:this.textureBytes,textureBudget:this.textureBudget,requests:this.requests,decodeSamples:this.decodes,disposed:this.disposed}}
 dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();for(const resource of this.resources)resource.dispose();this.resources.clear();this.textureBytes=0}
}
