export interface ImageryCacheStatus {status:string;entries:number|null;bytes:number|null;persistent:boolean|null;maxBytes?:number;originUsage?:number|null;originQuota?:number|null;hits?:number;misses?:number;writes?:number;evictions?:number;httpCache:string;ok?:boolean;}
export function startImageryCache():Promise<ServiceWorkerRegistration|null>;
export function imageryCacheStatus(clear?:boolean):Promise<ImageryCacheStatus>;
