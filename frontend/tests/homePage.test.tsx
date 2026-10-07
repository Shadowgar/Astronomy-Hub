import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ObservabilityContext, ObservePayload } from '../src/features/observe/model'
import type { TonightPayload } from '../src/features/tonight/model'
const state=vi.hoisted(()=>({night:{isPending:false,isError:false,data:undefined as unknown},observe:{isPending:false,isError:false,data:undefined as unknown}}))
vi.mock('../src/features/tonight/queries',()=>({useTonightQuery:()=>state.night}))
vi.mock('../src/features/observe/queries',()=>({useObserveSkyQuery:()=>state.observe}))
import HomePage, {TonightSummary,ObserveSummary,ConditionsSummary} from '../src/features/home/HomePage'

const target=(id:string)=>({catalog:'Messier (local)',source_id:id,model:'dso',name:id,type:'galaxy',category:'deep-sky' as const,ra:10,dec:41,opportunity:{peak_time:'2026-10-02T03:00:00Z',peak_altitude_deg:60,peak_azimuth_deg:180,dark_duration_minutes:500,planning_altitude_duration_minutes:300},ranking:{policy_version:'tonight-opportunity.v1',rank_reason:'Factual fixture'},sky_engine_url:`/oras-sky-engine/skysource/${id}?catalog=Messier%20(local)&source_id=${id}&model=dso&ra=10&dec=41&date=2026-10-02T03%3A00%3A00.000Z`})
const night:TonightPayload={status:'ok',data:{night:{night_date:'2026-10-01',timezone:'America/New_York',status:'available',interval_start:'2026-10-01T16:00:00Z',interval_end:'2026-10-02T16:00:00Z',dark_duration_minutes:500,astronomical_darkness:[{start:'2026-10-02T00:00:00Z',end:'2026-10-02T08:20:00Z'}],twilight:{},moon:{time:'2026-10-02T04:00:00Z',altitude_deg:25,illumination_fraction:0}},targets:[target('M31'),target('M42'),target('M13'),target('M51')],top_opportunities:[target('M42'),target('M31'),target('M13'),target('M51')],forecast:{status:'partial',provider:'open_meteo_hourly',hours:[{time:'2026-10-02T02:00:00Z',cloud_cover_pct:0},{time:'2026-10-02T03:00:00Z',cloud_cover_pct:35}]}},meta:{contract_version:'tonight.v1',observer:{label:'ORAS Observatory'},limitations:[]}}
const observe:ObservePayload={objects:[{catalog:'Messier (local)',source_id:'M31',model:'dso',name:'Andromeda Galaxy',type:'galaxy',is_visible:true,alt:48,az:315,sky_engine_url:target('M31').sky_engine_url}],time:'2026-10-02T03:00:00Z',observer:{lat:41.321903,lng:-79.585394,elev:432.816}}
const weather:ObservabilityContext['weather']={status:'current_fresh',source:'open_meteo_current',last_updated:'2026-10-02T03:00:00Z',cloud_cover_pct:0,temperature_c:0,humidity_pct:50,wind_mph:0,dew_point_c:-4}
function render(element:React.ReactNode){return renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>)}
beforeEach(()=>{state.night={isPending:false,isError:false,data:night};state.observe={isPending:false,isError:false,data:observe}})
describe('Home source-backed summaries',()=>{
 it('shows darkness, zero Moon illumination and partial cloud range, preserving backend top order',()=>{
  const html=render(<TonightSummary payload={night}/>)
  expect(html).toContain('8h 20m');expect(html).toContain('0% illuminated');expect(html).toContain('0–35% clouds');expect(html).toContain('Partial forecast')
  expect(html.indexOf('<h3>M42')).toBeLessThan(html.indexOf('<h3>M31'));expect(html).not.toContain('<h3>M51')
  expect(html).toContain('date=2026-10-02T03%3A00%3A00.000Z')
 })
 it.each(['unavailable','stale'])('withholds %s forecast clouds without losing targets',status=>{
  const html=render(<TonightSummary payload={{...night,data:{...night.data,forecast:{...night.data.forecast,status}}}}/>)
  expect(html).toContain(`Forecast ${status}`);expect(html).not.toContain('0–35%');expect(html).toContain('<h3>M42')
 })
 it('shows honest no-darkness and absent-ephemeris summaries',()=>{
  for(const status of ['no_astronomical_darkness','ephemeris_unavailable']){
   const html=render(<TonightSummary payload={{...night,data:{...night.data,targets:[],night:{...night.data.night,status,astronomical_darkness:[],moon:null}}}}/>)
   expect(html).not.toContain('8h 20m');expect(html).toContain(status==='no_astronomical_darkness'?'No astronomical darkness':'Night astronomy unavailable')
  }
 })
 it('renders positions, compass and canonical links without raw catalog identifiers',()=>{
  const html=render(<ObserveSummary payload={observe}/>)
  expect(html).toContain('Andromeda Galaxy');expect(html).toContain('48° up');expect(html).toContain('NW');expect(html).toContain('source_id=M31')
  expect(html).not.toContain('<p>Messier');expect(render(<ObserveSummary payload={{...observe,objects:[]}}/>)).toContain('No supported objects')
 })
 it('preserves valid zero current facts and omits all heuristic judgments',()=>{
  const html=render(<ConditionsSummary weather={weather}/>)
  for(const value of ['0%','0°C','0 mph','50%','-4°C','Open-Meteo','Updated']) expect(html).toContain(value)
  for(const text of ['score','seeing','transparency','excellent','great night']) expect(html).not.toContain(text)
 })
 it.each(['stale','unavailable','degraded','not_evaluated_for_selected_time'] as const)('withholds %s current weather values',status=>{
  const html=render(<ConditionsSummary weather={{...weather,status}}/>)
  expect(html).not.toContain('50%');expect(html).toContain(status==='stale'?'stale':'unavailable')
 })
 it('interprets zone-less current provider timestamps as UTC, matching observability',()=>{
  const html=render(<ConditionsSummary weather={{...weather,last_updated:'2026-10-02T03:00:00'}}/>)
  expect(html).toContain('Oct 1, 11:00 PM EDT')
 })
 it('marks missing facts unavailable instead of inventing defaults',()=>{
  const html=render(<ConditionsSummary weather={{...weather,wind_mph:undefined,dew_point_c:undefined}}/>)
  expect(html.match(/<dd>Unavailable/g)).toHaveLength(2)
 })
 it('keeps Observe, current conditions and Sky when Tonight fails',()=>{
  state.night={isPending:false,isError:true,data:undefined}
  const html=render(<HomePage/>)
  expect(html).toContain('plan could not be loaded');expect(html).toContain('Andromeda Galaxy');expect(html).toContain('Current conditions');expect(html).toContain('href="/sky-engine"')
 })
 it('keeps Tonight and Sky when Above Me fails',()=>{
  state.observe={isPending:false,isError:true,data:undefined}
  const html=render(<HomePage/>)
  expect(html).toContain('<h3>M42');expect(html).toContain('current sky could not be loaded');expect(html).toContain('Current conditions unavailable');expect(html).toContain('Open Sky')
 })
 it('keeps astronomy when current provider facts are unavailable',()=>{
  state.observe.data={...observe,observabilityContext:{weather:{...weather,status:'degraded'}}}
  const html=render(<HomePage/>)
  expect(html).toContain('Current conditions unavailable');expect(html).toContain('Andromeda Galaxy');expect(html).toContain('<h3>M42')
 })
 it('retains hero and Sky entry when both astronomy endpoints fail',()=>{
  state.night={isPending:false,isError:true,data:undefined};state.observe={isPending:false,isError:true,data:undefined}
  const html=render(<HomePage/>)
  expect(html).toContain('ORAS observatory');expect(html).toContain('Open Sky');expect(html).not.toContain('Andromeda Galaxy')
 })
})

it('Home opportunities open the canonical unified workspace',()=>{
 const html=renderToStaticMarkup(<MemoryRouter><TonightSummary payload={night}/><ObserveSummary payload={observe}/></MemoryRouter>);
 expect(html).toContain('href="/sky-engine?');expect(html).not.toContain('href="/oras-sky-engine/');expect(html).toContain('source_id=M31');expect(html).toContain('date=2026');
})
