import {readFileSync} from 'node:fs'
import {describe,it,expect} from 'vitest'
import {validateSolarPopulations,propagatePopulationBody,evaluatePopulation,searchPopulation,createPopulationWorkerHandler} from '../src/features/solar/solarPopulations'
const fixture=JSON.parse(readFileSync(new URL('../../backend/tests/fixtures/solar_populations_reference.json',import.meta.url),'utf8'))
function pack(){return {schema:'oras.solar-populations.v1',release:fixture.release,pack_sha256:fixture.source_sha256,acquired_utc:'2026-11-03T00:00:00Z',catalog:'JPL SBDB',origin:'Sun center (10)',element_frame:'ECLIPJ2000',output_frame:'ICRF',time_scale:'TDB',position_units:'AU',velocity_units:'AU/s',body_count:fixture.bodies.length,bodies:structuredClone(fixture.bodies),model:structuredClone(fixture.model),selection:'Small independent numerical reference fixture',groups:['main-belt','trans-neptunian','comets-numbered','comets-unbound'].map(id=>({id,population:'comets',available:100,included:1,limit:1,selection:{sort:'H'}})),sources:fixture.source_records,terms:{publisher:'NASA/JPL SSD'},qualification:{reference:'Sampled Horizons comparisons only',comparisons:fixture.source_comparisons,max_comparison_error_km:57889.1038648388,max_velocity_error_km_s:.005123446144441577,reference_files:Object.keys(fixture.source_records)}}}

describe('bounded SBDB population worker contract',()=>{
 it('matches Python analytic propagation at all115 independent source reference epochs',()=>{
  const p=validateSolarPopulations(pack())
  for(const sample of fixture.python_propagation){const b=p.bodies.find(b=>b.source_id===sample.source_id)!,state=propagatePopulationBody(b,sample.jd_tdb)
   state.positionAu.forEach((v,i)=>expect(Math.abs(v-sample.position_au[i])).toBeLessThan(1e-10))
   state.velocityAuS.forEach((v,i)=>expect(Math.abs(v-sample.velocity_au_s[i])).toBeLessThan(1e-16))
  }
 })
 it('keeps exact sourceIndex identity through category search, details and transferred float splitting',()=>{
  const p=validateSolarPopulations(pack()),results=searchPopulation(p,'20136199','trans-neptunian')
  expect(results).toHaveLength(1);expect(results[0].body.source_id).toBe('20136199')
  expect(searchPopulation(p,'20136199','asteroid-belt')).toHaveLength(0)
  expect(searchPopulation(p,'<script>')).toEqual([])
  const b=results[0].body,e=evaluatePopulation(p,b.elements.epoch_jd_tdb,'trans-neptunian'),vertex=Array.from(e.indices).indexOf(results[0].sourceIndex)
  expect(vertex).toBeGreaterThanOrEqual(0)
  const exact=propagatePopulationBody(b,e.jdTdb)
  for(let axis=0;axis<3;axis++)expect(Math.abs(e.positionsHigh[vertex*3+axis]+e.positionsLow[vertex*3+axis]-exact.positionAu[axis])).toBeLessThan(1e-12)
  expect(p.bodies[e.indices[vertex]].source_id).toBe('20136199')
 })
 it('never propagates comets, unsupported conics or out-of-coverage catalog records',()=>{
  const p=validateSolarPopulations(pack()),comet=p.bodies.find(b=>b.source_id==='1000036')!
  expect(()=>propagatePopulationBody(comet,comet.elements.epoch_jd_tdb)).toThrow()
  expect(evaluatePopulation(p,2461200.5,'comets').availableCount).toBe(0)
  expect(evaluatePopulation(p,2500000).availableCount).toBe(0)
  expect(()=>evaluatePopulation(p,NaN)).toThrow()
  const b=structuredClone(p.bodies.find(b=>b.representation==='symbolic-approximate')!);b.elements.e=1.2
  expect(()=>propagatePopulationBody(b,b.elements.epoch_jd_tdb)).toThrow()
 })
 it('rejects identity, source frame, malformed elements, fabricated classes and false accuracy claims',()=>{
  for(const mutate of [(p:any)=>p.output_frame='ECLIPJ2000',(p:any)=>p.bodies[0].source_id=123,(p:any)=>p.bodies[0].elements.a_au=NaN,(p:any)=>p.bodies[0].dynamical_subclass='resonant',(p:any)=>p.model.population_wide_accuracy_qualified=true,(p:any)=>p.bodies[0].coverage.end_jd_tdb++,(p:any)=>p.bodies[1].source_id=p.bodies[0].source_id,(p:any)=>p.pack_sha256='0'.repeat(64)]){
   const p=pack();mutate(p);expect(()=>validateSolarPopulations(p)).toThrow()
  }
 })
 it('limits search to40 exact source records without main-thread catalog transfer',()=>{
  const raw=pack();raw.bodies=Array.from({length:80},(_,i)=>({...structuredClone(raw.bodies[0]),source_id:String(90000000+i)}));raw.body_count=80
  const p=validateSolarPopulations(raw),rows=searchPopulation(p,'');expect(rows).toHaveLength(40);expect(rows[39].sourceIndex).toBe(39)
 })
 it('discards stale load completions/errors after a newer load and keeps fixed request routing',async()=>{
  const sent:any[]=[],pending:Array<{resolve:(r:Response)=>void,reject:(e:Error)=>void}>=[]
  const fetcher=((url:string)=>{expect(url).toBe('/api/v1/solar-populations');return new Promise<Response>((resolve,reject)=>pending.push({resolve,reject}))}) as typeof fetch
  const h=createPopulationWorkerHandler((message)=>sent.push(message),fetcher)
  const old=h({type:'load',requestId:1}),latest=h({type:'load',requestId:2})
  pending[1].resolve(new Response(JSON.stringify(pack())));await latest
  pending[0].reject(Error('private old request error'));await old
  expect(sent.map(m=>m.requestId)).toEqual([2]);expect(sent[0].type).toBe('loaded');expect(sent[0].summary.bodies).toBeUndefined()
  await h({type:'detail',requestId:3,sourceIndex:0});expect(sent[1].body.source_id).toBe(fixture.bodies[0].source_id)
  await h({type:'detail',requestId:4,sourceIndex:999999});expect(sent[2].type).toBe('error');expect(sent[2].message).not.toContain('private')
 })
 it('suppresses an older successful load and drops the active catalog after failed reload',async()=>{
  const sent:any[]=[],pending:Array<(r:Response)=>void>=[]
  const fetcher=(()=>new Promise<Response>(resolve=>pending.push(resolve))) as typeof fetch
  const h=createPopulationWorkerHandler(message=>sent.push(message),fetcher)
  const old=h({type:'load',requestId:1}),latest=h({type:'load',requestId:2})
  pending[1](new Response(JSON.stringify(pack())));await latest
  pending[0](new Response(JSON.stringify(pack())));await old
  expect(sent.map(m=>m.requestId)).toEqual([2])
  const failed=h({type:'load',requestId:3});pending[2](new Response('unavailable',{status:503}));await failed
  await h({type:'search',requestId:4,query:''})
  expect(sent.slice(1).map(m=>m.type)).toEqual(['error','error'])
 })
 it('transfers position buffers without losing stable source indices or source metadata',async()=>{
  const replies:any[]=[]
  const h=createPopulationWorkerHandler((message,transfer)=>replies.push(structuredClone(message,{transfer})),(async()=>new Response(JSON.stringify(pack()))) as typeof fetch)
  await h({type:'load',requestId:1});await h({type:'evaluate',requestId:2,jdTdb:2461200.5,population:'asteroid-belt'})
  const r=replies[1];expect(r.type).toBe('evaluated');expect(r.availableCount).toBeGreaterThan(0);expect(r.positionsHigh.length).toBe(r.availableCount*3)
  await h({type:'detail',requestId:3,sourceIndex:r.indices[0]})
  expect(replies[2].body.source_id).toBe(fixture.bodies[r.indices[0]].source_id)
 })
})
