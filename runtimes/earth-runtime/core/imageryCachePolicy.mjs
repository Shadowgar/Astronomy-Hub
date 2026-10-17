export const IMAGERY_CACHE_NAME='oras-earth-imagery.v1';
const MiB=1048576;
export function cacheResource(request,origin){
 if(request.method!=='GET'||request.cache==='no-store'||request.headers.has('authorization')||request.headers.has('cookie')||request.headers.has('proxy-authorization')||request.credentials==='include')return null;
 const u=new URL(request.url);if(u.username||u.password||request.credentials==='include'&&u.origin!==origin||request.mode==='no-cors'&&u.origin!==origin)return null;
 if([...u.searchParams.keys()].some(k=>/(?:token|key|auth|password|signature|credential)/i.test(k)))return null;
 let provider,edition;
 if(u.origin===origin&&u.pathname.startsWith('/earth-runtime/cesium/Assets/Textures/NaturalEarthII/')){provider='local';edition='NaturalEarthII-cesium1.138.0';}
 else if(u.protocol==='https:'&&u.hostname==='tiles.maps.eox.at'&&u.pathname.startsWith('/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/')){provider='eox-2016';edition='2016';}
 // PEMA remains qualified local-view/native-HTTP only; no independent managed copy.
 else if(u.protocol==='https:'&&u.hostname==='imagery.nationalmap.gov'&&u.pathname==='/arcgis/services/USGSNAIPImagery/ImageServer/WMSServer'&&[...u.searchParams].some(([k,v])=>k.toLowerCase()==='request'&&v.toLowerCase()==='getmap')){provider='usgs-naip';edition='service-mosaic-dates-vary';}
 else if(u.protocol==='https:'&&u.hostname==='gibs.earthdata.nasa.gov'&&u.pathname==='/wms/epsg4326/best/wms.cgi'&&[...u.searchParams].some(([k,v])=>k.toLowerCase()==='layers'&&v==='BlueMarble_ShadedRelief_Bathymetry')){provider='nasa';edition='BlueMarble-static';}
 else return null;
 return {provider,edition,url:u.href,key:origin+'/earth-runtime/__imagery_cache__/v1/'+provider+'/'+edition+'?url='+encodeURIComponent(u.href)};
}
export function cacheExpiry(response,now){
 if(response.headers.has('set-cookie')||!response.ok||response.type==='opaque'||response.type==='opaqueredirect')return 0;
 const cc=response.headers.get('cache-control')??'',vary=response.headers.get('vary')??'',pragma=response.headers.get('pragma')??'';
 if(/(?:^|,)\s*(?:no-store|no-cache|private)\b/i.test(cc)||/no-cache/i.test(pragma)||vary.split(',').some(v=>v.trim()&&v.trim().toLowerCase()!=='origin'))return 0;
 const date=Date.parse(response.headers.get('date')),expires=Date.parse(response.headers.get('expires')),match=cc.match(/(?:^|,)\s*max-age\s*=\s*"?(\d+)/i),age=Number(response.headers.get('age')??0);
 let end=Number.isFinite(expires)?expires:0;
 if(match){const ttl=Number(match[1])*1000;if(ttl<=0)return 0;
  // CORS may hide Date/Age. Do not invent a new freshness lifetime on an HTTP-cache hit.
  if(Number.isFinite(date))end=now+ttl-Math.max(0,now-date,Number.isFinite(age)?age*1000:0);
  else if(end)end=Math.min(end,now+ttl);else return 0;
 }
 return end>now?end:0;
}
export function cacheBudget(estimate,ownedBytes=0){
 if(!Number.isFinite(estimate?.quota)||!Number.isFinite(estimate?.usage))return 64*MiB;
 return Math.max(0,Math.floor(Math.min(512*MiB,estimate.quota*.1,Math.max(0,estimate.quota-estimate.usage)*.5+ownedBytes)));
}
