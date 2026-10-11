import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';import {join} from 'node:path';
import {admitIonImagery} from '../../runtimes/earth-runtime/core/displayConfig.mjs';import {CONUS,PEMA_COVERAGE} from '../../runtimes/earth-runtime/core/ImagerySelectionPolicy.mjs';
function load(){
 class Provider{constructor(options){this.options=options;this.requestImage=()=>Promise.resolve('tile')}}let calls=0;
 const Cesium={IonImageryProvider:{fromAssetId:(id,options)=>{calls++;return Promise.resolve(new Provider({id,...options}))}}};
 const source=readFileSync(join(process.env.GODS_EYE_SOURCE??'/var/tmp/oras-cesium/gods-eye','src/maps/imagery.js'),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ','')+';createIonImagery';const createIonImagery=runInNewContext(source,{Cesium});
 const code=readFileSync(new URL('../../runtimes/earth-runtime/core/AdmittedMapSources.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ','')+';({createAdmittedMapSources,SOURCE_FACTS})';
 const api=runInNewContext(code,{WebMapServiceImageryProvider:Provider,UrlTemplateImageryProvider:Provider,Rectangle:{fromDegrees:(...values)=>values},WebMercatorTilingScheme:class{},createDefaultMapSources:()=>({sources:[{descriptor:{id:'osm'},imagery:()=>new Provider({url:'https://tile.openstreetmap.org/'})}]}),MAP_STACKS:[{id:'osm',kind:'osm'}],createIonImagery,admitIonImagery,CONUS,PEMA_COVERAGE});return {...api,get calls(){return calls}};
}
test('remote-only registry strips terrain and unselected billing sources, preserves exact product URLs and caps',async()=>{
 const api=load(),registry=api.createAdmittedMapSources(null,(id,factory)=>factory());assert.deepEqual([...registry.sources.map(s=>s.descriptor.id)],['nasa','eox-2016','usgs-naip','pema','osm']);assert.equal(registry.defaultId,'nasa');assert.equal(registry.unknownId,'nasa');assert.equal(registry.recoveryId,null);assert.ok(registry.sources.every(s=>!s.terrain&&!s.tileset));
 const eox=await registry.sources.find(s=>s.descriptor.id==='eox-2016').imagery({});assert.match(eox.options.url,/s2cloudless_3857/);assert.equal(eox.options.maximumLevel,14);
 const naip=await registry.sources.find(s=>s.descriptor.id==='usgs-naip').imagery({});assert.equal(naip.options.maximumLevel,18);assert.equal(naip.options.parameters.version,'1.3.0');assert.equal(naip.options.layers,'USGSNAIPImagery:NaturalColor');
 const osm=await registry.sources.find(s=>s.descriptor.id==='osm').imagery({});assert.equal(osm.maximumLevel,18);assert.equal(api.calls,0);
 // Cesium 1.138 GlobeSurfaceTileProvider installs/clears its reload callback.
 // The facade accepts SDK lifecycle writes without mutating the source provider.
 const reload=()=>{};osm._reload=reload;assert.equal(osm._reload,reload);osm._reload=undefined;assert.equal(osm._reload,undefined);
});
test('explicit admitted opt-in executes actual pinned ion factory with fixture-only SDK, and requires no default token',async()=>{
 const api=load(),config={schema:1,qualified:true,publicToken:'fixture-publishable-token',publicTokenAttested:true,imageryAsset:2,ionImageryOptIn:true,zeroChargeProtectionAttested:true,ionSessionTileLimit:60};const registry=api.createAdmittedMapSources(config,(id,factory)=>factory());const provider=await registry.sources.find(s=>s.descriptor.id==='ion').imagery({});assert.equal(api.calls,1);assert.equal(provider.options.id,2);assert.equal(provider.maximumLevel,18);assert.equal(registry.sources.find(s=>s.descriptor.id==='ion').constructionFallback.id,'nasa');
});
