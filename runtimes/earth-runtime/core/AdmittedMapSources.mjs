import {WebMapServiceImageryProvider,UrlTemplateImageryProvider,Rectangle,WebMercatorTilingScheme} from 'cesium';
import {createDefaultMapSources} from 'gods-eye-view/maps/defaults';
import {MAP_STACKS} from 'gods-eye-view/maps/catalog';
import {createIonImagery} from 'gods-eye-view/maps/imagery';
import {CONUS,PEMA_COVERAGE} from './ImagerySelectionPolicy.mjs';
import {admitIonImagery} from './displayConfig.mjs';

export const SOURCE_FACTS=Object.freeze({
 local:{label:'Local · Natural Earth',product:'Natural Earth II · cartographic raster',date:null,gsd:null,coverage:'Global bundled safety base',credit:'Natural Earth · public domain',url:'https://www.naturalearthdata.com/about/terms-of-use/'},
 nasa:{label:'NASA · Blue Marble',product:'Static Blue Marble composite',date:null,gsd:500,coverage:'Global overview; not current photography',credit:'NASA GIBS · Blue Marble',url:'https://nasa-gibs.github.io/gibs-api-docs/',host:'gibs.earthdata.nasa.gov',cap:8},
 'eox-2016':{label:'EOX · Global Satellite',product:'Sentinel-2 cloudless · 2016 mosaic',date:null,gsd:10,coverage:'Web Mercator ±85.051°; capture dates vary',credit:'EOX::Maps · Sentinel-2 cloudless 2016 · CC BY 4.0',url:'https://maps.eox.at/',host:'tiles.maps.eox.at',cap:14},
 'usgs-naip':{label:'USGS NAIP · U.S. Close-up',product:'NAIP aerial mosaic · dates vary',date:null,gsd:null,coverage:'CONUS acquisition footprints; partial/no-data pixels possible',credit:'USDA/NAIP · USGS National Geospatial Program',url:'https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map',host:'imagery.nationalmap.gov',cap:18,tileTimeoutMs:20000},
 pema:{label:'PEMA/PASDA · Pennsylvania Ultra-HD',product:'PEMA 2021–2023 collection · ORAS tile 2022',date:null,gsd:0.15240030480060962,coverage:'Verified ORAS extent only · local development; release permission unverified',credit:'PEMA · PASDA/Penn State · NV5 Geospatial',url:'https://www.pasda.psu.edu/uci/DataSummary.aspx?dataset=5178',host:'maps.pasda.psu.edu',cap:20},
 osm:{label:'OSM · Streets',product:'OpenStreetMap standard raster streets',date:null,gsd:null,coverage:'Cartography; not aerial photography',credit:'© OpenStreetMap contributors',url:'https://www.openstreetmap.org/copyright',host:'tile.openstreetmap.org',cap:18},
 ion:{label:'Cesium ion · Optional imagery',product:'Explicitly configured ion imagery',date:null,gsd:null,coverage:'Asset-dependent · live integration unverified',credit:'Cesium ion · asset/provider terms and SDK credits apply',url:'https://cesium.com/learn/ion/content-usage-and-attribution-guide/',host:'ion-opaque-hosts',cap:18},
});
// Provider facade: cap an SDK factory without changing its private fields.
// Cesium 1.138 installs/clears _reload during layer attachment/removal. Keep that
// SDK-owned callback on the facade; the Hub never writes upstream controller fields.
export function capImagery(provider,maximumLevel){
 const overrides=new Map();return new Proxy(provider,{get(target,key){if(overrides.has(key))return overrides.get(key);if(key==='maximumLevel')return maximumLevel;if(key==='enablePickFeatures')return false;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},set(target,key,value){if(!['requestImage','_reload'].includes(key))throw Error('Unsupported provider facade write');overrides.set(key,value);return true;}});
}
export function createAdmittedMapSources(config,wrap){
 const defaults=createDefaultMapSources({cesiumToken:'',googleApiKey:''});
 const osm=defaults.sources.find(source=>source.descriptor.id==='osm');
 const osmDescriptor=MAP_STACKS.find(source=>source.id==='osm');
 const wms=(url,layers,options={})=>new WebMapServiceImageryProvider({url,layers,parameters:{format:'image/png',transparent:true,version:'1.3.0'},enablePickFeatures:false,tileWidth:256,tileHeight:256,...options});
 const factories={
  nasa:()=>wms('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi','BlueMarble_ShadedRelief_Bathymetry',{parameters:{format:'image/jpeg',transparent:false,version:'1.1.1'},tileWidth:512,tileHeight:512,maximumLevel:8,credit:SOURCE_FACTS.nasa.credit}),
  'eox-2016':()=>new UrlTemplateImageryProvider({url:'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg',maximumLevel:14,rectangle:Rectangle.fromDegrees(-180,-85.051129,180,85.051129),enablePickFeatures:false,credit:SOURCE_FACTS['eox-2016'].credit}),
  'usgs-naip':()=>wms('https://imagery.nationalmap.gov/arcgis/services/USGSNAIPImagery/ImageServer/WMSServer','USGSNAIPImagery:NaturalColor',{tilingScheme:new WebMercatorTilingScheme(),rectangle:Rectangle.fromDegrees(...CONUS),minimumLevel:3,maximumLevel:18,credit:SOURCE_FACTS['usgs-naip'].credit}),
  pema:()=>new UrlTemplateImageryProvider({url:'https://maps.pasda.psu.edu/ArcGIS/rest/services/PEMAImagery2021_2023cache/MapServer/tile/{z}/{y}/{x}',rectangle:Rectangle.fromDegrees(...PEMA_COVERAGE),minimumLevel:13,maximumLevel:20,enablePickFeatures:false,credit:SOURCE_FACTS.pema.credit}),
  osm:()=>capImagery(osm.imagery(),18),
 };
 const ion=admitIonImagery(config);if(ion)factories.ion=async()=>capImagery(await createIonImagery(ion.imageryAsset,ion.publicToken),18);
 const next={pema:'usgs-naip','usgs-naip':'eox-2016','eox-2016':'nasa',osm:'nasa',ion:'nasa'};
 const sources=Object.entries(factories).map(([id,factory])=>({descriptor:{...(id==='osm'?osmDescriptor:{}),id,label:SOURCE_FACTS[id].label,kind:'imagery'},available:true,imagery:request=>wrap(id,factory,request),credit:SOURCE_FACTS[id].credit,...(next[id]?{constructionFallback:{id:next[id],message:`${SOURCE_FACTS[id].label} unavailable; using ${SOURCE_FACTS[next[id]].label}`},tileFailureFallback:{id:next[id],threshold:['usgs-naip','pema'].includes(id)?3:1,message:`${SOURCE_FACTS[id].label} tiles unavailable; using ${SOURCE_FACTS[next[id]].label}`}}:{})}));
 for(const source of sources){const visited=new Set();let id=source.descriptor.id;while(id){if(visited.has(id))throw Error('Tile fallback cycle');visited.add(id);const entry=sources.find(item=>item.descriptor.id===id);if(!entry)throw Error('Unknown tile fallback');id=entry.tileFailureFallback?.id;}}
 return {defaultId:'nasa',unknownId:'nasa',recoveryId:null,state:{hasCesiumIonToken:!!ion},sources};
}
export function createLabels(){return new UrlTemplateImageryProvider({url:'https://tiles.maps.eox.at/wmts/1.0.0/overlay_bright_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.png',maximumLevel:12,rectangle:Rectangle.fromDegrees(-180,-85.051129,180,85.051129),enablePickFeatures:false,credit:'EOX::Maps · EOX/MapServer · © OpenStreetMap contributors'});}
