import type {Vector} from '../solar/solarContracts'

export const AU_KM=149597870.7
export const LIGHT_SPEED_KM_S=299792.458
export const LIGHT_YEAR_AU=365.25*86400*LIGHT_SPEED_KM_S/AU_KM
const rad=Math.PI/180,obliquity=84381.448/3600*rad

export function distanceFacts(au:number){
 if(!Number.isFinite(au)||au<0)throw Error('Invalid distance')
 return{au,kilometres:au*AU_KM,lightSeconds:au*AU_KM/LIGHT_SPEED_KM_S,lightYears:au/LIGHT_YEAR_AU}
}
export function distanceLabel(au:number){
 const d=distanceFacts(au),value=new Intl.NumberFormat('en-US',{maximumFractionDigits:au<10?2:0}).format(au)
 return `${value} AU · ${au>=10000?`${d.lightYears.toFixed(2)} light-years`:au>=200?`${(d.lightSeconds/86400).toFixed(1)} light-days`:`${(d.lightSeconds/3600).toFixed(1)} light-hours`}`
}
/** Fixed ECLIPJ2000→J2000 rotation, independently checked against CSPICE.
 * An angular direction has no radial distance or heliopause inversion. */
export function eclipticDirection(longitude:number,latitude:number):Vector{
 if(!Number.isFinite(longitude)||!Number.isFinite(latitude)||Math.abs(latitude)>90)throw Error('Invalid angular direction')
 const l=longitude*rad,b=latitude*rad,x=Math.cos(b)*Math.cos(l),y=Math.cos(b)*Math.sin(l),z=Math.sin(b)
 return[x,y*Math.cos(obliquity)-z*Math.sin(obliquity),y*Math.sin(obliquity)+z*Math.cos(obliquity)]
}
export function icrfToEcliptic(v:Vector):[number,number]{
 const norm=Math.hypot(...v)
 if(v.length!==3||v.some(n=>!Number.isFinite(n))||norm===0)throw Error('Invalid angular vector')
 const y=v[1]*Math.cos(obliquity)+v[2]*Math.sin(obliquity),z=-v[1]*Math.sin(obliquity)+v[2]*Math.cos(obliquity)
 return[(Math.atan2(y,v[0])/rad+360)%360,Math.asin(Math.max(-1,Math.min(1,z/norm)))/rad]
}
/** Normalized equal-area all-sky projection; sky longitude increases left. */
export function mollweide(longitude:number,latitude:number):[number,number]{
 if(!Number.isFinite(longitude)||!Number.isFinite(latitude)||Math.abs(latitude)>90)throw Error('Invalid map coordinate')
 const lambda=(((longitude+180)%360+360)%360-180)*rad,phi=latitude*rad
 let theta=phi
 if(Math.abs(latitude)===90)theta=Math.sign(latitude)*Math.PI/2
 else for(let n=0;n<20;n++){
  const change=(2*theta+Math.sin(2*theta)-Math.PI*Math.sin(phi))/(2+2*Math.cos(2*theta))
  theta-=change;if(Math.abs(change)<1e-13)break
 }
 return[lambda===0?0:-lambda*Math.cos(theta)/Math.PI,Math.sin(theta)]
}
export type BeyondCamera={position:Vector;target:Vector;up:Vector;radius:number}
export function scalePose(radius:number):{position:Vector;target:Vector}{
 if(!Number.isFinite(radius)||radius<1||radius>100000)throw Error('Unsupported visualization radius')
 // Diagonal equatorial view; no source position is enlarged or moved.
 const direction=[.35,-.8,.48],length=Math.hypot(...direction),distance=radius*3.4
 return{position:direction.map(n=>n/length*distance) as Vector,target:[0,0,0]}
}
export function validBeyondCamera(raw:unknown):raw is BeyondCamera{
 const c=raw as BeyondCamera,vector=(v:unknown):v is Vector=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6)
 return !!c&&vector(c.position)&&vector(c.target)&&vector(c.up)&&Math.hypot(...c.up)>.5&&Math.hypot(...c.up)<2&&Number.isFinite(c.radius)&&c.radius>=1&&c.radius<=100000&&Math.hypot(...c.position.map((v,i)=>v-c.target[i]))>=.1&&Math.hypot(...c.position.map((v,i)=>v-c.target[i]))<=1e6+1e-8
}
/** Unnamed visual samples only. Counts/density are not an observed population. */
export function illustrativeCloud(count:number):Vector[]{
 if(!Number.isInteger(count)||count<0||count>10000)throw Error('Illustrative sample budget exceeded')
 let seed=0x5ea124cd
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296}
 return Array.from({length:count},()=>{
  const radius=2000*50**random(),z=random()*2-1,angle=random()*Math.PI*2,xy=Math.sqrt(1-z*z)
  return[radius*xy*Math.cos(angle),radius*xy*Math.sin(angle),radius*z]
 })
}
