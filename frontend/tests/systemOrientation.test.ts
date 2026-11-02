import {describe,it,expect} from 'vitest'
import {evaluateSystem,validateSystemSnapshot} from '../src/features/systems/systemContracts'
import {interpolateOrientation} from '../src/features/systems/systemOrientation'
import {systemFixture} from './planetarySystems.test'
import type {SystemBodyOrientation,SystemSnapshot} from '../src/features/systems/systemTypes'

const fixture=():SystemSnapshot=>{
 const s=structuredClone(systemFixture())
 s.orientations={earth:{body_id:'earth',naif_id:'399',from_frame:'body-fixed',to_frame:'ICRF',body_fixed_frame:'ITRS',quaternion_order:'xyzw',interpolation:'shortest-slerp',model:'Fixture, not production science',source:{id:'fixture',url:'https://example.test/frame',sha256:'a'.repeat(64)},max_sampled_interpolation_error_arcsec:0,accuracy:'Fixture only',samples:[{epoch:s.epoch,jd_tdb:s.time.jd_tdb,quaternion:[0,0,0,1]},{epoch:s.sampled_coverage.end,jd_tdb:s.time.jd_tdb+60/86400,quaternion:[0,0,Math.SQRT1_2,Math.SQRT1_2]}]}}
 return s
}

describe('source body-frame interpolation',()=>{
 it('returns source endpoints and the shortest rotation at the same UTC as position',()=>{
  const s=fixture(),start=Date.parse(s.epoch),track=s.orientations!.earth
  expect(interpolateOrientation(track,start)).toEqual([0,0,0,1])
  const result=evaluateSystem(validateSystemSnapshot(s,'earth',s.epoch),start+30000)
  expect(result.orientations.earth[2]).toBeCloseTo(Math.sin(Math.PI/8),12)
  expect(result.orientations.earth[3]).toBeCloseTo(Math.cos(Math.PI/8),12)
  expect(result.positions.moon[0]).toBeCloseTo(900,2)
  expect(interpolateOrientation(track,Date.parse(s.sampled_coverage.end))).toEqual(track.samples[1].quaternion)
  track.samples[1].quaternion=track.samples[1].quaternion.map(x=>-x) as [number,number,number,number]
  expect(interpolateOrientation(track,start+30000)[2]).toBeCloseTo(Math.sin(Math.PI/8),12)
 })
 it('rejects extrapolation and does not invent orientation for a legacy snapshot',()=>{
  const s=fixture(),track=s.orientations!.earth
  for(const t of [Date.parse(s.epoch)-1,Date.parse(s.sampled_coverage.end)+1,NaN])expect(()=>interpolateOrientation(track,t)).toThrow()
  expect(evaluateSystem(systemFixture(),Date.parse(s.epoch)).orientations).toEqual({})
 })
 it('rejects malformed quaternions, body/frame identity, coverage, gaps and mismatched time scales',()=>{
  const mutations:Array<(t:SystemBodyOrientation)=>void>=[t=>{t.samples[0].quaternion=[0,0,0,0]},t=>{t.samples[0].quaternion[0]=NaN},t=>{t.samples[0].quaternion[3]=2},t=>{t.naif_id='3'},t=>{t.body_fixed_frame='IAU_EARTH'},t=>{t.to_frame='J2000' as 'ICRF'},t=>{t.samples[1].epoch=t.samples[0].epoch},t=>{t.samples[0].epoch='2026-10-23T00:00:01Z'},t=>{t.samples[1].epoch='2026-10-23T02:00:00Z'},t=>{t.samples[1].jd_tdb+=1},t=>{t.samples.forEach(sample=>sample.jd_tdb+=1)},t=>{t.source.sha256='bad'},t=>{t.max_sampled_interpolation_error_arcsec=1}]
  for(const change of mutations){const s=fixture();change(s.orientations!.earth);expect(()=>validateSystemSnapshot(s,'earth',s.epoch)).toThrow()}
 })
 it('rejects unknown body entries and invalid orientation containers',()=>{
  for(const value of [null,[],{unknown:fixture().orientations!.earth}]){const s=fixture();s.orientations=value as never;expect(()=>validateSystemSnapshot(s,'earth',s.epoch)).toThrow()}
 })
})

const spkFixture=():SystemSnapshot=>{
 const s=fixture();s.sampling.max_position_error_km=.01;s.system_id='mars';s.parent={...s.parent,id:'mars',name:'Mars',naif_id:'499'};s.origin='Mars center (499)'
 s.satellites=[{...s.satellites[0],id:'phobos',name:'Phobos',naif_id:'401',surface:{available:false,destination:null}}];s.tracks[0].id='phobos'
 s.orientations={mars:{...s.orientations!.earth,body_id:'mars',naif_id:'499',body_fixed_frame:'IAU_MARS'},phobos:{...structuredClone(s.orientations!.earth),body_id:'phobos',naif_id:'401',body_fixed_frame:'IAU_PHOBOS',model_id:'pds-gaskell-phobos-pck00006',source:{id:'Phobos frame fixture',url:'https://example.test/phobos',sha256:'8aacb5dff544bed1f7cf0659296a1ca75896128a0a729447be0a4deb4de4ecb4'}}}
 s.source={id:'jpl_satellite_spk_local',release:'fixture',sha256:'a'.repeat(64),url:'https://example.test/',transition:'Fixture physical center chain',coverage_start_jd_tdb:s.time.jd_tdb,coverage_end_jd_tdb:s.time.jd_tdb+1,series:[{target_id:'499',center_id:'10',source_sha256:'b'.repeat(64),source_url:'https://example.test/'},{target_id:'401',center_id:'499',source_sha256:'b'.repeat(64),source_url:'https://example.test/'}],kernels:[{id:'mars',file:'mars.bsp',url:'https://example.test/mars.bsp',sha256:'b'.repeat(64),bytes:1000}]}
 return s
}
describe('extended SPK source admission',()=>{
 it('admits a complete physical-center kernel and frame contract',()=>{const s=spkFixture();expect(validateSystemSnapshot(s,'mars',s.epoch).source.id).toBe('jpl_satellite_spk_local')})
 it('rejects missing provenance, mismatched kernel hashes and source coverage',()=>{
  const changes:Array<(s:SystemSnapshot)=>void>=[s=>{s.source.kernels=[]},s=>{s.source.kernels![0].sha256='c'.repeat(64)},s=>{s.source.kernels![0].bytes=Infinity},s=>{s.source.kernels![0].file='../source.bsp'},s=>{s.source.kernels!.push(s.source.kernels![0])},s=>{s.source.coverage_start_jd_tdb=NaN},s=>{s.source.coverage_end_jd_tdb=s.time.jd_tdb-1},s=>{delete s.orientations},s=>{delete s.orientations!.phobos},s=>{s.sun_track.samples[1].jd_tdb+=3}]
  for(const mutate of changes){const s=spkFixture();mutate(s);expect(()=>validateSystemSnapshot(s,'mars',s.epoch)).toThrow()}
 })
})

describe('position and orientation share the same source time',()=>{
 it('rejects a shifted TDB position sample even when UTC and ordering remain valid',()=>{
  const s=spkFixture();s.tracks[0].samples[1].jd_tdb+=60/86400
  expect(()=>validateSystemSnapshot(s,'mars',s.epoch)).toThrow()
 })
 it('rejects a stated SPK interpolation error above its admitted source threshold',()=>{
  const s=spkFixture();s.sampling.max_position_error_km=1000
  expect(()=>validateSystemSnapshot(s,'mars',s.epoch)).toThrow()
 })
 it('rejects an unqualified position interpolation gap',()=>{
  const s=spkFixture();s.tracks[0].samples[1].epoch='2026-10-23T00:20:00Z';s.tracks[0].samples[1].jd_tdb=s.time.jd_tdb+1200/86400
  expect(()=>validateSystemSnapshot(s,'mars',s.epoch)).toThrow()
 })
})
