import {afterEach,describe,expect,it,vi} from 'vitest'
import {probeRuntime} from '../src/features/runtime/runtimeProbeService'

const artifact={owner:'Astronomy Hub',upstream_sha:'pinned-upstream',artifact_sha256:'accepted-artifact'}
const versions={earth:{sha:artifact.upstream_sha,artifact_sha256:artifact.artifact_sha256}}
function earthResponses(release:unknown=artifact,manifest:unknown=versions){
 return vi.fn().mockResolvedValueOnce(Response.json(release)).mockResolvedValueOnce(Response.json(manifest))
}
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers()})
describe('runtime identity probes',()=>{
 it('accepts reachable Sky with a fresh abortable request',async()=>{
  const request=vi.fn().mockResolvedValue(new Response('',{status:200}));vi.stubGlobal('fetch',request)
  await expect(probeRuntime('sky')).resolves.toBeUndefined()
  expect(request).toHaveBeenCalledWith('/oras-sky-engine/favicon.ico',expect.objectContaining({cache:'no-store',signal:expect.any(AbortSignal)}))
 })
 it.each(['http','network'])('normalizes unreachable %s failures',async kind=>{
  vi.stubGlobal('fetch',kind==='http'?vi.fn().mockResolvedValue(new Response('',{status:503})):vi.fn().mockRejectedValue(new TypeError('network internals')))
  await expect(probeRuntime('sky')).rejects.toMatchObject({code:'unreachable',message:'The runtime could not be reached.'})
 })
 it('accepts matching Earth metadata and never caches either identity request',async()=>{
  const request=earthResponses();vi.stubGlobal('fetch',request);await probeRuntime('earth')
  expect(request.mock.calls.map(c=>c[0])).toEqual(['/earth-runtime/release.json','/runtime-versions.json'])
  for(const [,options] of request.mock.calls)expect(options).toMatchObject({cache:'no-store',signal:expect.any(AbortSignal)})
 })
 it.each(['artifact_sha256','upstream_sha','owner'])('rejects a mismatching %s',async field=>{
  vi.stubGlobal('fetch',earthResponses({...artifact,[field]:'wrong'}))
  await expect(probeRuntime('earth')).rejects.toMatchObject({code:'artifact-mismatch',message:'Earth artifact does not match the qualified runtime.'})
 })
 it.each([null,{}, {earth:{}}, {earth:{sha:artifact.upstream_sha}}])('rejects incomplete identity metadata %j',async manifest=>{
  vi.stubGlobal('fetch',earthResponses(artifact,manifest));await expect(probeRuntime('earth')).rejects.toMatchObject({code:'artifact-mismatch'})
 })
 it('normalizes a failed manifest response',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(Response.json(artifact)).mockResolvedValueOnce(new Response('',{status:503})))
  await expect(probeRuntime('earth')).rejects.toMatchObject({code:'unreachable'})
 })
 it('propagates caller abort without a stale success',async()=>{
  const caller=new AbortController(),reason=new DOMException('Mount removed','AbortError')
  vi.stubGlobal('fetch',vi.fn().mockImplementation((_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))))
  const result=probeRuntime('earth',{signal:caller.signal});const rejection=expect(result).rejects.toBe(reason);caller.abort(reason);await rejection
 })
 it('does not request anything for an already aborted mount',async()=>{
  const caller=new AbortController();caller.abort();const request=vi.fn();vi.stubGlobal('fetch',request)
  await expect(probeRuntime('sky',{signal:caller.signal})).rejects.toBe(caller.signal.reason);expect(request).not.toHaveBeenCalled()
 })
 it('bounds the whole probe including the manifest request to four seconds',async()=>{
  vi.useFakeTimers();const request=vi.fn().mockResolvedValueOnce(Response.json(artifact)).mockImplementationOnce((_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true})))
  vi.stubGlobal('fetch',request);const result=probeRuntime('earth');const rejection=expect(result).rejects.toMatchObject({code:'timeout'})
  await vi.advanceTimersByTimeAsync(3999);expect(request).toHaveBeenCalledTimes(2)
  await vi.advanceTimersByTimeAsync(1);await rejection;expect(vi.getTimerCount()).toBe(0)
 })
 it('rechecks identity on retry rather than reusing a successful release',async()=>{
  const request=earthResponses().mockResolvedValueOnce(Response.json({...artifact,artifact_sha256:'changed'})).mockResolvedValueOnce(Response.json(versions));vi.stubGlobal('fetch',request)
  await probeRuntime('earth');await expect(probeRuntime('earth')).rejects.toMatchObject({code:'artifact-mismatch'});expect(request).toHaveBeenCalledTimes(4)
 })
})
