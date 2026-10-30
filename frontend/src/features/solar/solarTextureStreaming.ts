import * as T from 'three'
import {SolarResourceOwner,SolarTextureBudget} from './solarAssets'
import type {SolarQuality} from './solarPresentation'
import {solarDetailAsset} from './solarVisualAssets'

export type SolarDetailPayload={map:Awaited<ReturnType<SolarResourceOwner['texture']>>;maxSize:number;source:string;mapping:'source-uv'|'equirectangular'}
export function solarTextureQuality(quality:SolarQuality){
 return{overviewMaxSize:1024,detailMaxSize:quality==='detailed'?8192:quality==='balanced'?4096:2048,totalBytes:(quality==='detailed'?384:quality==='balanced'?192:64)*1024*1024}
}
export async function loadSolarDetail(id:string,maxSize:number,owner:SolarResourceOwner):Promise<SolarDetailPayload>{
 const selected=solarDetailAsset(id,maxSize)
 if(!selected)throw Error('No qualified Solar detail asset.')
 const {asset,image}=selected
 const map=await owner.texture(image.url,maxSize,true,{width:image.width,height:image.height,flipY:asset.mapping!=='source-uv'})
 // The pinned GLBs have no sampler entries: glTF's defaults are repeat on
 // both axes, linear magnification and trilinear minification. Equirectangular
 // globes wrap longitude only. Bitmap orientation is handled during decoding.
 map.wrapS=T.RepeatWrapping;map.wrapT=asset.mapping==='source-uv'?T.RepeatWrapping:T.ClampToEdgeWrapping
 map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter
 return{map,maxSize:Math.max(map.image.width,map.image.height),source:asset.source,mapping:asset.mapping as SolarDetailPayload['mapping']}
}
type Options={budget:SolarTextureBudget;maxTextureSize?:number;load?:(id:string,maxSize:number,owner:SolarResourceOwner)=>Promise<SolarDetailPayload>;apply:(id:string,payload:SolarDetailPayload|null)=>void;requestFrame:()=>void;onError?:(id:string,error:unknown)=>void}
type Generation={id:string;size:number;owner:SolarResourceOwner;generation:number;finished?:Promise<void>}

/** One selected-body detail demand; the scene retains ownership of its overview.
 * Decode/fetch failures never remove the last valid map. No camera or RAF owner.
 * apply is synchronous: install the replacement before the previous owner dies.
 */
export class SolarTextureStreamer{
 private target:string|null=null
 private current:Generation|null=null
 private pending:Generation|null=null
 private retiring=new Set<Generation>()
 private generation=0
 private cancelled=0
 private promoted=0
 private errors=0
 private lastError:string|null=null
 private disposed=false
 constructor(private quality:SolarQuality,private options:Options){options.budget.setLimit(solarTextureQuality(quality).totalBytes)}
 private clearCurrent(){if(this.current){this.options.apply(this.current.id,null);this.current.owner.dispose();this.current=null}}
 private cancelPending(){if(this.pending){const old=this.pending;old.owner.dispose();this.retiring.add(old);this.pending=null;this.cancelled++}}
 setTarget(id:string|null){
  if(this.disposed||id===this.target)return
  this.target=id;this.cancelPending();this.clearCurrent();this.start();this.options.requestFrame()
 }
 setQuality(quality:SolarQuality){
  if(this.disposed||quality===this.quality)return
  const previous=solarTextureQuality(this.quality),next=solarTextureQuality(quality)
  this.quality=quality;this.cancelPending()
  // Drop the superseded high map before lowering admission. The overview stays
  // live throughout, so efficient mode cannot temporarily exceed its own cap.
  if(next.totalBytes<previous.totalBytes)this.clearCurrent()
  this.start();this.options.requestFrame()
 }
 private start(){
  // ImageBitmap decoding itself has no AbortSignal. Keep its reservation and
  // defer a replacement/downgrade until the cancelled decode actually settles.
  if(this.disposed||this.retiring.size)return
  this.options.budget.setLimit(solarTextureQuality(this.quality).totalBytes)
  if(!this.target)return
  const size=Math.min(solarTextureQuality(this.quality).detailMaxSize,this.options.maxTextureSize??Infinity)
  const selected=solarDetailAsset(this.target,size)
  // Test/integration loaders may admit other source-backed bodies explicitly.
  if(!selected&&!this.options.load)return
  const actual=selected?Math.min(size,Math.max(selected.image.width,selected.image.height)):size
  if(this.current?.id===this.target&&this.current.size===actual)return
  const next:Generation={id:this.target,size:actual,owner:new SolarResourceOwner(this.options.budget),generation:++this.generation}
  this.pending=next
  next.finished=(this.options.load??loadSolarDetail)(next.id,actual,next.owner).then(payload=>{
   if(this.disposed||this.pending!==next||next.owner.signal.aborted){next.owner.dispose();return}
   const previous=this.current
   this.options.apply(next.id,payload);this.current=next;this.pending=null;this.promoted++;this.lastError=null
   previous?.owner.dispose();this.options.requestFrame()
  }).catch(error=>{
   next.owner.dispose()
   if(this.disposed||this.pending!==next)return
   this.pending=null;this.errors++;this.lastError=error instanceof Error?error.message:String(error)
   this.options.onError?.(next.id,error);this.options.requestFrame()
  }).finally(()=>{
   if(this.retiring.delete(next)){this.start();this.options.requestFrame()}
  })
 }
 diagnostics(){return{target:this.target,quality:this.quality,current:this.current?{id:this.current.id,maxSize:this.current.size,...this.current.owner.diagnostics()}:null,pending:this.pending?{id:this.pending.id,maxSize:this.pending.size,...this.pending.owner.diagnostics()}:null,retiring:[...this.retiring].map(r=>({id:r.id,...r.owner.diagnostics()})),cancelled:this.cancelled,promoted:this.promoted,errors:this.errors,lastError:this.lastError,...this.options.budget.diagnostics(),disposed:this.disposed}}
 dispose(){if(this.disposed)return;this.disposed=true;this.cancelPending();this.clearCurrent();this.target=null}
}
