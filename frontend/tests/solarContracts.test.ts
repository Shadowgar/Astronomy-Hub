import {describe,it,expect,vi} from 'vitest'
import {planetIntent,negotiatePlanet,solarReturnPath,validateSnapshot,loadSolarSnapshot} from '../src/features/solar/solarContracts'
const body={catalog:'Solar System (JPL)',source_id:'mars',model:'planet',name:'Mars',ephemeris_target:'4',position_reference:'Mars system barycenter',position_au:[1,2,3],trajectory:[],body_fixed_frame:null,shape:{model:'mean sphere',mean_radius_km:3389.5,units:'km',source:'NASA'},orientation:{status:'unavailable',source:null},surface:{available:false,reason:'R4 not qualified'}}
const snapshot={schema:'oras.solar.v1',epoch:'2026-02-28T00:00:00Z',time_scale:'UTC to TDB',origin:'Sun center (10)',frame:'ICRF',units:'AU',km_per_au:149597870.7,corrections:'geometric',source:{id:'jpl_de442s_local',release:'de442s',sha256:'a'.repeat(64)},trajectory_model:'sampled',bodies:[{...body,source_id:'sun',name:'Sun',model:'sun',ephemeris_target:'10'},{...body,source_id:'earth',name:'Earth',ephemeris_target:'399'},body,...[['mercury','199'],['venus','299'],['jupiter','5'],['saturn','6'],['uranus','7'],['neptune','8']].map(([id,target])=>({...body,source_id:id,name:id,ephemeris_target:target}))]}
describe('Solar science boundary and R4 capability negotiation',()=>{
 it('retains frame, identity, physical radius, barycentric anchor and explicit unsupported surface',()=>{
  const s=validateSnapshot(snapshot),intent=planetIntent(s,s.bodies[2],'/earth?date=2026-02-28T00%3A00%3A00Z','visit-1')
  expect(intent.identity).toEqual({catalog:body.catalog,source_id:'mars',model:'planet'})
  expect(intent.camera.target_au).toEqual([1,2,3]);expect(intent.camera.arrival).toBe('body-context')
  expect(intent.shape.mean_radius_km).toBe(3389.5);expect(intent.frame).toBe('ICRF')
  expect(intent.orientation.status).toBe('unavailable');expect(intent.surface.available).toBe(false)
  expect(negotiatePlanet(intent,{bodyIds:['mars'],frames:['ICRF']},false).status).toBe('unavailable')
  expect(negotiatePlanet(intent,{bodyIds:['mars'],frames:['ICRF']},true).status).toBe('cancelled')
  expect(intent.returnPath).toMatch(/^\/earth/)
 })
 it.each(['units','frame','origin','schema'])('rejects incorrect %s before render',field=>{
  expect(()=>validateSnapshot({...snapshot,[field]:'wrong'})).toThrow()
 })
 it('rejects corrupt/nonfinite vectors, duplicate bodies, unknown identity and out of bounds data',()=>{
  for(const bodies of [[body],snapshot.bodies.map(b=>({...b,position_au:[NaN,2,3]})),[...snapshot.bodies,body],snapshot.bodies.map(b=>({...b,source_id:'pluto'}))])expect(()=>validateSnapshot({...snapshot,bodies})).toThrow()
 })
 it('keeps original canonical identity/location while changing only epoch on return; rejects external return',()=>{
  const path=solarReturnPath('/sky-engine?catalog=Gaia&source_id=123&model=star&lat=41&lng=-79&solarBody=mars','2026-03-01T00:00:00.000Z')
  const p=new URL(path,'http://local');expect(p.pathname).toBe('/sky-engine');expect(p.searchParams.get('source_id')).toBe('123');expect(p.searchParams.get('lat')).toBe('41');expect(p.searchParams.has('solarBody')).toBe(false)
  expect(solarReturnPath('https://evil.test/','2026-03-01T00:00:00.000Z')).toMatch(/^\/sky-engine\?/)
 })
 it('accepts exact source trajectory UTC microseconds without truncating source vectors',()=>{
  const data={...snapshot,bodies:snapshot.bodies.map(b=>({...b,trajectory:[{epoch:'2026-02-27T23:00:00.187500Z',position_au:b.position_au}]}))}
  expect(()=>validateSnapshot(data)).not.toThrow()
 })
 it('accepts Python zero-padded milliseconds without changing the instant, source vectors or raw response',async()=>{
  const raw={...snapshot,epoch:'2026-10-23T01:05:00.123000Z'}
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>raw})
  const result=await loadSolarSnapshot('2026-10-23T01:05:00.123Z',new AbortController().signal,fetcher)
  expect(result.epoch).toBe('2026-10-23T01:05:00.123Z')
  expect(Date.parse(result.epoch)).toBe(Date.parse(raw.epoch))
  expect(raw.epoch).toBe('2026-10-23T01:05:00.123000Z')
  expect(result.bodies).toBe(raw.bodies);expect(result.source).toBe(raw.source)
 })
 it.each(['2026-10-23T01:05:00.123001Z','2026-10-23T01:05:00.1230000Z','2026-02-30T01:05:00.123000Z'])('rejects nonrepresentable or malformed snapshot epochs rather than rounding %s',epoch=>{
  expect(()=>validateSnapshot({...snapshot,epoch})).toThrow(/source\/frame/)
 })
 it('surfaces provider failure and respects abort, never fabricates positions',async()=>{
  const controller=new AbortController(),fetcher=vi.fn().mockResolvedValue({ok:false,status:503})
  await expect(loadSolarSnapshot(snapshot.epoch,controller.signal,fetcher)).rejects.toThrow(/unavailable/)
  controller.abort();await expect(loadSolarSnapshot(snapshot.epoch,controller.signal,fetcher)).rejects.toThrow()
  expect(fetcher).toHaveBeenCalledTimes(1)
 })
})
