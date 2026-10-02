import {describe,it,expect} from 'vitest'
import {useRuntimeProductState} from '../src/features/runtime/productState'
describe('bounded product intent',()=>{
 it('preserves large catalog IDs as strings and separates live effective time',()=>{
  const state=useRuntimeProductState.getState();state.ingestSearch('?catalog=Gaia%20DR3&source_id=1576683529448755328&model=star&ra=193.508&dec=55.959&date=2020-01-01T00%3A00%3A00Z&lat=41&lng=-79&elev=430')
  state.report('earth',{temporalMode:'LIVE_ONLY',effectiveTime:'2026-10-02T00:00:00Z'})
  const result=useRuntimeProductState.getState();expect(result.selection?.source_id).toBe('1576683529448755328');expect(result.requestedTime).toBe('2020-01-01T00:00:00.000Z');expect(result.observer).toEqual({lat:41,lon:-79,elevationM:430});expect(result.effective.earth).toEqual({temporalMode:'LIVE_ONLY',effectiveTime:'2026-10-02T00:00:00Z'})
 })
 it('rejects invalid observer/coordinates and advances generation per mount',()=>{
  const state=useRuntimeProductState.getState(),before=state.observer;state.ingestSearch('?lat=999&lng=1000&date=not-a-date');expect(useRuntimeProductState.getState().observer).toEqual(before)
  const generation=state.activate('sky');expect(state.activate('earth')).toBe(generation+1);expect(useRuntimeProductState.getState().viewportPolicy).toBe('serial')
 })
 it('does not manufacture time or coordinates from malformed or empty intent',()=>{
  const before=useRuntimeProductState.getState();const time=before.requestedTime,observer=before.observer;
  before.ingestSearch('?date=2026-02-30T00:00:00Z&lat=&lng=&elev=');
  expect(useRuntimeProductState.getState().requestedTime).toBe(time);expect(useRuntimeProductState.getState().observer).toEqual(observer);
  before.ingestSearch('?catalog=Gaia&source_id=1576683529448755328&model=star&ra=&dec=');
  expect(useRuntimeProductState.getState().selection).toEqual({catalog:'Gaia',source_id:'1576683529448755328',model:'star'});
 })

})
