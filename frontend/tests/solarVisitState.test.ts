import {it,expect} from 'vitest'
import {readSolarVisitState} from '../src/features/planet/solarVisitState'
it('restores only finite same-epoch source camera and admitted display preferences',()=>{const s={schema:'oras.solar-return.v1',epoch:'2026-02-28T00:00:00Z',camera:[1,2,3],target:[0,0,0],cameraUp:[0,0,1],cameraView:'custom',closeView:false,near:.001,preferences:{overview:'inner',sizeMode:'cinematic',quality:'efficient',orbits:true,effects:true,belt:false,beltDensity:2400}};expect(readSolarVisitState(s,s.epoch)).toEqual(s);expect(readSolarVisitState({...s,cameraUp:[.15,0,1]},s.epoch)).not.toBe(null);expect(readSolarVisitState({...s,closeView:undefined},s.epoch)).toBe(null);expect(readSolarVisitState(s,'2027-01-01T00:00:00Z')).toBe(null);expect(readSolarVisitState({...s,camera:[NaN,0,1]},s.epoch)).toBe(null);expect(readSolarVisitState({...s,cameraUp:[0,0,0]},s.epoch)).toBe(null);expect(readSolarVisitState({...s,preferences:{...s.preferences,quality:'imaginary'}},s.epoch)).toBe(null)})

it('preserves admitted exploration choices and rejects corrupt restored controls',()=>{
 const s={schema:'oras.solar-return.v1',epoch:'2026-10-28T00:00:00Z',camera:[1,2,3],target:[0,0,0],cameraUp:[0,0,1],cameraView:'custom',closeView:false,near:.001,preferences:{overview:'inner',sizeMode:'physical',quality:'balanced',orbits:true,effects:true,belt:false,beltDensity:2400,navigation:'free',asteroids:true,rate:-3600}}
 expect(readSolarVisitState(s,s.epoch)).toEqual(s)
 for(const patch of [{navigation:'warp'},{asteroids:'yes'},{rate:Infinity},{rate:1e9}])expect(readSolarVisitState({...s,preferences:{...s.preferences,...patch}},s.epoch)).toBe(null)
})
