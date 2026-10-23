import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
const source=readFileSync(new URL('../../runtimes/sky-adapter/plugin.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace('export default','globalThis.plugin=')
function runtime(values=new Map(),blocked=false){
 const scope={site:{latitude:41.321903,longitude:-79.585394,elevationMeters:432.816},BottomBar:{},window:{localStorage:{getItem:key=>{if(blocked)throw Error('blocked');return values.get(key)??null},setItem:(key,value)=>{if(blocked)throw Error('blocked');values.set(key,value)}}}}
 runInNewContext(source,scope)
 let watch,stopped=false
 const core={atmosphere:{visible:true}},app={$stel:{core},$store:{state:{stel:core}},$watch:(_read,fn)=>{watch=fn;return ()=>{stopped=true}}}
 assert.equal(typeof scope.installAtmospherePreference,'function','Native adapter must implement the approved default-off preference policy')
 const policy=scope.installAtmospherePreference(app)
 return {core,policy,values,change(value){core.atmosphere.visible=value;if(!stopped)watch(value)},get stopped(){return stopped}}
}
test('fresh embedded Sky defaults atmosphere off without touching other settings',()=>{const values=new Map([['orasDenseStarsProfile','visual-default'],['oras.sky.night-mode.v1','true']]),r=runtime(values);r.policy.apply();assert.equal(r.core.atmosphere.visible,false);assert.equal(values.get('orasDenseStarsProfile'),'visual-default');assert.equal(values.get('oras.sky.night-mode.v1'),'true')})
test('explicit native atmosphere on survives renderer recreation and repeat presentation',()=>{const values=new Map(),r=runtime(values);r.policy.apply();r.change(true);r.policy.apply();assert.equal(r.core.atmosphere.visible,true);const next=runtime(values);next.policy.apply();assert.equal(next.core.atmosphere.visible,true)})
test('explicit native atmosphere off survives renderer recreation',()=>{const values=new Map([['oras.sky.atmosphere.v1','true']]),r=runtime(values);r.policy.apply();r.change(false);const next=runtime(values);next.policy.apply();assert.equal(next.core.atmosphere.visible,false)})
test('invalid or blocked preference storage keeps the approved safe default and usable toggle',()=>{for(const blocked of [false,true]){const r=runtime(new Map([['oras.sky.atmosphere.v1','invalid']]),blocked);r.policy.apply();assert.equal(r.core.atmosphere.visible,false);assert.doesNotThrow(()=>r.change(true));assert.equal(r.core.atmosphere.visible,true)}})
test('standalone state is preserved until embedded presentation and disposal removes watcher',()=>{const r=runtime();assert.equal(r.core.atmosphere.visible,true);r.policy.stop();assert.equal(r.stopped,true)})
