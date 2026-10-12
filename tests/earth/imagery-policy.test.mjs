import test from 'node:test';import assert from 'node:assert/strict';
const module=()=>import('../../runtimes/earth-runtime/core/ImagerySelectionPolicy.mjs');
test('Auto respects hysteresis, verified footprints and geographic admission',async()=>{
 const {chooseImagery,PEMA_COVERAGE}=await module();
 const view={height:20e6,rect:[-90,30,-70,45],point:[-79.585394,41.321903]};assert.equal(chooseImagery(view,'nasa'),'nasa');
 assert.equal(chooseImagery({...view,height:1e6},'nasa'),'eox-2016');assert.equal(chooseImagery({...view,height:1.7e6},'eox-2016'),'eox-2016');
 assert.equal(chooseImagery({...view,height:5000,naipCovered:true},'eox-2016'),'usgs-naip');
 assert.equal(chooseImagery({height:1000,rect:PEMA_COVERAGE,point:view.point,naipCovered:true},'usgs-naip'),'pema');
 assert.equal(chooseImagery({height:1000,rect:[1,47,3,49],point:[2,48],naipCovered:false},'nasa'),'eox-2016');
 assert.equal(chooseImagery({height:1000,rect:[-1,87,1,89],point:[0,88]},'eox-2016'),'nasa');
});

test('admitted PEMA rectangle lies inside the exact official ORAS raster footprint',async()=>{
 const {readFileSync}=await import('node:fs');const {PEMA_COVERAGE,inRing}=await module();const ring=JSON.parse(readFileSync(new URL('../fixtures/earth/pema-oras-footprint.json',import.meta.url),'utf8')).features[0].geometry.rings[0];for(const x of [PEMA_COVERAGE[0],PEMA_COVERAGE[2]])for(const y of [PEMA_COVERAGE[1],PEMA_COVERAGE[3]])assert.equal(inRing([x,y],ring),true);
});

test('dateline regional views retain EOX coverage without admitting a wrapped CONUS view',async()=>{
 const {chooseImagery,containsView,CONUS}=await module();
 for(const rect of [[178,-20,-179,-15],[179,50,-178,55],[-180,-10,180,10]])assert.equal(chooseImagery({height:1e6,rect,point:[179,-17]},'nasa'),'eox-2016');
 assert.equal(containsView(CONUS,[179,30,-179,40]),false);
 assert.equal(chooseImagery({height:1e6,rect:[178,87,-179,89],point:[179,88]},'eox-2016'),'nasa');
});
