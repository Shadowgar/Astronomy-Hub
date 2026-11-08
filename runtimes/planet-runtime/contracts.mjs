export const NAMESPACE='oras.planet.v1';
export const MOON_RADIUS_M=1_737_400;
export const SOURCE=Object.freeze({id:'LROC_WAC_GLOBAL_E000N0000_008P_v1.3',url:'/planet-data/moon-wac.png',status:'loading',sourceResolutionM:3790.4188030187,pixelsPerDegree:8,noDataPixels:325773,noDataFraction:325773/(2880*1440)});
const finite=(v)=>typeof v==='number'&&Number.isFinite(v);
export function validateMoonContract(c){
 if(c?.schema!=='oras.planet-view.v1'||c.body?.source_id!=='moon'||c.body?.model!=='moon'||c.body?.naif_id!=='301')throw Error('Unsupported planetary center or identity');
 if(c.frame?.body_fixed!=='MOON_ME_DE440_ME421'||c.frame?.naif_frame_id!=='31009')throw Error('Unqualified lunar body-fixed frame');
 if(c.shape?.model!=='reference sphere'||!Array.isArray(c.shape.radii_m)||c.shape.radii_m.length!==3||!c.shape.radii_m.every(v=>v===MOON_RADIUS_M))throw Error('Unqualified lunar reference shape');
 if(c.capabilities?.globe!==true||c.capabilities?.orientation!==true||c.capabilities?.terrain!==false)throw Error('Unsupported lunar capabilities');
 if(typeof c.epoch!=='string'||!c.epoch.endsWith('Z')||!finite(Date.parse(c.epoch)))throw Error('Invalid lunar epoch');
 const m=c.frame.icrf_to_body_fixed;
 if(!Array.isArray(m)||m.length!==3||!m.every(row=>Array.isArray(row)&&row.length===3&&row.every(finite)))throw Error('Invalid orientation matrix');
 for(let i=0;i<3;i++)for(let j=0;j<3;j++){const d=m[i].reduce((a,v,k)=>a+v*m[j][k],0);if(Math.abs(d-(i===j?1:0))>1e-8)throw Error('Non-orthonormal orientation matrix');}
 const determinant=m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
 if(Math.abs(determinant-1)>1e-8)throw Error('Invalid frame handedness');
 lightEmissionDirection(c.illumination?.direction_body_fixed);
 return c;
}
export function lightEmissionDirection(sunDirection){
 if(!Array.isArray(sunDirection)||sunDirection.length!==3||!sunDirection.every(finite))throw Error('Missing geometric illumination');
 const magnitude=Math.hypot(...sunDirection);if(Math.abs(magnitude-1)>1e-8)throw Error('Invalid body-to-Sun unit vector');
 return sunDirection.map(v=>-v/magnitude);
}
export function validateCamera(c){
 if(!c||!finite(c.latitudeDeg)||Math.abs(c.latitudeDeg)>90||!finite(c.longitudeDeg)||Math.abs(c.longitudeDeg)>180||!finite(c.heightM)||c.heightM<30_000-1e-3||c.heightM>12_000_000+1e-3)throw Error('Coordinates outside lunar camera bounds (height 30 km–12,000 km)');
 const result={latitudeDeg:c.latitudeDeg,longitudeDeg:c.longitudeDeg===180?-180:c.longitudeDeg,heightM:Math.max(30_000,Math.min(12_000_000,c.heightM))};
 const angles=['headingRad','pitchRad','rollRad'];
 if(angles.some(key=>c[key]!==undefined)){if(!angles.every(key=>finite(c[key]))||Math.abs(c.headingRad)>Math.PI*2||c.pitchRad < -Math.PI/2-1e-8||c.pitchRad>0||Math.abs(c.rollRad)>Math.PI*2)throw Error('Invalid lunar camera orientation');for(const key of angles)result[key]=c[key];}
 return result;
}
export function acceptsBridgeMessage(event,{parent,origin,channel}){return Boolean(channel&&event.source===parent&&event.origin===origin&&event.data?.namespace===NAMESPACE&&event.data.channel===channel);}
