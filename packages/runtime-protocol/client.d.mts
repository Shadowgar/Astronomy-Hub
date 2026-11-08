import type {Session,RuntimeResult,RuntimeEvent} from './index.mjs';
export type RuntimeClient={version:string;capabilities:string[];request(command:string,payload?:unknown,deadline?:number):Promise<RuntimeResult>;subscribe(listener:(name:string,payload:RuntimeEvent)=>void):()=>void;close():void};
export function connectRuntime(frame:HTMLIFrameElement,session:Session,options?:{timeoutMs?:number;windowImpl?:Window;signal?:AbortSignal}):Promise<RuntimeClient>;
