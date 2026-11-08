import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {describe, expect, it} from 'vitest'
import {ObservationView, angularCellPath, moveMapSelection, seriesGeometry} from '../src/features/beyond/ObservationViews'
import type {ObservationMetadata, ObservationProduct, TimeSeries} from '../src/features/beyond/beyondContracts'

const metadata:ObservationMetadata={publisher:'Fixture only',instrument:'Fixture',product:'Fixture',version:'test',observation_start:'2026-07-01T00:00:00Z',observation_end:'2026-07-01T23:59:59Z',frame:'ECLIPJ2000',units:'ENA / (cm² s sr keV)',energy:'2.73 keV',projection:'Native six degree cells',calibration:'Fixture',coverage:'Fixture',rights:'Fixture',attribution:'Fixture',source_urls:['https://example.invalid/fixture'],source_sha256:['a'.repeat(64)],limitations:[]}
const angular=():ObservationProduct=>({schema:'oras.heliophysics-observation.v1',id:'ibex-ena-map',kind:'angular-map',metadata,data:{longitude_deg:Array.from({length:60},(_,i)=>3+i*6),latitude_deg:Array.from({length:30},(_,i)=>-87+i*6),flux:Array.from({length:30},()=>Array(60).fill(7)),uncertainty:Array.from({length:30},()=>Array(60).fill(.25)),mask:Array.from({length:30},()=>Array(60).fill(false))}})
const series=():TimeSeries=>({time_utc:['2026-07-01T00:00:00Z','2026-07-01T00:01:00Z','2026-07-01T00:02:00Z','2026-07-01T00:03:00Z'],value:[3,null,9,12],minimum:[2,null,8,11],maximum:[4,null,10,13],count:[120,0,100,120],rejected_count:[0,120,20,0],quality_bitmask:[0,4,2,0]})
const points=(path:string)=>Array.from(path.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g),m=>[Number(m[1]),Number(m[2])])

describe('IBEX directional observation view',()=>{
 it('keeps seam cells on their own ellipse edge and poles finite',()=>{
  const west=points(angularCellPath(177,3)),east=points(angularCellPath(183,3))
  expect(Math.max(...west.map(p=>p[0]))).toBeLessThan(75)
  expect(Math.min(...east.map(p=>p[0]))).toBeGreaterThan(685)
  for(const lat of [-87,87])for(const lon of [3,177,183,357])expect(angularCellPath(lon,lat)).not.toMatch(/NaN|Infinity/)
  expect(points(angularCellPath(87,3)).length).toBeGreaterThan(10)
 })
 it('moves keyboard selection east toward screen left, north up, wrapping longitude only',()=>{
  expect(moveMapSelection({row:15,column:59},'ArrowLeft')).toEqual({row:15,column:0})
  expect(moveMapSelection({row:29,column:0},'ArrowUp')).toEqual({row:29,column:0})
  expect(moveMapSelection({row:0,column:0},'ArrowDown')).toEqual({row:0,column:0})
  expect(moveMapSelection({row:15,column:0},'ArrowRight')).toEqual({row:15,column:59})
 })
 it('renders native cells, an explicit hole, source labels and accessible selection',()=>{
  const p=angular();if(p.kind!=='angular-map')throw Error('fixture')
  p.data.mask[0][0]=true;p.data.flux[0][0]=null;p.data.uncertainty[0][0]=null
  const html=renderToStaticMarkup(<ObservationView product={p}/> )
  expect((html.match(/data-observation-cell=/g)||[]).length).toBe(1800)
  expect(html).toContain('data-masked="true"')
  expect(html).toContain('Mollweide')
  expect(html).toContain('2.73 keV')
  expect(html).toContain('ECLIPJ2000')
  expect(html).toContain('Statistical 1σ')
  expect(html).toContain('aria-label="Ecliptic longitude bin"')
  expect(html).toContain('aria-label="Ecliptic latitude bin"')
 })
})

describe('IMAP historical measurement view',()=>{
 it('splits both mean and variation envelope at missing samples',()=>{
  const geometry=seriesGeometry(series())
  expect(geometry.segments.map(s=>s.indices)).toEqual([[0],[2,3]])
  expect(geometry.points[1]).toBeNull()
  expect(geometry.points[0]![0]).toBe(55)
  expect(geometry.points[2]![0]).toBe(385)
  expect(geometry.segments.every(s=>!s.line.includes('NaN')&&!s.band.includes('NaN'))).toBe(true)
 })
 it('does not bridge omitted UTC intervals even when the endpoint values exist',()=>{
  const d=series();d.time_utc[3]='2026-07-01T00:05:00Z'
  expect(seriesGeometry(d).segments.map(s=>s.indices)).toEqual([[0],[2],[3]])
 })
 it('labels uncertainty honestly and preserves the sample/quality controls',()=>{
  const p:ObservationProduct={schema:'oras.heliophysics-observation.v1',id:'imap-magnetic-field',kind:'time-series',metadata:{...metadata,frame:'Source vector GSE; scalar magnitude',units:'nT',energy:'Not applicable'},data:series()}
  const html=renderToStaticMarkup(<ObservationView product={p}/> )
  expect(html).toContain('Magnetic field magnitude')
  expect(html).toContain('not measurement uncertainty')
  expect(html).toContain('aria-label="Observation minute"')
  expect(html).toContain('120 accepted')
  expect(html).toContain('0 excluded')
  expect(html).toContain('UTC')
  expect(html).toContain('nT')
 })
})
