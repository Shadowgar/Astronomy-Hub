import test from 'node:test';import assert from 'node:assert/strict';
import {observerElevationSource,sameObserverLocation} from '../../packages/runtime-protocol/observer-elevation.mjs';
const site={lat:41.321903,lon:-79.585394,elevationM:432.816},ny={lat:40.7829,lon:-73.9654,elevationM:123};
test('provenance follows actual observer and never trusts inconsistent URL claims',()=>{
 assert.equal(observerElevationSource(site,null,site),'oras-site');
 for(const claimed of [null,'provided','oras-site','unavailable-zero','malformed'])assert.equal(observerElevationSource(ny,claimed,site),'provided');
 assert.equal(observerElevationSource({...site,elevationM:123},'oras-site',site),'provided');
 assert.equal(observerElevationSource({...ny,elevationM:0},'provided',site),'provided','provided zero stays provided');
 assert.equal(observerElevationSource({...ny,elevationM:0},'unavailable-zero',site),'unavailable-zero');
 assert.equal(observerElevationSource({...ny,elevationM:0},null,site,true),'unavailable-zero','explicitly identified missing-elevation fallback');
 assert.equal(observerElevationSource({...ny,elevationM:123},null,site,true),'provided');
 assert.equal(sameObserverLocation(ny,{...ny,lat:ny.lat+1e-6}),true);assert.equal(sameObserverLocation(ny,{...ny,lat:ny.lat+.001}),false);
});
