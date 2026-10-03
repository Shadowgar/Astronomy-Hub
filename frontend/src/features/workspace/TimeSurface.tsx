import React,{useState,useEffect} from 'react'
import type {RuntimeMode} from '../../../../packages/runtime-protocol/index.mjs'
import {Icon,CloseButton} from './primitives'
import {formatObserveTime} from '../observe/ObservePage'
import {ORAS_SITE} from '../../config/orasSite'
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
export type TimeState={requested:string;effective:string|null;live:boolean;pending:boolean;error:boolean}
export function TimeEditor({mode,time,isOras=true,onApply,onNow,onClose}:{mode:RuntimeMode;time:TimeState;isOras?:boolean;onApply:(utc:string)=>void;onNow:()=>void;onClose:()=>void}){
 const [value,setValue]=useState(()=>inputTime(time.live?new Date().toISOString():time.requested,isOras))
 useEffect(()=>{setValue(inputTime(time.live?new Date().toISOString():time.requested,isOras))},[time.requested,time.live,isOras])
 const offset=(hours:number)=>onApply(new Date((time.live?Date.now():Date.parse(time.requested))+hours*3600000).toISOString())
 return <section aria-label="Time details"><div className="ws-panel-heading"><h2>{mode==='earth'?'Time details':'Change time'}</h2><CloseButton onClick={onClose}/></div>{mode==='earth'?<><p>Earth layers use live source time.</p><p className="ws-meta">Requested scene time: {formatObserveTime(time.requested,isOras)}</p><p className="ws-meta">Effective scene time: {time.effective?formatObserveTime(time.effective,isOras):'Unavailable'}</p><p className="ws-meta">Satellites, aircraft and weather remain live. Each layer reports its own source time in Layers.</p></>:<form onSubmit={event=>{event.preventDefault();const utc=inputUtc(value,isOras);if(utc)onApply(utc)}}><label htmlFor="ws-date">Date and time · {zone(isOras)}</label><input id="ws-date" type="datetime-local" value={value} required onChange={event=>setValue(event.target.value)}/><div className="ws-actions"><button type="button" onClick={()=>offset(-1)}>−1h</button><button type="button" onClick={()=>offset(1)}>+1h</button><button type="button" onClick={onNow}>Now</button><button className="ws-primary" type="submit" disabled={time.pending}>Apply</button></div></form>}{time.error?<p role="status">Time wasn't applied. Your previous effective time is retained.</p>:null}</section>
}
export default function TimeSurface({mode,time,isOras=true,onOpen}:{mode:RuntimeMode;time:TimeState;isOras?:boolean;onOpen:()=>void}){
 const [clock,setClock]=useState(()=>Date.now())
 useEffect(()=>{if(!time.live)return;setClock(Date.now());const timer=setInterval(()=>setClock(Date.now()),1000);return ()=>clearInterval(timer)},[time.live])
 return <div className="ws-time ws-panel ws-chrome" role="group" aria-label="Scene time"><Icon name="clock"/><span className={`ws-badge${mode==='earth'||time.live?' ws-badge--live':''}`}>{mode==='earth'||time.live?'Live':time.pending?'Requested':'Set time'}</span><span className="ws-time-label">{mode==='earth'?'Earth layers use live source time':time.live?formatObserveTime(new Date(clock).toISOString(),isOras):time.effective?formatObserveTime(time.effective,isOras):'Current astronomical time'}</span><button data-ws-trigger="time" className="ws-link" onClick={onOpen}>{mode==='earth'?'Time details':'Change time'}<Icon name="chevron-up"/></button></div>}
