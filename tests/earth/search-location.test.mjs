import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{runInNewContext}from'node:vm';
test('search marker preserves supplied coordinates, replaces only itself and removes on clear/teardown',()=>{
 const text=readFileSync(new URL('../../runtimes/earth-runtime/core/SearchLocation.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export class','class')+';SearchLocation';
 const Class=runInNewContext(text,{Cartesian3:{fromDegrees:(...x)=>x},Cartesian2:class{},Color:{fromCssColorString:x=>x},HeightReference:{CLAMP_TO_GROUND:1}});const entities=new Map([['protected',{id:'protected'}]]),viewer={entities:{add:e=>(entities.set(e.id,e),e),remove:e=>entities.delete(e.id)},scene:{requestRender(){}}};const s=new Class(viewer);
 s.set({lat:48.8584,lon:2.2945});assert.deepEqual(Array.from(s.entity.position),[2.2945,48.8584,0]);assert.equal(s.entity.label.text,'Selected location');s.set({lat:0,lon:0});assert.equal(entities.size,2);s.set(null);assert.equal(entities.size,1);s.set({lat:41.321903,lon:-79.585394});s.destroy();assert.equal(entities.size,1);assert.ok(entities.has('protected'));
});
