import test from 'node:test';import assert from 'node:assert/strict';
import {surfaceObserver} from '../../runtimes/earth-runtime/core/navigationObserver.mjs';
const site={lat:41.321903,lon:-79.585394,elevationM:432.816};
test('only verified ORAS location reuses its elevation; exploring New York has identified zero fallback',()=>{
 assert.deepEqual(surfaceObserver(site.lat,site.lon,site),{observer:site,elevationSource:'oras-site'});
 assert.deepEqual(surfaceObserver(40.7829,-73.9654,site),{observer:{lat:40.7829,lon:-73.9654,elevationM:0},elevationSource:'unavailable-zero'});
 assert.equal(surfaceObserver(site.lat+.01,site.lon,site).observer.elevationM,0);
 const nativePick=surfaceObserver(site.lat-0.00000146065223,site.lon,site);
 assert.equal(nativePick.observer.elevationM,432.816);assert.equal(nativePick.observer.lat,site.lat-0.00000146065223);
});
