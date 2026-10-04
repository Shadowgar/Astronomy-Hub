/** Strict serializable normalized Earth DTOs; no third-party provider payloads. */
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const keys=(v,allowed)=>object(v)&&Object.keys(v).every(k=>allowed.includes(k));
const text=(v,max=160)=>typeof v==='string'&&v.length>0&&v.length<=max;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const nullable=(v,check)=>v===null||check(v);
const utc=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const fresh=(value,maxAge)=>utc(value)&&Date.now()-Date.parse(value)>=-300000&&Date.now()-Date.parse(value)<=maxAge;
export function validPolygons(value){
 if(!Array.isArray(value)||value.length<1||value.length>32)return false;let total=0;
 for(const rings of value){if(!Array.isArray(rings)||rings.length<1||rings.length>16)return false;for(const ring of rings){if(!Array.isArray(ring)||ring.length<4||ring.length>5000)return false;total+=ring.length;if(total>10000)return false;if(!ring.every(p=>Array.isArray(p)&&p.length===2&&finite(p[0])&&finite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90))return false;if(ring[0][0]!==ring.at(-1)[0]||ring[0][1]!==ring.at(-1)[1])return false;}}return true;
}
export function validEventFeed(v,kind){
 if(!keys(v,['schemaVersion','kind','temporalMode','source','observedAt','fetchedAt','records','limited'])||v.schemaVersion!==1||v.kind!==kind||!['earthquakes','fire-perimeters'].includes(kind)||v.temporalMode!==(kind==='earthquakes'?'EVENT_FEED':'CURRENT_SNAPSHOT')||!text(v.source)||!fresh(v.fetchedAt,kind==='earthquakes'?180000:600000)||!nullable(v.observedAt,utc)||typeof v.limited!=='boolean'||!Array.isArray(v.records)||v.records.length>(kind==='earthquakes'?500:100))return false;
 if(kind==='earthquakes'&&!fresh(v.observedAt,900000))return false;let vertices=0;const ids=new Set();
 for(const r of v.records){if(!keys(r,['id','name','lat','lon','occurredAt','updatedAt','magnitude','depthKm','acres','containedPct','polygons'])||!text(r.id)||ids.has(r.id)||!text(r.name)||!finite(r.lat)||Math.abs(r.lat)>90||!finite(r.lon)||Math.abs(r.lon)>180||!nullable(r.occurredAt,utc)||!nullable(r.updatedAt,utc)||!nullable(r.depthKm,finite)||!nullable(r.acres,x=>finite(x)&&x>=0)||!nullable(r.containedPct,x=>finite(x)&&x>=0&&x<=100))return false;
  if(kind==='earthquakes'){if(!finite(r.magnitude)||r.magnitude<2.5||r.magnitude>10||!fresh(r.occurredAt,86400000+180000)||r.polygons!==null)return false;}else{if(r.magnitude!==null||!validPolygons(r.polygons))return false;vertices+=r.polygons.flat(2).length;if(vertices>25000)return false;}ids.add(r.id);
 }return true;
}
export function validRadarFeed(v){return keys(v,['schemaVersion','product','temporalMode','source','latest','times','bounds','fetchedAt','tileSize','maxLevel','tilingScheme'])&&v.schemaVersion===1&&v.product==='radar'&&v.temporalMode==='CURRENT_SNAPSHOT'&&v.source==='NOAA/NWS nowCOAST'&&fresh(v.latest,1800000)&&fresh(v.fetchedAt,600000)&&Array.isArray(v.times)&&v.times.length===1&&v.times[0]===v.latest&&keys(v.bounds,['west','south','east','north'])&&v.bounds.west===-130&&v.bounds.south===20&&v.bounds.east===-60&&v.bounds.north===55&&v.tileSize===256&&v.maxLevel===6&&v.tilingScheme==='geographic';}
