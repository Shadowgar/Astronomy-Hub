import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './helpers/camera-harness.mjs';
test('regional imagery Focus uses a bounded coverage range; events retain ordinary focus and no tracking',async()=>{
 const h=harness();let range;h.viewer.flyTo=async(_entity,options)=>{range=options.offset.range;return true};
 h.viewer.trackedEntity={id:'old'};
 assert.equal(await h.camera.focus({orasMetadata:{layerId:'weather-radar',focusRangeM:5000000}}),true);
 assert.equal(range,5000000);assert.equal(h.viewer.trackedEntity,undefined);
 await h.camera.focus({orasMetadata:{layerId:'earthquakes',focusRangeM:Infinity}});assert.equal(range,40000);
});
