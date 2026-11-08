import {createPopulationWorkerHandler,type PopulationRequest,type PopulationReply} from './solarPopulations'
const worker=globalThis as unknown as {onmessage:((event:MessageEvent<PopulationRequest>)=>void)|null;postMessage:(message:PopulationReply,transfer?:Transferable[])=>void}
const handle=createPopulationWorkerHandler((message,transfer)=>worker.postMessage(message,transfer))
worker.onmessage=(event)=>{void handle(event.data)}
