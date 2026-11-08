import {describe,expect,it} from 'vitest'
import {validateMissionState,validateMissionTrajectory} from '../src/features/missions/missionContracts'

const start='2015-07-14T00:00:00.000Z',end='2015-07-14T00:00:10.000Z'
const jd=(utc:string)=>Date.parse(utc)/86400000+2440587.5+69.184/86400
function fixture(){
 const knots=[start,end].map(epoch=>({epoch,jd_tdb:jd(epoch),position:[1,2,3],velocity:[.000001,0,0]}))
 const segment={id:'pluto-encounter',start,end,quality:'reconstructed',label:'Independent review fixture',target_ids:['pluto']}
 return {
  entry:{id:'newhorizons',naif_id:'-98',segments:[{...segment}],targets:[{id:'pluto',naif_id:'999',appearance_id:'pluto'}]},
  state:{schema:'oras.mission-state.v1',mission_id:'newhorizons',epoch:start,jd_tdb:jd(start),frame:'ICRF',origin:'sun',position_units:'AU',velocity_units:'AU/s',segment_id:segment.id,quality:'reconstructed',source_label:'Independent review fixture',craft:{id:'newhorizons',naif_id:'-98',position:[1,2,3],velocity:[.000001,0,0]},bodies:[{id:'pluto',name:'Pluto',naif_id:'999',appearance_id:'pluto',radius_km:1188.3,position:[1,2,3],velocity:[.000001,0,0]}],tracks:[],coverage:[segment],interpolation:{max_sampled_position_error_km:1,max_sampled_velocity_error_km_s:.01,physical_uncertainty:'not supplied'},attitude:{status:'unavailable',description:'Illustrative'},samples:{start,end,step_seconds:null,craft:knots,bodies:[{id:'pluto',samples:structuredClone(knots)}]}},
 }
}
const admit=(f:ReturnType<typeof fixture>)=>validateMissionState(f.state,'newhorizons',start,f.entry as any)
describe('independent mission source admission regressions',()=>{
 it('admits the production-shaped historical fixture',()=>expect(()=>admit(fixture())).not.toThrow())
 it('rejects target tangent intervals that disagree with published UTC',()=>{
  const f=fixture();f.state.samples.bodies[0].samples[1].jd_tdb+=100/86400
  expect(()=>admit(f)).toThrow()
 })
 it('rejects target TDB epochs shifted away from the spacecraft at identical UTC labels',()=>{
  const f=fixture();for(const knot of f.state.samples.bodies[0].samples)knot.jd_tdb+=40/86400
  expect(()=>admit(f)).toThrow()
 })
 it('does not widen the catalog coverage from an inconsistent state response',()=>{
  const f=fixture();f.state.coverage[0].end='2015-07-15T00:00:00.000Z'
  expect(()=>admit(f)).toThrow()
 })
 it('rejects a path from an unrelated source segment',()=>{
  const f=fixture();(f.state.tracks as unknown[]).push({segment_id:'wrong-mission-segment',quality:'reconstructed',source_label:'Wrong cached path',start,end,points:[{epoch:start,position:[1,0,0]},{epoch:end,position:[2,0,0]}]})
  expect(()=>admit(f)).toThrow()
 })
 it('binds the trajectory envelope to its mission and inertial frame',()=>{
  const f=fixture(),track={segment_id:'pluto-encounter',quality:'reconstructed',source_label:'Independent fixture',start,end,points:[{epoch:start,position:[1,0,0]},{epoch:end,position:[2,0,0]}]}
  const envelope={schema:'oras.mission-trajectory.v1',mission_id:'newhorizons',frame:'ICRF',origin:'sun',position_units:'AU',tracks:[track],point_count:2}
  expect(validateMissionTrajectory(envelope,f.entry as any)).toEqual([track])
  for(const [key,value] of [['mission_id','voyager1'],['frame','ECLIPJ2000'],['origin','earth'],['position_units','km']]){
   expect(()=>validateMissionTrajectory({...envelope,[key]:value},f.entry as any)).toThrow()
  }
  expect(()=>validateMissionTrajectory({...envelope,point_count:4},f.entry as any)).toThrow()
 })
})
