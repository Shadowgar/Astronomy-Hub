/** Wall-clock milliseconds to UTC milliseconds. Both playback directions stop
 * at admitted source bounds; a source refresh never extrapolates a trajectory. */
export function advanceSystemTime(utcMs:number,elapsedMs:number,secondsPerSecond:number,endMs:number,startMs=-Infinity){return Math.max(startMs,Math.min(endMs,utcMs+Math.max(0,elapsedMs)*secondsPerSecond))}
/** Center the next symmetric source window on the current admitted epoch. A
 * point beyond the old window would fail the overlap check and never refresh. */
export function systemWindowRefreshEpoch(utcMs:number,rate:number,start:number,end:number,coverageStart:number,coverageEnd:number){
 if(!rate||utcMs<start||utcMs>end)return null
 const remaining=rate>0?end-utcMs:utcMs-start
 if(remaining>=(end-start)*.3||(rate>0?end>=coverageEnd:start<=coverageStart))return null
 return utcMs
}
