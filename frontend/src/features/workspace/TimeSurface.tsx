import React,{useState,useEffect} from 'react'
import type {RuntimeMode,SimulationState} from '../../../../packages/runtime-protocol/index.mjs'
import {Icon,CloseButton} from './primitives'
import {formatObserveTime} from '../observe/ObservePage'
import {ORAS_SITE} from '../../config/orasSite'
import {satelliteDataStatus,type SatelliteFeedStatus} from './satelliteTimeStatus'
const zone=(isOras:boolean)=>isOras?ORAS_SITE.timezone:'UTC'
export function inputTime(utc:string,isOras:boolean){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone(isOras),year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(utc))
 const part=(key:string)=>parts.find(p=>p.type===key)?.value
 return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}
export function inputUtc(value:string,isOras:boolean){
 const wall=Date.parse(value+'Z');if(!Number.isFinite(wall))return null
 let instant=wall
 for(let i=0;i<3;i++)instant+=wall-Date.parse(inputTime(new Date(instant).toISOString(),isOras)+'Z')
 const utc=new Date(instant).toISOString();return inputTime(utc,isOras)===value?utc:null
}
export type TimeState={simulation?:SimulationState|null;requested:string;effective:string|null;live:boolean;pending:boolean;error:boolean}
type SatelliteTimeProps={satelliteFeed?:SatelliteFeedStatus;selectedSatellite?:string;tracking?:boolean;satelliteLoading?:boolean}
function SatelliteTimeDetails({satelliteFeed,selectedSatellite,tracking}:SatelliteTimeProps){const data=satelliteDataStatus(satelliteFeed),selected=satelliteFeed?.selected;return <div className="ws-meta ws-satellite-time-details"><p>{data.detail}</p>{selectedSatellite?<p>NORAD {selectedSatellite}: {selected?.norad_id===selectedSatellite&&selected.tle_epoch?<>TLE epoch {selected.tle_epoch}{typeof selected.tle_age_days==='number'?` · ${selected.tle_age_days.toFixed(1)} days old at current UTC`:null} · {selected.freshness_status||'freshness unavailable'}</>:'selected element age unavailable. Catalog freshness does not qualify this satellite.'}</p>:null}{tracking?<p>Tracking follows the selected object. Astronomical time remains independent.</p>:null}</div>}
export function TimeEditor({mode,time,isOras=true,onApply,onNow,onClose,...satellite}:{mode:RuntimeMode;time:TimeState;isOras?:boolean;onApply:(utc:string)=>void;onNow:()=>void;onClose:()=>void}&SatelliteTimeProps){
 const [value,setValue]=useState(()=>inputTime(time.live?new Date().toISOString():time.requested,isOras))
 useEffect(()=>{setValue(inputTime(time.live?new Date().toISOString():time.requested,isOras))},[time.requested,time.live,isOras])
 const offset=(hours:number)=>onApply(new Date((time.live?Date.now():Date.parse(time.requested))+hours*3600000).toISOString())
 return <section aria-label="Time details"><div className="ws-panel-heading"><h2>{mode==='earth'?'Time details':'Change time'}</h2><CloseButton onClick={onClose}/></div>{mode==='earth'?<><p>Earth layers use live source time.</p><p className="ws-meta">Requested scene time: {formatObserveTime(time.requested,isOras)}</p><p className="ws-meta">Effective scene time: {time.effective?formatObserveTime(time.effective,isOras):'Unavailable'}</p><p className="ws-meta">Satellites, aircraft and weather remain live. Each layer reports its own source time in Layers.</p></>:<form onSubmit={event=>{event.preventDefault();const utc=inputUtc(value,isOras);if(utc)onApply(utc)}}><label htmlFor="ws-date">Date and time · {zone(isOras)}</label><input id="ws-date" type="datetime-local" value={value} required onChange={event=>setValue(event.target.value)}/><div className="ws-actions"><button type="button" onClick={()=>offset(-1)}>−1h</button><button type="button" onClick={()=>offset(1)}>+1h</button><button type="button" onClick={onNow}>Now</button><button className="ws-primary" type="submit" disabled={time.pending}>Apply</button></div></form>}{mode==='sky'?<><p className="ws-meta">{time.simulation?'Simulation uses the native astronomical clock at 1×. Resume Live returns to actual UTC.':time.live?'Live advances at current astronomical time.':'Paused at the selected astronomical time. Resume Live returns to now.'}</p><SatelliteTimeDetails {...satellite}/></>:null}{time.error?<p role="status">Time wasn't applied. Your previous effective time is retained.</p>:null}</section>
}
export default function TimeSurface({mode,time,isOras=true,onOpen,onNow,onStopTracking,tracking=false,satelliteFeed,satelliteLoading=false}:{mode:RuntimeMode;time:TimeState;isOras?:boolean;onOpen:()=>void;onNow?:()=>void;onStopTracking?:()=>void}&SatelliteTimeProps){
 const [clock,setClock]=useState(()=>Date.now())
 useEffect(()=>{if(!time.live)return;setClock(Date.now());const timer=setInterval(()=>setClock(Date.now()),1000);return ()=>clearInterval(timer)},[time.live])
 const data=satelliteDataStatus(satelliteFeed)
 return <div className="ws-time ws-panel ws-chrome" role="group" aria-label="Scene time"><Icon name="clock"/><div className="ws-time-main"><div className="ws-time-status"><span className={`ws-badge${mode==='earth'||time.live?' ws-badge--live':''}`}>{mode==='earth'||time.live?'Live':time.pending?'Requested':time.simulation?`Simulation · ${time.simulation.playing?'1×':'Paused'}`:'Paused'}</span>{mode==='sky'&&tracking?<span className="ws-badge">Tracking</span>:null}{mode==='sky'&&(satelliteLoading||data.label)?<span className="ws-badge" title={data.detail}>{satelliteLoading?'Checking data':data.label}</span>:null}</div><span className="ws-time-label">{mode==='earth'?'Earth layers use live source time':time.simulation?`${time.simulation.utc} · 1×`:time.live?formatObserveTime(new Date(clock).toISOString(),isOras):time.effective?formatObserveTime(time.effective,isOras):'Current astronomical time'}</span></div>{mode==='sky'&&!time.live&&onNow?<button className="ws-time-resume" onClick={onNow} disabled={time.pending}>Resume Live</button>:null}{mode==='sky'&&tracking&&onStopTracking?<button className="ws-icon-button" aria-label="Stop tracking" title="Stop tracking" onClick={onStopTracking}><Icon name="x"/></button>:null}<button data-ws-trigger="time" className="ws-link" onClick={onOpen}>{mode==='earth'?'Time details':'Change time'}<Icon name="chevron-up"/></button></div>
}
