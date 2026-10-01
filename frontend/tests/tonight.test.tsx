import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TonightView } from '../src/features/tonight/TonightPage'
import { nightPath, shiftNightDate, formatNightTime, type TonightPayload } from '../src/features/tonight/model'

export const payload: TonightPayload = {
 status:'ok',data:{
  night:{night_date:'2026-10-01',timezone:'America/New_York',status:'available',dark_duration_minutes:600,
   interval_start:'2026-10-01T16:00:00Z',interval_end:'2026-10-02T16:00:00Z',
   astronomical_darkness:[{start:'2026-10-02T00:00:00Z',end:'2026-10-02T10:00:00Z'}],
   twilight:{civil:{dusk:'2026-10-01T23:00:00Z',dawn:'2026-10-02T11:00:00Z'},nautical:{dusk:'2026-10-01T23:30:00Z',dawn:'2026-10-02T10:30:00Z'},astronomical:{dusk:'2026-10-02T00:00:00Z',dawn:'2026-10-02T10:00:00Z'}},moon:{time:'2026-10-02T05:00:00Z',altitude_deg:30,illumination_fraction:.5}},
  targets:[{catalog:'Messier (local)',source_id:'M31',model:'dso',name:'Andromeda Galaxy',type:'galaxy',category:'deep-sky',ra:10,dec:41,
   opportunity:{peak_time:'2026-10-02T03:20:00Z',peak_altitude_deg:68,peak_azimuth_deg:180,dark_duration_minutes:600,planning_altitude_duration_minutes:220,moon_separation_at_peak_deg:80,moon_altitude_at_peak_deg:30},
   ranking:{policy_version:'tonight-opportunity.v1',rank_reason:'Peaks at 68° around 11:20 PM.'},
   sky_engine_url:'/oras-sky-engine/skysource/Andromeda?catalog=Messier&source_id=M31&model=dso&date=2026-10-02T03%3A20%3A00Z&lat=41.321903&lng=-79.585394&ra=10&dec=41'}],
  top_opportunities:[{catalog:'Messier (local)',source_id:'M31',model:'dso'}],forecast:{status:'unavailable',provider:'open_meteo_hourly',hours:[],fetched_at:null,coverage_start:null,coverage_end:null}},
 meta:{contract_version:'tonight.v1',observer:{label:'ORAS Observatory'},limitations:['Actual site terrain, trees, and buildings are not modeled.']}
}

function render(data=payload){return renderToStaticMarkup(<MemoryRouter><TonightView payload={data}/></MemoryRouter>)}

describe('Tonight product',()=>{
 it('renders night timeline, factual cards and categories with exact Sky link',()=>{
  const html=render()
  for(const text of ['Civil dusk','Nautical dusk','Astronomical darkness','Astronomical dawn','Andromeda Galaxy','68','11:20 PM','Top opportunities','Deep Sky','source_id=M31','date=2026','Open in Sky']) expect(html).toContain(text)
  expect(html).not.toContain('<h2>Stars</h2>')
  expect(html).not.toContain('Satellites')
 })
 it('keeps astronomy when forecast is unavailable',()=>{
  expect(render()).toContain('Forecast unavailable')
  expect(render()).toContain('Andromeda Galaxy')
 })
 it('shows partial forecast and real zeros near peak',()=>{
  const html=render({...payload,data:{...payload.data,forecast:{...payload.data.forecast,status:'partial',hours:[{time:'2026-10-02T03:00:00Z',cloud_cover_pct:0,temperature_c:0}]}}})
  expect(html).toContain('Partial forecast')
  expect(html).toContain('0%')
  expect(html).toContain('0°C')
 })
 it('does not borrow clouds from hours far from peak',()=>{
  const html=render({...payload,data:{...payload.data,forecast:{...payload.data.forecast,status:'partial',hours:[{time:'2026-10-02T08:00:00Z',cloud_cover_pct:18}]}}})
  expect(html).not.toContain('Clouds near peak: 18%')
 })
 it('handles no darkness and ephemeris failure honestly',()=>{
  expect(render({...payload,data:{...payload.data,targets:[],night:{...payload.data.night,status:'no_astronomical_darkness'}}})).toContain('No astronomical darkness')
  expect(render({...payload,data:{...payload.data,targets:[],night:{...payload.data.night,status:'ephemeris_unavailable'}}})).toContain('Night astronomy unavailable')
 })
 it('describes all partial astronomy failures without blaming catalogs',()=>{
  const html=render({...payload,status:'partial'})
  expect(html).toContain('Some astronomy data could not be evaluated')
  expect(html).not.toContain('Some catalog sources are unavailable')
  expect(html).toContain('Andromeda Galaxy')
 })
 it('navigates local evening dates across months and DST',()=>{
  expect(shiftNightDate('2026-10-31',1)).toBe('2026-11-01')
  expect(shiftNightDate('2026-03-08',-1)).toBe('2026-03-07')
  expect(nightPath('2026-10-01')).toBe('/tonight?date=2026-10-01')
  expect(formatNightTime('2026-11-01T06:30:00Z')).toContain('EST')
  const html=render()
  expect(html).toContain('Previous night');expect(html).toContain('Next night');expect(html).toContain('Current observing night')
 })
})
