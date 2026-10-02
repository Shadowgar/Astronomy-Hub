import type {RuntimeMode} from '../../../../packages/runtime-protocol/index.mjs'

type ProbeErrorCode='unreachable'|'artifact-mismatch'|'timeout'
export class RuntimeProbeError extends Error {
 constructor(readonly code:ProbeErrorCode,message:string){super(message);this.name='RuntimeProbeError'}
}
const record=(value:unknown):Record<string,unknown>=>value!==null&&typeof value==='object'?value as Record<string,unknown>:{}
const nonempty=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0

// Static runtime identity is outside the /api/v1 client. Keep requests here,
// uncached and bounded across both response bodies and the manifest lookup.
export async function probeRuntime(mode:RuntimeMode,{signal}:{signal?:AbortSignal}={}):Promise<void>{
 signal?.throwIfAborted()
 const deadline=new AbortController()
 const requestSignal=signal?AbortSignal.any([signal,deadline.signal]):deadline.signal
 const timer=setTimeout(()=>deadline.abort(new DOMException('Runtime probe timed out','TimeoutError')),4000)
 try{
  const response=await fetch(mode==='earth'?'/earth-runtime/release.json':'/oras-sky-engine/favicon.ico',{signal:requestSignal,cache:'no-store'})
  if(!response.ok)throw new RuntimeProbeError('unreachable','The runtime could not be reached.')
  if(mode==='earth'){
   const artifact=record(await response.json())
   requestSignal.throwIfAborted()
   const manifest=await fetch('/runtime-versions.json',{signal:requestSignal,cache:'no-store'})
   if(!manifest.ok)throw new RuntimeProbeError('unreachable','The runtime could not be reached.')
   const expected=record(record(await manifest.json()).earth)
   if(artifact.owner!=='Astronomy Hub'||!nonempty(expected.sha)||!nonempty(expected.artifact_sha256)||artifact.upstream_sha!==expected.sha||artifact.artifact_sha256!==expected.artifact_sha256){
    throw new RuntimeProbeError('artifact-mismatch','Earth artifact does not match the qualified runtime.')
   }
  }
  requestSignal.throwIfAborted()
 }catch(cause){
  if(signal?.aborted)throw signal.reason
  if(deadline.signal.aborted)throw new RuntimeProbeError('timeout','The runtime check timed out.')
  if(cause instanceof RuntimeProbeError)throw cause
  throw new RuntimeProbeError('unreachable','The runtime could not be reached.')
 }finally{clearTimeout(timer)}
}
