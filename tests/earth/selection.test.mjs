import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
test('empty picking preserves selected identity; explicit layer clearing still clears it',()=>{
 const source=readFileSync(process.env.ORAS_SELECTION_SOURCE||new URL('../../runtimes/earth-runtime/core/SelectionStore.mjs',import.meta.url),'utf8').replace(/^import .*;\n/,'').replace('export class','class')+'; SelectionStore';
 const Store=runInNewContext(source,{Cartesian2:{distance:()=>0},EllipsoidalOccluder:class{},ScreenSpaceEventType:{LEFT_CLICK:'click'}});
 let listener,click,selected,stops=0;const changes=[],viewer={scene:{globe:{ellipsoid:{}}},camera:{positionWC:{}},clock:{currentTime:0},entities:{values:[]},selectedEntityChanged:{addEventListener(fn){listener=fn;return ()=>{}}},screenSpaceEventHandler:{setInputAction(fn){click=fn}}};
 Object.defineProperty(viewer,'selectedEntity',{get:()=>selected,set:value=>{selected=value;listener(value)}});
 const store=new Store(viewer,{stopTracking(){stops++}},value=>changes.push(value)),entity={orasMetadata:{layerId:'oras-site',source_id:'oras-site'}};
 viewer.selectedEntity=entity;stops=0;click({position:{x:450,y:100}});assert.equal(viewer.selectedEntity,entity);assert.equal(store.value,entity);assert.equal(stops,0);assert.equal(changes.at(-1),entity.orasMetadata);
 store.clearLayer('oras-site');assert.equal(viewer.selectedEntity,undefined);assert.equal(store.value,null);assert.equal(changes.at(-1),null);
});
