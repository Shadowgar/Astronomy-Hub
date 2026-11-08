// N1: angular Sky and geographic Earth views remain distinct, bounded DTOs.
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const keys=(v,k)=>object(v)&&Object.keys(v).every(x=>k.includes(x));
const range=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
export const SKY_OUTWARD_FOV=Object.freeze({1:120,2:185,3:175,4:360,5:360}); // pinned SWE max_ui_fov, degrees
export function validNavigationView(v){
 if(!keys(v,['mode','camera']))return false;const c=v.camera;
 if(v.mode==='sky')return keys(c,['projection','fovRad','yawRad','pitchRad','rollRad','landscapeVisible'])&&Number.isInteger(c.projection)&&c.projection in SKY_OUTWARD_FOV&&range(c.fovRad,Math.PI/180/3600-1e-12,SKY_OUTWARD_FOV[c.projection]*Math.PI/180+1e-9)&&range(c.yawRad,-1e6,1e6)&&range(c.pitchRad,-Math.PI/2,Math.PI/2)&&range(c.rollRad,-1e6,1e6)&&typeof c.landscapeVisible==='boolean';
 return v.mode==='earth'&&keys(c,['latitudeRad','longitudeRad','heightM','headingRad','pitchRad','rollRad'])&&range(c.latitudeRad,-Math.PI/2,Math.PI/2)&&range(c.longitudeRad,-Math.PI,Math.PI)&&range(c.heightM,100-1e-5,30000000+1e-5)&&range(c.headingRad,-2*Math.PI,2*Math.PI)&&range(c.pitchRad,-Math.PI/2,Math.PI/2)&&range(c.rollRad,-2*Math.PI,2*Math.PI);
}
export function validNavigationState(v){
 return keys(v,['mode','camera','observer','utc','live','elevationSource'])&&validNavigationView({mode:v.mode,camera:v.camera})&&keys(v.observer,['lat','lon','elevationM'])&&range(v.observer.lat,-90,90)&&range(v.observer.lon,-180,180)&&range(v.observer.elevationM,-1000,100000)&&typeof v.utc==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(v.utc)&&Number.isFinite(Date.parse(v.utc))&&new Date(v.utc).toISOString().slice(0,19)===v.utc.slice(0,19)&&typeof v.live==='boolean'&&['oras-site','provided','unavailable-zero'].includes(v.elevationSource);
}
export function validNavigationEvent(p){return keys(p,['target','phase','progress'])&&['sky','earth'].includes(p.target)&&['idle','boundary','progress','request'].includes(p.phase)&&range(p.progress,0,1);}
export function validNavigationCommand(name,p){
 if(name==='setNavigationView')return keys(p,['mode','camera','center'])&&validNavigationView({mode:p.mode,camera:p.camera})&&(p.center===undefined||p.mode==='earth'&&keys(p.center,['lat','lon'])&&range(p.center.lat,-90,90)&&range(p.center.lon,-180,180));
 if(name==='navigateLocation')return keys(p,['lat','lon'])&&range(p.lat,-90,90)&&range(p.lon,-180,180);
 return keys(p,[])&&Object.keys(p).length===0;
}
