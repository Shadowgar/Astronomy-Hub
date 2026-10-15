import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const source=readFileSync(process.env.N1_PLUGIN_SOURCE||new URL('../../runtimes/sky-adapter/plugin.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace('export default','globalThis.plugin=');
function page(embedded,initial='guereins'){
 const window=new EventTarget(),watchers=[],added=[],zero={horizon_color:[.1,.15,.1,1],horizon_border_color:[.2,.4,.1,1]},core={landscapes:{zero,current_id:initial,visible:true,get current(){return this.current_id==='zero'?zero:{}},addDataSource:v=>added.push(v)},observer:{}},state={stel:core,nightmode:false};
 const document={documentElement:{classList:{toggle(){}}},createElement:()=>({textContent:''}),head:{appendChild(){}},querySelector:()=>null};
 const scope={Event,window,document,location:{search:embedded?'?orasEmbedded=1':''},URLSearchParams,BottomBar:{},swh:{},CustomEvent:class extends Event{constructor(name,options){super(name);this.detail=options.detail}},installNativeWheel:()=>Object.assign(()=>{},{reset(){}})};
 const app={$stel:{core},$store:{state,commit:(_name,v)=>{state[v.varName]=v.newValue}},$watch:(read,fn,options)=>{watchers.push({read,fn});if(options?.immediate)fn(read());return ()=>{}}};
 runInNewContext(source,scope);scope.plugin.onEngineReady(app);
 const select=id=>{core.landscapes.current_id=id;for(const w of watchers)w.fn(w.read())};
 return {core,added,adapter:window.orasSkyAdapter,select};
}
test('standalone keeps native landscape selection and visibility toggles',()=>{
 const p=page(false);assert.equal(p.core.landscapes.current_id,'guereins');assert.equal(p.added.length,0);
 p.select('native-choice');assert.equal(p.core.landscapes.current_id,'native-choice');p.core.landscapes.visible=false;p.core.landscapes.visible=true;assert.equal(p.core.landscapes.visible,true);
});
test('embedded exploration alone uses neutral horizon; returning to native presentation releases policy',()=>{
 const p=page(true);assert.equal(p.core.landscapes.current_id,'zero');p.select('guereins');assert.equal(p.core.landscapes.current_id,'zero');
 p.core.landscapes.visible=false;p.adapter.presentation(false);assert.equal(p.core.landscapes.current_id,'guereins');assert.equal(p.core.landscapes.visible,false);
 p.select('native-choice');assert.equal(p.core.landscapes.current_id,'native-choice');p.adapter.presentation(true);assert.equal(p.core.landscapes.current_id,'zero');assert.equal(p.added.length,1);
});

test('embedded neutral style configures native fill/border and restores zero defaults on release',()=>{
 const p=page(true,'zero');assert.deepEqual(Array.from(p.core.landscapes.current.horizon_color),[.035,.04,.05,1]);assert.deepEqual(Array.from(p.core.landscapes.current.horizon_border_color),[.10,.12,.14,1]);
 p.adapter.presentation(false);assert.equal(p.core.landscapes.current_id,'zero');assert.deepEqual(Array.from(p.core.landscapes.current.horizon_color),[.1,.15,.1,1]);assert.deepEqual(Array.from(p.core.landscapes.current.horizon_border_color),[.2,.4,.1,1]);
 p.adapter.presentation(true);assert.deepEqual(Array.from(p.core.landscapes.current.horizon_color),[.035,.04,.05,1]);
});
test('release restores zero colors even when a native landscape change precedes its watcher',()=>{
 const p=page(true);p.core.landscapes.current_id='native-choice';p.adapter.presentation(false);p.core.landscapes.current_id='zero';
 assert.deepEqual(Array.from(p.core.landscapes.current.horizon_color),[.1,.15,.1,1]);assert.deepEqual(Array.from(p.core.landscapes.current.horizon_border_color),[.2,.4,.1,1]);
});
