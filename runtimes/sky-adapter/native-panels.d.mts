export function validSkyPanelReport(event:MessageEvent,expected:{source:Window|null;origin:string;nonce:string;generation:number}):boolean;
export function installSkyPanelReports(windowImpl?:Window):()=>void;
export function validSkyNightReport(event:MessageEvent,expected:{source:Window|null;origin:string;nonce:string;generation:number}):boolean;
export function installSkyNightReports(windowImpl?:Window,read?:()=>boolean|undefined):()=>void;
