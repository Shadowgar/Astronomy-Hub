/** Wall-clock milliseconds to astronomical UTC milliseconds, bounded by source coverage. */
export function advanceSystemTime(utcMs:number,elapsedMs:number,secondsPerSecond:number,endMs:number){return Math.min(endMs,utcMs+elapsedMs*secondsPerSecond)}
