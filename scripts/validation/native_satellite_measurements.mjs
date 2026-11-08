// Shared read-only native measurements; never drives scene state.
export async function sample(f,ids=null,capture=false,maxMagnitude=18,maxRows=32){return f.evaluate(({ids,capture,maxMagnitude,maxRows})=>new Promise(resolve=>requestAnimationFrame(()=>{
  const s=window.__ORAS_STEL,c=s.core,observer=c.observer,canvas=document.querySelector('#stel-canvas'),r=canvas.getBoundingClientRect();
  const aspect=r.width/r.height,fovy=aspect<1?4*Math.atan(Math.tan(c.fov/4)/aspect):c.fov;
  const scale=r.height/(2*Math.tan(fovy/4));
  s._observer_update(observer.v,true);
  const nativeInfo=s.cwrap('obj_get_info_json','number',['number','number','string']);
  const readInfo=(o,name)=>{const ptr=nativeInfo(o.v,observer.v,name);if(!ptr)return null;try{const value=JSON.parse(s.UTF8ToString(ptr));return value?.swe_?value.v:value;}finally{s._free(ptr);}};
  const position=o=>{const ra=o.getInfo('radec',observer),view=s.convertFrame(observer,'ICRF','VIEW',ra),obs=s.convertFrame(observer,'ICRF','OBSERVED',ra),n=Math.hypot(...view.slice(0,3)),v=view.map(x=>x/n);
    const x=r.x+r.width/2+scale*v[0]/(1-v[2]),y=r.y+r.height/2-scale*v[1]/(1-v[2]);
    return {radec:ra,view,observed:obs,pixel:{x,y},onScreen:v[2]<0&&x>r.x+30&&x<r.right-30&&y>r.y+100&&y<r.bottom-150,altitudeDeg:Math.asin(obs[2]/Math.hypot(...obs.slice(0,3)))*180/Math.PI};};
  let objects=[],count;
  if(ids){objects=ids.map(id=>s.getObj('NORAD '+String(id).padStart(5,'0'))).filter(Boolean);}
  else{const pointers=[],cb=s.addFunction((user,ptr)=>{pointers.push(ptr);return 0},'iii');
    try{s._module_list_objs2(c.satellites.v,observer.v,NaN,0,cb);}finally{s.removeFunction(cb);}
    count=pointers.length;
    // Upstream listObjs uses a shared scratch array overwritten by SweObj's
    // constructor. Keep our own pointer array and balance every retained handle.
    objects=pointers.map(ptr=>{const o=new s.SweObj(ptr);o.retain();return o;});}
  const rows=[];
  try{
    const ranked=objects.map(o=>({o,mag:readInfo(o,'vmag')})).filter(x=>Number.isFinite(x.mag)&&x.mag<maxMagnitude).sort((a,b)=>a.mag-b.mag).slice(0,maxRows);
    for(const {o,mag} of ranked){const data=o.jsonData;rows.push({id:String(data.model_data.norad_number),mag,standardMagnitude:data.model_data.mag??null,tle:data.model_data.tle,names:data.names,...position(o)});}
  }finally{for(const o of objects)o.destroy();}
  const stars=[];for(const id of ['HIP 11767']){const o=s.getObj(id);if(!o)continue;try{stars.push({id,...position(o)});}finally{o.destroy();}}
  let image; if(capture){const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.getContext('2d').drawImage(canvas,0,0);image=copy.toDataURL('image/png').split(',')[1];}
  resolve({image,wallUtc:new Date().toISOString(),navigation:window.orasSkyAdapter.navigation(),speed:c.time_speed,selection:!!c.selection,lock:!!c.lock,
    count,visible:c.satellites.visible,hints:c.satellites.hints_visible,offset:c.satellites.hints_mag_offset,
    appearance:{atmosphere:c.atmosphere.visible,exposure:c.exposure_scale,starScale:c.star_linear_scale,bortle:c.bortle_index},
    canvas:{x:r.x,y:r.y,width:r.width,height:r.height},rows:rows.sort((a,b)=>a.mag-b.mag),stars});
})),{ids,capture,maxMagnitude,maxRows});}

export async function pixelStats(p,on,off,targets){return p.evaluate(async({on,off,targets})=>{
  async function decode(b){const bytes=Uint8Array.from(atob(b),c=>c.charCodeAt(0)),im=await createImageBitmap(new Blob([bytes]));const c=new OffscreenCanvas(im.width,im.height),x=c.getContext('2d');x.drawImage(im,0,0);return {width:im.width,height:im.height,data:x.getImageData(0,0,im.width,im.height).data};}
  const a=await decode(on),b=off?await decode(off):null;
  return targets.map(t=>{let white=0,green=0,mass=0,xsum=0,ysum=0;
    for(let y=Math.max(0,Math.floor(t.pixel.y)-4);y<=Math.min(a.height-1,Math.ceil(t.pixel.y)+4);y++)for(let x=Math.max(0,Math.floor(t.pixel.x)-4);x<=Math.min(a.width-1,Math.ceil(t.pixel.x)+4);x++){
      const i=(y*a.width+x)*4,r=a.data[i],g=a.data[i+1],bl=a.data[i+2],delta=b?Math.abs(r-b.data[i])+Math.abs(g-b.data[i+1])+Math.abs(bl-b.data[i+2]):r+g+bl;
      if(delta<6)continue;
      if(g>60&&g-r>20&&g-bl>15)green++;
      if(Math.min(r,g,bl)>3&&Math.max(r,g,bl)-Math.min(r,g,bl)<55){white++;mass+=delta;xsum+=x*delta;ysum+=y*delta;}
    }return {id:t.id,expected:t.pixel,white,green,centroid:mass?{x:xsum/mass,y:ysum/mass}:null};});
},{on:on.toString('base64'),off:off?.toString('base64'),targets});}
