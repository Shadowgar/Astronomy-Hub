import test from 'node:test';
import assert from 'node:assert/strict';
import {LayerRegistry} from '../../runtimes/earth-runtime/core/LayerRegistry.mjs';
import {PollingLayer} from '../../runtimes/earth-runtime/layers/PollingLayer.mjs';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
test('disable while lazy import is pending never initializes the cancelled layer',async()=>{
 const wait=deferred(),events=[];
 const registry=new LayerRegistry({},()=>{});
 registry.register({id:'flights',title:'Aircraft',load:()=>wait.promise});
 const enabling=registry.enable('flights'); await registry.disable('flights');
 wait.resolve({initialize:()=>events.push('initialize'),enable:()=>events.push('enable'),destroy:()=>events.push('destroy')});
 await enabling; assert.deepEqual(events,['destroy']); assert.equal(registry.snapshot()[0].status,'disabled');await registry.destroy();
});
test('failure is retryable and loaded instance is destroyed once',async()=>{
 let attempts=0,destroyed=0;
 const registry=new LayerRegistry({},()=>{});
 registry.register({id:'weather',title:'Weather',load:async()=>{if(++attempts===1)throw Error('unavailable');return {initialize(){},enable(){},disable(){},destroy(){destroyed++}}}});
 await registry.enable('weather');assert.equal(registry.snapshot()[0].status,'unavailable');
 await registry.enable('weather');assert.equal(registry.snapshot()[0].status,'ready');await registry.destroy();await registry.destroy();assert.equal(destroyed,1);
});
test('polling disable aborts request, discards late response and clears resources',async()=>{
 const pending=deferred();let signal,drawn=0,cleared=0;
 const layer=new PollingLayer({id:'flights',interval:10000,read:async s=>{signal=s;return pending.promise},render:()=>drawn++,clear:()=>cleared++});
 layer.initialize({providerStatus:{set(){}},abortSignal:new AbortController().signal});
 const enabling=layer.enable();layer.disable();assert.equal(signal.aborted,true);
 pending.resolve([1]);await enabling;assert.equal(drawn,0);assert.equal(layer.timer,null);layer.destroy();layer.destroy();assert.equal(cleared,2);
});
test('provider failure clears stale entities, reports unavailable and owns no periodic request after disable',async()=>{
 let status,cleared=0;
 const layer=new PollingLayer({id:'satellites',interval:10000,read:async()=>{throw Error('provider unavailable')},render(){},clear:()=>cleared++});
 layer.initialize({providerStatus:{set(_id,s){status=s}},abortSignal:new AbortController().signal});await layer.enable();assert.equal(status.status,'unavailable');assert.ok(cleared);layer.disable();assert.equal(layer.timer,null);layer.destroy();
});

import {RuntimeLifecycle} from '../../runtimes/earth-runtime/core/RuntimeLifecycle.mjs';
test('destroy aborts and releases Viewer even if a layer cleanup throws',async()=>{
 const lifecycle=new RuntimeLifecycle(),events=[];lifecycle.add(()=>events.push('viewer-destroy'));lifecycle.add(()=>{throw Error('failed layer')});
 await lifecycle.destroy();await lifecycle.destroy();assert.equal(lifecycle.controller.signal.aborted,true);assert.deepEqual(events,['viewer-destroy']);assert.equal(lifecycle.cleanupFailures,1);
});

test('successful polling updates do not clear selected/tracked entity resources',async()=>{
 let cleared=0,rendered=0;const layer=new PollingLayer({id:'aircraft',interval:10000,read:async()=>({records:[1]}),render:()=>rendered++,clear:()=>cleared++});
 layer.initialize({providerStatus:{set(){}},abortSignal:new AbortController().signal});await layer.enable();assert.equal(cleared,0);assert.equal(rendered,1);layer.destroy();assert.equal(cleared,1);
});
