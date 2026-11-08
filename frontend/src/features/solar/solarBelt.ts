/** Deterministic aggregate illustration, NOT asteroid ephemerides or objects.
 * Broad main-belt envelope 2.1–3.3 AU, sparse thickness and gaps motivated by
 * Kirkwood resonances; no catalog IDs, epoch, measured density or exact orbits.
 * Ecliptic J2000 -> ICRF rotation uses the J2000 obliquity, not renderer axes.
 */
export function aggregateBelt(count:number){
 const result:number[]=[];let seed=25121
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
 const n=Math.min(6000,Math.max(0,Math.floor(count))),eps=23.4392911*Math.PI/180
 while(result.length<n*3){const r=2.1+random()*1.2,a=random()*Math.PI*2
  if([2.5,2.82,2.95].some(g=>Math.abs(r-g)<.018)&&random()<.9)continue
  const z=(random()-.5)*.1,x=Math.cos(a)*r,y=Math.sin(a)*r
  if(Math.hypot(x,y,z)>3.3)continue
  result.push(x,y*Math.cos(eps)-z*Math.sin(eps),y*Math.sin(eps)+z*Math.cos(eps))
 }
 return result
}
