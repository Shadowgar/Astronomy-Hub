export type RuntimeMode = 'sky' | 'earth'
export type ObserverIntent = {lat:number;lon:number;elevationM:number}
export type Session = {runtime:RuntimeMode;nonce:string;generation:number}
export type RuntimeResult = {ok:boolean;state?:WorkspaceSnapshot;error?:string;version?:string;capabilities?:string[];temporalMode?:'LIVE_ONLY'|'CONTROLLED'|'UNAVAILABLE';effectiveTime?:string|null;effectiveObserver?:ObserverIntent|null}
export const PROTOCOL: {major:number;minor:number}
export const CAPABILITIES: readonly string[]
export function validateBootstrap(event:{data:unknown;origin:string;source:unknown},expected:Session & {origin:string;source:unknown}):boolean
export function validateMessage(value:unknown,session:Session):boolean
export function envelope(session:Session,type:string,id:number,command:string,payload:unknown): Record<string,unknown>
export function validHello(value:unknown):boolean
export function validSession(value:unknown):boolean
export type SelectionDTO={id:string;name:string;kind:'dso'|'star'|'planet'|'moon'|'satellite'|'aircraft'|'site'|'weather'|'object';catalog?:string;source_id?:string;model?:string;ra?:number;dec?:number;detail?:string;facts?:{label:string;value:string}[];available:boolean;focusable:boolean;trackable:boolean;link?:string}
export type LayerDTO={id:string;title:string;enabled:boolean;status:'off'|'loading'|'live'|'ready'|'stale'|'unavailable';source?:string;sourceTime?:string|null;count?:number}
export type WorkspaceSnapshot={selection:SelectionDTO|null;layers:LayerDTO[];tracking:boolean;quality?:{imagery?:string;terrain?:string;buildings?:string;photorealistic?:string}}
