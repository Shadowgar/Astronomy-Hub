import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMessage,envelope} from '../../packages/runtime-protocol/index.mjs';
const session={runtime:'sky',nonce:'a'.repeat(32),generation:1};
const sky={mode:'sky',observer:{lat:41.321903,lon:-79.585394,elevationM:432.816},utc:'2026-10-14T02:00:00.000Z',live:false,camera:{projection:2,fovRad:185*Math.PI/180,yawRad:1,pitchRad:.3,rollRad:0,landscapeVisible:true},elevationSource:'oras-site'};
test('navigation state carries explicit camera units and observer/time without renderer objects',()=>{
 assert.equal(validateMessage(envelope(session,'result',1,'getNavigationState',{ok:true,navigation:sky}),session),true);
 assert.equal(validateMessage(envelope(session,'command',1,'setNavigationView',{mode:'sky',camera:sky.camera}),session),true);
 assert.equal(validateMessage(envelope(session,'result',1,'getNavigationState',{ok:true,navigation:{...sky,camera:{...sky.camera,fovRad:Math.PI/180/3600}}}),session),true);
 for(const bad of [{...sky,camera:{...sky.camera,fovRad:NaN}},{...sky,utc:'invalid'},{...sky,camera:{...sky.camera,projection:999}},{...sky,observer:{...sky.observer,elevationM:Infinity}},{...sky,camera:{...sky.camera,engine:{}}}])assert.equal(validateMessage(envelope(session,'result',1,'getNavigationState',{ok:true,navigation:bad}),session),false);
});
test('navigation intent events reject stale sessions, unknown fields and invalid progress',()=>{
 const event=envelope(session,'event',1,'navigationIntent',{target:'earth',phase:'request',progress:1});
 assert.equal(validateMessage(event,session),true);
 assert.equal(validateMessage({...event,generation:2},session),false);
 for(const payload of [{target:'solar',phase:'request',progress:1},{target:'earth',phase:'request',progress:2},{target:'earth',phase:'request',progress:1,engine:{}}])assert.equal(validateMessage({...event,payload},session),false);
});
test('Earth navigation has a surface observer separate from camera height and permits only bounded restores',()=>{
 const camera={latitudeRad:.7,longitudeRad:-1.3,heightM:1200,headingRad:0,pitchRad:-Math.PI/2,rollRad:0};
 const earth={mode:'earth',observer:{lat:40.7829,lon:-73.9654,elevationM:0},utc:sky.utc,live:false,camera,elevationSource:'unavailable-zero'};
 const earthSession={...session,runtime:'earth'};
 assert.equal(validateMessage(envelope(earthSession,'result',1,'getNavigationState',{ok:true,navigation:earth}),earthSession),true);
 assert.equal(validateMessage(envelope(earthSession,'result',1,'getNavigationState',{ok:true,navigation:{...earth,camera:{...camera,heightM:99.9999999985031}}}),earthSession),true);
 assert.equal(validateMessage(envelope(session,'command',1,'navigateLocation',{lat:40.7829,lon:-73.9654}),session),true);
 assert.equal(validateMessage(envelope(session,'command',1,'navigateLocation',{lat:91,lon:0}),session),false);
 assert.equal(validateMessage(envelope(session,'command',1,'setNavigationView',{mode:'earth',camera:{...camera,heightM:-1}}),session),false);
});
test('optional observer provenance accepts honest zero/provided intents and rejects malformed wire claims',()=>{
 const command=payload=>validateMessage(envelope(session,'command',1,'setObserverIntent',payload),session);
 const observer={lat:40.7829,lon:-73.9654,elevationM:123};assert.equal(command({...observer,elevationSource:'provided'}),true);assert.equal(command({...observer,elevationM:0,elevationSource:'provided'}),true);assert.equal(command({...observer,elevationM:0,elevationSource:'unavailable-zero'}),true);
 assert.equal(command({...observer,elevationSource:'unavailable-zero'}),false);assert.equal(command({...observer,elevationSource:'unknown'}),false);assert.equal(command({...observer,elevationSource:'provided',unexpected:true}),false);
});
