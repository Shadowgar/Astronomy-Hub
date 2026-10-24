import React,{useEffect,useRef} from 'react'
import type {PlanetContract,PlanetCamera} from './planetContracts'
import {validPlanetCamera,createPlanetChannel} from './planetContracts'
export type PlanetState={bodyId:string;centerNaifId:string;frame:string;epoch:string;camera:PlanetCamera;radiiM:number[];source:{id:string;status:string;sourceResolutionM:number};terrain:false;disposed:boolean;viewerDestroyed:boolean;earthEffectsDisabled:boolean}
export type PlanetController={request:(command:string,payload?:unknown)=>Promise<PlanetState>}
export default function PlanetFrame({contract,camera,onReady,onState,onError}:{contract:PlanetContract;camera?:PlanetCamera;onReady:(controller:PlanetController)=>void;onState:(state:PlanetState)=>void;onError:(message:string)=>void}){
 const frame=useRef<HTMLIFrameElement>(null),channel=useRef(createPlanetChannel()),callbacks=useRef({onReady,onState,onError});callbacks.current={onReady,onState,onError}
 useEffect(()=>{let closed=false;let ready=false;let n=0;const pending=new Map<string,{resolve:(s:PlanetState)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();const origin=location.origin;
 const send=(message:object)=>frame.current?.contentWindow?.postMessage({namespace:'oras.planet.v1',channel:channel.current,...message},origin)
 const valid=(s:PlanetState)=>s?.bodyId==='moon'&&s.centerNaifId==='301'&&s.frame===contract.frame.body_fixed&&Date.parse(s.epoch)===Date.parse(contract.epoch)&&validPlanetCamera(s.camera)&&Array.isArray(s.radiiM)&&s.radiiM.length===3&&s.radiiM.every((v,i)=>Math.abs(v-contract.shape.radii_m[i])<1e-6)&&s.terrain===false&&(s.disposed||s.source?.status==='ready')
 const controller:PlanetController={request(command,payload={}){if(closed)return Promise.reject(Error('Planet renderer departed.'));return new Promise((resolve,reject)=>{const requestId=String(++n);const timer=setTimeout(()=>{pending.delete(requestId);reject(Error('Planet command did not complete. Retry or return to Solar.'))},12000);pending.set(requestId,{resolve,reject,timer});send({type:'command',command,requestId,payload})})}}
 const timer=setTimeout(()=>callbacks.current.onError('Planet renderer did not become ready. Retry or return to Solar.'),30000)
 function receive(event:MessageEvent){if(closed||event.origin!==origin||event.source!==frame.current?.contentWindow)return;const m=event.data;if(!m||m.namespace!=='oras.planet.v1'||m.channel!==channel.current)return;
 if(m.type==='frameReady')send({type:'initialize',contract,camera});
 else if(m.type==='error'){const p=pending.get(m.requestId);if(p){clearTimeout(p.timer);pending.delete(m.requestId);p.reject(Error(typeof m.message==='string'?m.message:'Planet command unavailable.'));return}clearTimeout(timer);callbacks.current.onError(typeof m.message==='string'?m.message:'Planet renderer unavailable.')}
 else if(m.type==='ready'||m.type==='navigation'||m.type==='ack'){
  if(m.type==='ack'&&m.error){const p=pending.get(m.requestId);if(p){clearTimeout(p.timer);pending.delete(m.requestId);p.reject(Error(String(m.error)))}return}
  if(!valid(m.state)){callbacks.current.onError('Planet renderer returned an invalid body/frame/camera.');return}
  if(m.type==='navigation'&&!ready)return;
  if(m.type==='ready'){ready=true;clearTimeout(timer);callbacks.current.onReady(controller)}
  if(m.type==='ack'){const p=pending.get(m.requestId);if(p){clearTimeout(p.timer);pending.delete(m.requestId);p.resolve(m.state)}}
  callbacks.current.onState(m.state)
 }
 }
 window.addEventListener('message',receive);return()=>{send({type:'command',command:'dispose',requestId:'departure',payload:{}});closed=true;clearTimeout(timer);window.removeEventListener('message',receive);for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Planet renderer departed.'))}pending.clear()}
 },[contract])
 return <iframe ref={frame} title="Native Moon globe" src={'/planet-runtime/?channel='+channel.current} allow="fullscreen"/>
}
