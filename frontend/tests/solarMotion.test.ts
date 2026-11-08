import {describe,it,expect,vi} from 'vitest'
import {bodyIds} from '../src/features/solar/solarContracts'
import {validateSolarMotion,evaluateSolarMotion,loadSolarMotion,solarMotionContains,solarMotionNeedsRefresh} from '../src/features/solar/solarMotion'

const start=Date.parse('2026-10-28T00:00:00Z'),step=3600000
function fixture(){return {schema:'oras.solar-motion.v1',epoch:new Date(start).toISOString(),origin:'Sun center (10)',frame:'ICRF',units:'AU,AU/s',source:{id:'jpl_de442s_local',release:'test',sha256:'a'.repeat(64)},coverage:{start:new Date(start-step).toISOString(),end:new Date(start+step*3).toISOString()},sampled_coverage:{start:new Date(start).toISOString(),end:new Date(start+step*2).toISOString()},sampling:{step_seconds:3600,interpolation:'cubic-hermite',max_position_error_km:.1,qualification_points_per_segment:3,qualification:'fixture'},tracks:bodyIds.map((id,index)=>({id,ephemeris_target:['10','199','299','399','4','5','6','7','8'][index],position_reference:id==='mars'?'Mars system barycenter':id,samples:[0,1,2].map(t=>({epoch:new Date(start+t*step).toISOString(),jd_tdb:2461341.5+t/24,position_au:[id==='sun'?0:t,0,0],velocity_au_s:[id==='sun'?0:1/3600,0,0]}))}))}}

describe('continuous JPL Solar interpolation',()=>{
 it('evaluates real position/velocity Hermite segments deterministically in both directions',()=>{
  const motion=validateSolarMotion(fixture())
  expect(evaluateSolarMotion(motion,start+step*.5).positions.earth[0]).toBeCloseTo(.5,8)
  expect(evaluateSolarMotion(motion,start+step*1.5).positions.earth[0]).toBeCloseTo(1.5,8)
  expect(evaluateSolarMotion(motion,start).positions.earth).toEqual([0,0,0])
  expect(evaluateSolarMotion(motion,start+step*2).positions.earth).toEqual([2,0,0])
  expect(evaluateSolarMotion(motion,start+step).positions.sun).toEqual([0,0,0])
 })
 it('rejects wrong targets, frame/source, broken samples and extrapolation',()=>{
  const motion=validateSolarMotion(fixture())
  expect(()=>evaluateSolarMotion(motion,start-1)).toThrow()
  expect(()=>evaluateSolarMotion(motion,start+step*2+1)).toThrow()
  for(const mutate of [(f:any)=>f.tracks[4].ephemeris_target='499',(f:any)=>f.frame='ecliptic',(f:any)=>f.tracks[1].samples[1].jd_tdb=0,(f:any)=>f.tracks[1].samples[1].position_au[0]=NaN,(f:any)=>f.tracks[0].samples[1].position_au[0]=1,(f:any)=>f.sampled_coverage.end=new Date(start+step*4).toISOString()]){
   const data=fixture();mutate(data);expect(()=>validateSolarMotion(data)).toThrow()
  }
 })
 it('refreshes near travel-direction bounds only and identifies unusable windows',()=>{
  const motion=validateSolarMotion(fixture())
  expect(solarMotionContains(motion,start+step)).toBe(true)
  expect(solarMotionContains(motion,start-1)).toBe(false)
  expect(solarMotionNeedsRefresh(motion,start+step,60)).toBe(false)
  expect(solarMotionNeedsRefresh(motion,start+step*2-1000,60)).toBe(true)
  expect(solarMotionNeedsRefresh(motion,start+1000,-60)).toBe(true)
  expect(solarMotionNeedsRefresh(motion,start+1000,60)).toBe(false)
 })
 it('rejects an unknown target even when its target identifier is also absent',()=>{
  const f:any=fixture();f.tracks[0].id='fiction';delete f.tracks[0].ephemeris_target
  expect(()=>validateSolarMotion(f)).toThrow()
 })
 it('uses the same millisecond epoch for emitted time and interpolated coordinates',()=>{
  const m=validateSolarMotion(fixture()),fractional=evaluateSolarMotion(m,start+123.987)
  expect(fractional).toEqual(evaluateSolarMotion(m,Date.parse(fractional.epoch)))
 })
 it('validates request epoch and honors cancellation',async()=>{
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>fixture()}),controller=new AbortController()
  const motion=await loadSolarMotion(new Date(start).toISOString(),controller.signal,fetcher)
  expect(motion.tracks).toHaveLength(9)
  await expect(loadSolarMotion(new Date(start+1).toISOString(),controller.signal,fetcher)).rejects.toThrow()
  controller.abort();await expect(loadSolarMotion(new Date(start).toISOString(),controller.signal,fetcher)).rejects.toThrow()
 })
})
