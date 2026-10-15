import {it,expect} from 'vitest'
import {handoffPath,handoffView} from '../src/features/workspace/viewNavigation'
import type {NavigationState} from '../../packages/runtime-protocol/index.mjs'
import {useRuntimeProductState} from '../src/features/runtime/productState'
const sky:NavigationState={mode:'sky',observer:{lat:40.7829,lon:-73.9654,elevationM:0},utc:'2026-10-14T02:10:00.000Z',live:false,elevationSource:'unavailable-zero',camera:{projection:2,fovRad:185*Math.PI/180,yawRad:1,pitchRad:.3,rollRad:0,landscapeVisible:false}}
it('Sky to Earth uses current observer and time, drops focus, and starts from space at New York',()=>{
 const path=handoffPath('earth','?lat=41&lng=-79&catalog=Gaia&source_id=123&model=star&focus=1',sky,null)
 const url=new URL(path,'http://local');expect(url.pathname).toBe('/earth');expect(url.searchParams.get('lat')).toBe('40.7829');expect(url.searchParams.get('date')).toBe(sky.utc);expect(url.searchParams.has('catalog')).toBe(false);expect(url.searchParams.has('focus')).toBe(false)
 const view=handoffView('earth',sky,{},false);expect(view.mode).toBe('earth');if(view.mode==='earth'){expect(view.camera.heightM).toBeGreaterThan(10000000);expect(view.camera.latitudeRad).toBeCloseTo(40.7829*Math.PI/180)}
})
it('return Sky restores native view at the same observer; a newly explored observer gets a fresh sky',()=>{
 const earth:NavigationState={...sky,mode:'earth',camera:{latitudeRad:.7,longitudeRad:-1.3,heightM:1000,headingRad:0,pitchRad:-Math.PI/2,rollRad:0}}
 expect(handoffView('sky',earth,{sky},false).camera).toEqual(sky.camera)
 const moved={...earth,observer:{...earth.observer,lat:35}}
 expect(handoffView('sky',moved,{sky},false).camera).not.toEqual(sky.camera)
})
it('live-time remains live and canonical large IDs survive a reverse journey',()=>{
 const path=handoffPath('sky','?date=2020-01-01T00:00:00Z',{...sky,live:true},{catalog:'Gaia DR3',source_id:'5853498713190525696',model:'star'})
 const p=new URL(path,'http://local').searchParams;expect(p.has('date')).toBe(false);expect(p.get('source_id')).toBe('5853498713190525696');expect(p.get('elevationSource')).toBe('unavailable-zero')
})
it.each([null,{catalog:'Gaia DR3',source_id:'5853498713190525696',model:'star',ra:193.508,dec:55.959}])('Earth handoff removes all Sky identity before a fresh URL ingest, selection=%j',selection=>{
 const query=new URLSearchParams({catalog:'Gaia DR3',source_id:'1576683529448755328',model:'star',ra:'12.34',dec:'-56.78',focus:'1',fov:'20',az:'90',alt:'30'})
 const url=new URL(handoffPath('earth','?'+query,sky,selection),'http://local')
 expect(url.pathname).toBe('/earth')
 for(const key of ['catalog','source_id','model','ra','dec','focus','fov','az','alt'])expect(url.searchParams.has(key),key).toBe(false)
 expect(url.searchParams.get('lat')).toBe(String(sky.observer.lat));expect(url.searchParams.get('lng')).toBe(String(sky.observer.lon));expect(url.searchParams.get('date')).toBe(sky.utc)
 const previous=useRuntimeProductState.getState()
 try{
  useRuntimeProductState.setState({selection:null,pendingFocus:null})
  useRuntimeProductState.getState().ingestSearch(url.search)
  const reloaded=useRuntimeProductState.getState()
  expect(reloaded.selection).toBeNull();expect(reloaded.pendingFocus).toBeNull()
  expect(reloaded.observer).toEqual(sky.observer);expect(reloaded.requestedTime).toBe(sky.utc)
 }finally{useRuntimeProductState.setState(previous)}
})
