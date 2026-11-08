import {expect,it} from 'vitest'
import {validateSolarDestinations,evaluateSolarDestinations,destinationNeedsRefresh} from '../src/features/solar/solarDestinations'

const start=Date.parse('2026-10-27T04:00:00Z'),epoch=new Date(start).toISOString(),end=new Date(start+86400000).toISOString(),jd=start/86400000+2440587.5+.0008
function fixture(){return{schema:'oras.solar-destinations.v1',epoch,jd_tdb:jd,frame:'ICRF',origin:'Sun center (10)',units:'AU; AU/s',corrections:'geometric; no light-time or aberration',source:{id:'jpl_solar_destinations_local',release:'test',sha256:'a'.repeat(64),url:'https://ssd.jpl.nasa.gov/'},qualification:'Test fixture only',pluto_barycenter:{position_au:[30.001,0,0],velocity_au_s:[0,0,0]},orientations:{},bodies:[{id:'pluto',name:'Pluto',classification:'dwarf-planet',identity:{catalog:'JPL-SPK',source_id:'999',model:'SPK',reference:'Pluto physical center'},status:'qualified',reason:null,radius_km:1188.3,radius_source:'NASA reference',state:{position_au:[30,0,0],velocity_au_s:[1/86400,0,0]},coverage:{start:epoch,end},sampled_coverage:{start:epoch,end},source:{id:'plu060',url:'https://naif.jpl.nasa.gov/',sha256:'b'.repeat(64),solution:'PLU060',uncertainty:'Source model uncertainty'},orientation_available:false,surface_orientation_status:'unavailable',eccentricity:null}],tracks:[{id:'pluto',interpolation:'cubic-hermite',step_seconds:86400,max_sampled_error_km:.04,samples:[0,1].map(t=>({epoch:t?end:epoch,jd_tdb:jd+t,position_au:[30+t,0,0],velocity_au_s:[1/86400,0,0]}))}]}}
it('interpolates precise destination vectors at the shared UTC in either direction, without barycenter substitution',()=>{
 const pack=validateSolarDestinations(fixture(),epoch)
 expect(evaluateSolarDestinations(pack,start+43200000).positions.pluto).toEqual([30.5,0,0])
 expect(evaluateSolarDestinations(pack,start).positions.pluto).toEqual([30,0,0])
 expect(evaluateSolarDestinations(pack,start+86400000).positions.pluto).toEqual([31,0,0])
 expect(evaluateSolarDestinations(pack,start-1).positions.pluto).toBeUndefined()
 expect(evaluateSolarDestinations(pack,start+86400001).positions.pluto).toBeUndefined()
})
it('rejects identity, frame, non-finite state, broken coverage and mismatched track windows',()=>{
 for(const change of [(s:any)=>s.bodies[0].identity.source_id='9',(s:any)=>s.frame='ECLIPJ2000',(s:any)=>s.bodies[0].state.position_au[0]=NaN,(s:any)=>s.tracks[0].samples[1].epoch=epoch,(s:any)=>s.tracks[0].samples[1].jd_tdb+=1,(s:any)=>s.bodies[0].sampled_coverage.end='2030-01-01T00:00:00Z',(s:any)=>s.tracks.push(s.tracks[0]),(s:any)=>s.bodies[0].orientation_available=true]){
  const s=fixture();change(s);expect(()=>validateSolarDestinations(s,epoch)).toThrow()
 }
 expect(()=>validateSolarDestinations(fixture(),end)).toThrow()
})
it('keeps explicitly unavailable destinations out of rendering and does not fabricate a radius',()=>{
 const s:any=fixture();s.bodies[0]={...s.bodies[0],status:'unavailable',state:null,reason:'Outside source coverage',sampled_coverage:null,radius_km:null,radius_source:null};s.tracks=[];s.pluto_barycenter=null
 const pack=validateSolarDestinations(s,epoch);expect(evaluateSolarDestinations(pack,start).positions).toEqual({});expect(pack.bodies[0].radius_km).toBeNull()
})
it('prefetches before a four-day window expires during fast forward or reverse playback',()=>{
 const coverage={start:new Date(start-2*86400000).toISOString(),end:new Date(start+2*86400000).toISOString()}
 expect(destinationNeedsRefresh(coverage,start+1.5*86400000,86400)).toBe(true)
 expect(destinationNeedsRefresh(coverage,start,-86400)).toBe(false)
 expect(destinationNeedsRefresh(coverage,start,86400)).toBe(false)
 expect(destinationNeedsRefresh(coverage,start-1.5*86400000,-86400)).toBe(true)
 expect(destinationNeedsRefresh(coverage,start+2*86400000-5000,0)).toBe(false)
})
