import {readFileSync} from 'node:fs'
import {describe,it,expect} from 'vitest'
import {validateSolarSmallBodies,propagateSmallBody,smallBodyEpochAvailable,writeSmallBodyPositions} from '../src/features/solar/solarSmallBodies'
const raw=JSON.parse(readFileSync(new URL('../../backend/app/data/solar_small_bodies.json',import.meta.url),'utf8'))

describe('source-backed approximate asteroid population',()=>{
 it('preserves all acquired identities and bounds independently from visual shape',()=>{
  const p=validateSolarSmallBodies(raw)
  expect(p.bodies).toHaveLength(2049)
  expect(p.bodies.find(b=>b.designation==='433')?.source_id).toBe('20000433')
  expect(smallBodyEpochAvailable(p,2461341.5)).toBe(true)
  expect(smallBodyEpochAvailable(p,2461380.5+1e-5)).toBe(false)
  expect(smallBodyEpochAvailable(p,2461020.5-1e-5)).toBe(false)
 })
 it('matches independently acquired Horizons within the disclosed sampled two-body differences',()=>{
  const p=validateSolarSmallBodies(raw)
  for(const check of raw.qualification.comparisons){
   const body=p.bodies.find(b=>b.source_id===check.source_id)!,position=propagateSmallBody(body,check.jd_tdb)
   const error=Math.hypot(...position.map((v,i)=>(v-check.position_au[i])*149597870.7))
   expect(error).toBeLessThan(check.error_km+.01)
   if(check.jd_tdb===body.elements.epoch_jd_tdb)expect(error).toBeLessThan(5)
  }
 })
 it('moves continuously in both time directions and writes reusable population buffers',()=>{
  const p=validateSolarSmallBodies(raw),body=p.bodies[0],day=2461341.5
  const before=propagateSmallBody(body,day-1),current=propagateSmallBody(body,day),after=propagateSmallBody(body,day+1)
  expect(before).not.toEqual(after);expect(propagateSmallBody(body,day)).toEqual(current)
  expect(Math.hypot(...current.map((v,i)=>v-(before[i]+after[i])/2))).toBeLessThan(.0001)
  const output=new Float32Array(p.population_count*3)
  expect(writeSmallBodyPositions(p,day,output)).toBe(2048)
  expect(output[0]).toBeCloseTo(current[0],6)
  expect(()=>propagateSmallBody(body,day+365)).toThrow(/coverage/)
  expect(()=>writeSmallBodyPositions(p,day+365,output)).toThrow(/coverage/)
 })
 it('rejects corrupt element frames, malformed IDs, unsupported eccentricity and false accuracy claims',()=>{
  for(const mutate of [(x:any)=>x.frame='ICRF',(x:any)=>x.bodies[0].source_id=20000001,(x:any)=>x.bodies[0].elements.e=.99,(x:any)=>x.bodies[0].elements.a_au=NaN,(x:any)=>x.model.population_wide_accuracy_qualified=true,(x:any)=>x.bodies[0].elements.epoch_jd_tdb++]){
   const data=structuredClone(raw);mutate(data);expect(()=>validateSolarSmallBodies(data)).toThrow()
  }
 })
 it('rejects missing orbital elements before they can produce NaN geometry',()=>{
  for(const field of ['e','i_rad','om_rad','w_rad','ma_rad','n_rad_day']){
   const data=structuredClone(raw);delete data.bodies[0].elements[field]
   expect(()=>validateSolarSmallBodies(data)).toThrow()
  }
 })
})
