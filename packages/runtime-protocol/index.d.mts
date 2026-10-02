export type RuntimeMode = 'sky' | 'earth'
export type ObserverIntent = {lat:number;lon:number;elevationM:number}
export type Session = {runtime:RuntimeMode;nonce:string;generation:number}
export type RuntimeResult = {ok:boolean;error?:string;version?:string;capabilities?:string[];temporalMode?:'LIVE_ONLY'|'CONTROLLED'|'UNAVAILABLE';effectiveTime?:string|null;effectiveObserver?:ObserverIntent|null}
export const PROTOCOL: {major:number;minor:number}
export const CAPABILITIES: readonly string[]
export function validateBootstrap(event:{data:unknown;origin:string;source:unknown},expected:Session & {origin:string;source:unknown}):boolean
export function validateMessage(value:unknown,session:Session):boolean
export function envelope(session:Session,type:string,id:number,command:string,payload:unknown): Record<string,unknown>
export function validHello(value:unknown):boolean
export function validSession(value:unknown):boolean
