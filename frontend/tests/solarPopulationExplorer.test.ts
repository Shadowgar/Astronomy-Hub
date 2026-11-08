import {readFileSync} from 'node:fs'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {it,expect} from 'vitest'
import {SolarPopulationExplorer} from '../src/features/solar/SolarPopulationExplorer'
const fixture=JSON.parse(readFileSync(new URL('../../backend/tests/fixtures/solar_populations_reference.json',import.meta.url),'utf8'))
const base={summary:null,population:null,onPopulation:()=>{},query:async()=>[],detail:async()=>{throw Error('not called during render')}}
it('renders source names as escaped text and never treats a discovery record as an implicit destination',()=>{
 const body=structuredClone(fixture.bodies.find((b:any)=>b.source_id==='20136199'));body.name='<img src=x onerror=alert(1)>'
 const html=renderToStaticMarkup(createElement(SolarPopulationExplorer,{...base,selected:{sourceIndex:0,body},destinationSourceIds:['20000001'],onFocusDestination:()=>{}}))
 expect(html).toContain('&lt;img');expect(html).not.toContain('<img');expect(html).not.toContain('Visit qualified destination')
 expect(html).toContain('No classical, resonant or scattered subclass');expect(html).toContain('Diameter</dt><dd>Unavailable')
})
it('offers a destination only when its exact string source identity is explicitly joined',()=>{
 const body=fixture.bodies.find((b:any)=>b.source_id==='1000036')
 const html=renderToStaticMarkup(createElement(SolarPopulationExplorer,{...base,selected:{sourceIndex:0,body},destinationSourceIds:['1000036'],onFocusDestination:()=>{}}))
 expect(html).toContain('Visit qualified destination');expect(html).toContain('Catalog orbit only');expect(html).toContain('1000036')
})
it('distinguishes approximate source time from the requested clock without claiming prediction',()=>{
 const html=renderToStaticMarkup(createElement(SolarPopulationExplorer,{...base,population:'asteroid-belt',status:{state:'ready',summary:null,population:'asteroid-belt',displayedJdTdb:2461200.5,requestedJdTdb:2461200.6,lagSeconds:8640,availableCount:10,drawnCount:5,message:'Approximate symbols'}}))
 expect(html).toContain('2461200.500000 TDB');expect(html).toContain('8,640 simulation seconds behind');expect(html).toContain('No extrapolation')
})
