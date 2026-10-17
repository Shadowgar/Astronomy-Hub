import type {ObserverIntent,ElevationSource} from './index.mjs';
export function sameObserverLocation(a:Pick<ObserverIntent,'lat'|'lon'>|null|undefined,b:Pick<ObserverIntent,'lat'|'lon'>|null|undefined):boolean;
export function observerElevationSource(observer:ObserverIntent,claimed:unknown,site:ObserverIntent,missingElevation?:boolean):ElevationSource;
