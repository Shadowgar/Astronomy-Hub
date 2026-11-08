import * as T from 'three'
import {describe,it,expect,vi} from 'vitest'
import {SolarPopulationLayer,populationQualityStride} from '../src/features/solar/SolarPopulationLayer'
import type {PopulationSummary,PopulationReply,PopulationEvaluation} from '../src/features/solar/solarPopulations'
class FakeWorker{onmessage:any=null;onerror:any=null;requests:any[]=[];terminate=vi.fn();postMessage(request:any){this.requests.push(request)}reply(message:any){this.onmessage?.({data:message})}}
const summary={bodyCount:1000,release:'fixture'} as PopulationSummary
function evaluation(jd:number,population='asteroid-belt'):PopulationEvaluation{return {jdTdb:jd,population:population as any,availableCount:3,unavailableCount:1,coverageStartJdTdb:2461020.5,coverageEndJdTdb:2461380.5,indices:new Uint32Array([2,6,9]),positionsHigh:new Float32Array([0,0,-10,1,0,-10,-1,0,-10]),positionsLow:new Float32Array(9),velocities:new Float32Array(9)}}
function setup(){let time=0;const worker=new FakeWorker(),scene=new T.Scene(),request=vi.fn(),status=vi.fn(),layer=new SolarPopulationLayer(scene,request,status,()=>worker as any,()=>time);worker.reply({type:'loaded',requestId:worker.requests[0].requestId,summary});return {layer,worker,scene,request,status,now:(value:number)=>{time=value}}}
function complete(s:ReturnType<typeof setup>,values?:Partial<PopulationEvaluation>){const request=s.worker.requests.filter(r=>r.type==='evaluate').at(-1);s.worker.reply({type:'evaluated',requestId:request.requestId,...evaluation(request.jdTdb,request.population),...values});return request}

describe('population GPU/worker lifecycle',()=>{
 it('allows only one pending evaluation and bounds requests to10Hz while retaining exact returned epochs',()=>{
  const s=setup();s.layer.setPopulation('asteroid-belt');s.layer.update(2461200.5,[0,0,0],'balanced')
  for(let i=0;i<10;i++)s.layer.update(2461200.5+i*.001,[i,0,0],'balanced')
  expect(s.worker.requests.filter(r=>r.type==='evaluate')).toHaveLength(1)
  s.now(35);complete(s);expect(s.layer.diagnostics().displayedJdTdb).toBe(2461200.5)
  expect(s.layer.diagnostics().drawnCount).toBe(2)
  s.now(50);s.layer.update(2461200.6,[0,0,0],'balanced');expect(s.worker.requests.filter(r=>r.type==='evaluate')).toHaveLength(1)
  s.now(101);s.layer.update(2461200.6,[0,0,0],'balanced');expect(s.worker.requests.filter(r=>r.type==='evaluate')).toHaveLength(2)
  s.layer.dispose()
 })
 it('hides stale samples by wall age, settles exactly when paused and rejects coverage expiry',()=>{
  const s=setup();s.layer.setPopulation('asteroid-belt');s.layer.update(2461200.5,[0,0,0],'detailed');s.now(35);complete(s)
  s.now(535);s.layer.update(2461201,[0,0,0],'detailed');expect(s.layer.diagnostics().drawnCount).toBe(3)
  s.now(536);s.layer.update(2461201,[0,0,0],'detailed');expect(s.layer.diagnostics().drawnCount).toBe(0)
  complete(s);s.now(10000);s.layer.update(2461201,[0,0,0],'detailed');expect(s.layer.diagnostics().drawnCount).toBe(3)
  s.layer.update(2461381,[0,0,0],'detailed');expect(s.layer.diagnostics().drawnCount).toBe(0);s.layer.dispose()
 })
 it('fences category switches and discontinuous time seeks without concurrent evaluations',()=>{
  const s=setup();s.layer.setPopulation('asteroid-belt');s.layer.update(2461200.5,[0,0,0],'detailed')
  s.layer.setPopulation('trans-neptunian');s.layer.update(2461200.5,[0,0,0],'detailed');expect(s.worker.requests.filter(r=>r.type==='evaluate')).toHaveLength(1)
  complete(s);expect(s.layer.diagnostics().ignoredResponses).toBe(1);expect(s.layer.diagnostics().drawnCount).toBe(0)
  s.layer.update(2461200.5,[0,0,0],'detailed');s.layer.invalidateEpoch();complete(s);expect(s.layer.diagnostics().ignoredResponses).toBe(2)
  expect(s.layer.diagnostics().displayedJdTdb).toBeNull();s.layer.dispose()
 })
 it('preserves deterministic source indexes through LOD and camera-relative projected picking',()=>{
  const s=setup();s.layer.setPopulation('asteroid-belt');s.layer.update(2461200.5,[0,0,0],'efficient');complete(s)
  expect(populationQualityStride('efficient')).toBe(6);expect(s.layer.diagnostics().drawnCount).toBe(1)
  s.layer.setSelected(9);expect(s.layer.diagnostics().drawnCount).toBe(2);expect(s.scene.children[0].geometry.getAttribute('selected').array.slice(0,2)).toEqual(new Float32Array([0,1]))
  s.layer.setSelected(null);expect(s.layer.diagnostics().drawnCount).toBe(1)
  s.layer.update(2461200.5,[0,0,0],'detailed');expect(s.layer.diagnostics().drawnCount).toBe(3)
  const camera=new T.PerspectiveCamera(42,1,.1,100);camera.updateProjectionMatrix();camera.updateMatrixWorld()
  expect(s.layer.pick(camera,250,250,500,500)).toBe(2)
  s.layer.update(2461200.5,[1,0,0],'detailed');expect(s.layer.pick(camera,250,250,500,500)).toBe(6)
  s.layer.setPopulation(null);expect(s.layer.pick(camera,250,250,500,500)).toBeNull();s.layer.dispose()
 })
 it('terminates the worker, cancels requests and removes GPU resources on disposal and ignores late events',async()=>{
  const s=setup(),search=s.layer.query('Ceres'),late=s.worker.onmessage
  s.layer.dispose();await expect(search).rejects.toThrow(/closed/)
  expect(s.scene.children).toHaveLength(0);expect(s.worker.terminate).toHaveBeenCalledTimes(1);expect(s.layer.diagnostics().workerActive).toBe(false)
  late({data:{type:'loaded',requestId:1,summary}});s.layer.dispose();expect(s.worker.terminate).toHaveBeenCalledTimes(1)
 })
 it('contains corrupt transfer buffers and worker failures without keeping stale visible objects',()=>{
  const s=setup();s.layer.setPopulation('asteroid-belt');s.layer.update(2461200.5,[0,0,0],'detailed');complete(s,{positionsHigh:new Float32Array([NaN])})
  expect(s.layer.diagnostics().state).toBe('error');expect(s.layer.diagnostics().drawnCount).toBe(0);expect(s.worker.terminate).toHaveBeenCalledTimes(1);s.layer.dispose()
 })
})
