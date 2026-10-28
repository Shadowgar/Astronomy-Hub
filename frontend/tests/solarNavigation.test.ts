import {it,expect} from 'vitest'
import {solarExit} from '../src/features/solar/solarNavigation'
import type {NavigationState} from '../../packages/runtime-protocol/index.mjs'
const epoch='2026-10-28T00:00:00.000Z',sky:NavigationState={mode:'sky',utc:'2026-10-27T04:00:00.000Z',live:false,observer:{lat:41.321903,lon:-79.585394,elevationM:457},elevationSource:'provided',camera:{projection:2,fovRad:2,yawRad:0,pitchRad:.5,rollRad:0,landscapeVisible:true}}
it('converts a saved Sky view into an observer-centered Earth handoff at final Solar time',()=>{
 const result=solarExit('/earth?lat=0&lng=0&elev=0',epoch,{n1View:sky},{},null,true),view=result.state?.n1View as NavigationState,url=new URL(result.path,'http://local')
 expect(view.mode).toBe('earth');expect(view.observer).toEqual(sky.observer);expect(view.utc).toBe(epoch);expect(result.state?.n1Center).toBe(true)
 expect(url.searchParams.get('lat')).toBe('41.321903');expect(url.searchParams.get('elev')).toBe('457');expect(url.searchParams.get('date')).toBe(epoch)
})
it('preserves a same-mode camera and uses a moved Earth observer for switching to Sky',()=>{
 const earth:NavigationState={...sky,mode:'earth',observer:{lat:36.1,lon:14.5,elevationM:123},camera:{latitudeRad:.7,longitudeRad:.2,heightM:10000,headingRad:.2,pitchRad:-1,rollRad:0}}
 const same=solarExit('/earth',epoch,{n1View:earth,n1Center:true},{},null,false)
 expect((same.state?.n1View as NavigationState).camera).toEqual(earth.camera);expect(same.state?.n1Center).toBe(false)
 const different=solarExit('/sky-engine?lat=41&lng=-79',epoch,{n1View:earth,r2Search:true,r2Place:{label:'old search'}},{sky},null,false),view=different.state?.n1View as NavigationState
 expect(different.state).not.toHaveProperty('r2Search');expect(different.state).not.toHaveProperty('r2Place');expect(view.mode).toBe('sky');expect(view.observer).toEqual(earth.observer);expect(new URL(different.path,'http://local').searchParams.get('lat')).toBe('36.1')
})
it('retains controlled route fallback when no valid native view has been saved',()=>{expect(solarExit('https://outside.invalid',epoch,{n1View:{}},{},null,false).path).toBe('/sky-engine?date=2026-10-28T00%3A00%3A00.000Z')})

it('centers direct Solar bookmarks using canonical observer intent and existing bounded camera defaults',()=>{const result=solarExit('/earth?date='+epoch,epoch,undefined,{},null,false,{lat:12,lon:23,elevationM:456,elevationSource:'provided'});const view=result.state?.n1View as NavigationState;expect(view.mode).toBe('earth');expect(view.observer).toEqual({lat:12,lon:23,elevationM:456});expect(result.state?.n1Center).toBe(true)})
