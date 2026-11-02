import {it,expect} from 'vitest'
import {readSolarVisitState} from '../src/features/planet/solarVisitState'
it('restores only finite same-epoch source camera and admitted display preferences',()=>{const s={schema:'oras.solar-return.v1',epoch:'2026-02-28T00:00:00Z',camera:[1,2,3],target:[0,0,0],cameraUp:[0,0,1],cameraView:'custom',closeView:false,near:.001,preferences:{overview:'inner',sizeMode:'cinematic',quality:'efficient',orbits:true,effects:true,belt:false,beltDensity:2400}};expect(readSolarVisitState(s,s.epoch)).toEqual(s);expect(readSolarVisitState({...s,cameraUp:[.15,0,1]},s.epoch)).not.toBe(null);expect(readSolarVisitState({...s,closeView:undefined},s.epoch)).toBe(null);expect(readSolarVisitState(s,'2027-01-01T00:00:00Z')).toBe(null);expect(readSolarVisitState({...s,camera:[NaN,0,1]},s.epoch)).toBe(null);expect(readSolarVisitState({...s,cameraUp:[0,0,0]},s.epoch)).toBe(null);expect(readSolarVisitState({...s,preferences:{...s.preferences,quality:'imaginary'}},s.epoch)).toBe(null)})

it('preserves admitted exploration choices and rejects corrupt restored controls',()=>{
 const s={schema:'oras.solar-return.v1',epoch:'2026-10-28T00:00:00Z',camera:[1,2,3],target:[0,0,0],cameraUp:[0,0,1],cameraView:'custom',closeView:false,near:.001,preferences:{overview:'inner',sizeMode:'physical',quality:'balanced',orbits:true,effects:true,belt:false,beltDensity:2400,navigation:'free',asteroids:true,rate:-3600}}
 expect(readSolarVisitState(s,s.epoch)).toEqual(s)
 for(const patch of [{navigation:'warp'},{asteroids:'yes'},{rate:Infinity},{rate:1e9}])expect(readSolarVisitState({...s,preferences:{...s.preferences,...patch}},s.epoch)).toBe(null)
})

import {rebaseSolarVisitState} from '../src/features/planet/solarVisitState'
it('preserves the selected-body camera offset when returning at an advanced epoch',()=>{
 const view={camera:[5,2,3],target:[4,0,0],anchor:{id:'jupiter',position:[4,0,0]}} as any
 const next=rebaseSolarVisitState(view,[{source_id:'jupiter',position_au:[4.1,.2,.3]}] as any)
 expect(next.camera).toEqual([5.1,2.2,3.3]);expect(next.target).toEqual([4.1,.2,.3]);expect(view.camera).toEqual([5,2,3])
 expect(rebaseSolarVisitState({...view,anchor:undefined},[])).toEqual({...view,anchor:undefined})
})
it('keeps a free camera absolute even when an older return state contains a selected-body anchor',()=>{
 const state={camera:[5,2,3],target:[4,0,0],preferences:{navigation:'free'},anchor:{id:'jupiter',position:[4,0,0]}} as any
 expect(rebaseSolarVisitState(state,[{source_id:'jupiter',position_au:[9,8,7]}])).toBe(state)
})
