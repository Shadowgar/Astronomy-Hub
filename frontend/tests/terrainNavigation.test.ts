import {afterEach,describe,expect,it} from 'vitest'
import {terrainMoonReturn} from '../src/features/terrain/terrainContracts'
import {planetModeReturn} from '../src/features/planet/planetContracts'
import {solarExit} from '../src/features/solar/solarNavigation'
import {terrainNativeExit} from '../src/features/terrain/terrainNavigation'
import {useRuntimeProductState} from '../src/features/runtime/productState'

const epoch='2026-10-28T00:00:00.000Z'
const initial=useRuntimeProductState.getState()
afterEach(()=>useRuntimeProductState.setState(initial))
describe('terrain destinations use the established native handoff',()=>{
 it.each(['manifest pending','manifest failed','GPU initialization failed'])('retains direct observer intent when %s, without a mounted renderer',()=>{
  useRuntimeProductState.setState({observer:{lat:41,lon:-79,elevationM:457},views:{},selection:null})
  const exit=terrainNativeExit(undefined,'earth',epoch,'?date='+epoch+'&lat=40&lng=-80&elev=400',false)
  expect(exit.state).toMatchObject({n1Center:true,n1View:{mode:'earth',utc:epoch,observer:{lat:40,lon:-80,elevationM:400},camera:{latitudeRad:40*Math.PI/180,longitudeRad:-80*Math.PI/180}}})
  expect(new URL(exit.path,'http://local').searchParams.get('lat')).toBe('40')
 })
 it('rejects malformed direct observer coordinates through the canonical intent validator',()=>{
  useRuntimeProductState.setState({observer:{lat:41,lon:-79,elevationM:457},views:{},selection:null})
  const exit=terrainNativeExit(undefined,'earth',epoch,'?lat=400&lng=-80&elev=400',false)
  expect((exit.state as any).n1View.observer).toEqual({lat:41,lon:-79,elevationM:457})
 })
 it('provides Earth a matching observer and centered camera for a direct terrain bookmark',()=>{
  const native=terrainMoonReturn(null,epoch,undefined,'?lat=40&lng=-80&elev=400')
  const destination=planetModeReturn((native.state as any).planetReturn,'earth',epoch)
  // URL alone carries no native camera. This was reproduced in Windows Edge:
  // the correct observer URL arrived with an unrelated Earth camera/observer.
  expect(destination.state).toBeUndefined()
  const exit=solarExit(destination.path,epoch,destination.state,{},null,false,{lat:40,lon:-80,elevationM:400})
  expect(exit.state).toMatchObject({n1Center:true,n1View:{mode:'earth',utc:epoch,observer:{lat:40,lon:-80,elevationM:400},camera:{latitudeRad:40*Math.PI/180,longitudeRad:-80*Math.PI/180}}})
 })
 it('preserves the prior native Sky camera and exact epoch through the nested Moon journey',()=>{
  const view={mode:'sky',observer:{lat:40,lon:-80,elevationM:400},utc:'2026-10-27T00:00:00.000Z',live:false,elevationSource:'provided',camera:{projection:2,fovRad:1,yawRad:2,pitchRad:.4,rollRad:0,landscapeVisible:true}}
  const returned={path:'/planetary-system/earth',state:{systemReturn:{path:'/solar-system',state:{solarReturn:{path:'/sky-engine?lat=40&lng=-80&elev=400',state:{n1View:view}}}}}}
  const destination=planetModeReturn(returned,'sky',epoch)
  const exit=solarExit(destination.path,epoch,destination.state,{},null,true,{lat:40,lon:-80,elevationM:400})
  expect((exit.state as any).n1View.camera).toEqual(view.camera)
  expect((exit.state as any).n1View.utc).toBe(epoch)
  expect((exit.state as any).n1View.observer).toEqual(view.observer)
 })
})
