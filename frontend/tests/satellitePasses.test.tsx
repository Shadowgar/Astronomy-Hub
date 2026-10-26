import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {expect,it} from 'vitest'
const component=await import('../src/features/workspace/SatellitePasses').catch(()=>({}))
it('shows identity and conditional optical evidence without a naked-eye guarantee',()=>{
 expect(typeof component.PassCard).toBe('function')
 const html=renderToStaticMarkup(<component.PassCard pass={{id:'p',name:'Source satellite',norad_id:'61045',rise_utc:'2026-10-26T10:20:00Z',peak_utc:'2026-10-26T10:23:00Z',set_utc:'2026-10-26T10:26:00Z',peak_altitude_deg:45,peak_azimuth_deg:90,direction:'E',tle_epoch:'2026-10-24T00:00:00Z',tle_age_days:2.4,freshness_status:'fresh',sunlit_at_peak:true,solar_altitude_at_peak_deg:-12,optical_status:'potentially_observable',brightness_status:'unavailable',watch_utc:'2026-10-26T10:22:00Z',conditions:'Sunlit under dark sky'}} busy={false} onWatch={()=>{}}/>)
 for(const text of ['NORAD 61045','Rise','Peak','Set','45.0','Brightness unavailable','Watch simulation'])expect(html).toContain(text)
 expect(html).not.toContain('naked-eye visible')
})
it('unqualified geometric passages have no watch action',()=>{
 expect(typeof component.PassCard).toBe('function')
 const html=renderToStaticMarkup(<component.PassCard pass={{id:'p',name:'Daylight object',norad_id:'1',rise_utc:'2026-10-26T12:20:00Z',peak_utc:'2026-10-26T12:23:00Z',set_utc:'2026-10-26T12:26:00Z',peak_altitude_deg:45,direction:'E',tle_epoch:'2026-10-24T00:00:00Z',tle_age_days:2.4,freshness_status:'fresh',sunlit_at_peak:false,solar_altitude_at_peak_deg:20,optical_status:'geometric_only',brightness_status:'unavailable',watch_utc:null,conditions:'No qualified optical opportunity'}} busy={false} onWatch={()=>{}}/>)
 expect(html).not.toContain('Watch simulation')
 expect(html).toContain('Geometric passage')
})
it('normalizes source microsecond timestamps for the millisecond native bridge',()=>{
 expect(typeof component.passSimulationUtc).toBe('function')
 expect(component.passSimulationUtc({watch_utc:'2026-10-26T10:22:00.123456Z',rise_utc:'2026-10-26T10:20:00Z',set_utc:'2026-10-26T10:26:00Z',optical_status:'potentially_observable',freshness_status:'fresh'})).toBe('2026-10-26T10:22:00.123Z')
})
it('keeps native tracking and deselection reachable in the simulation controls',()=>{expect(typeof component.SimulationControls).toBe('function');const html=renderToStaticMarkup(<component.SimulationControls state={{utc:'2026-10-26T10:22:00Z',playing:false,speed:1}} busy={false} tracking={true} onTrack={()=>{}} onClear={()=>{}} onPlay={()=>{}} onLive={()=>{}}/>);expect(html).toContain('Stop tracking');expect(html).toContain('Deselect satellite')})
