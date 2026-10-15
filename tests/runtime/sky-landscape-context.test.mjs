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
test('embedded landscape selects the illustrative panorama and releases native choices',()=>{
 const p=page(true);assert.equal(p.core.landscapes.current_id,'pennsylvania-woodland-v1');p.select('guereins');assert.equal(p.core.landscapes.current_id,'pennsylvania-woodland-v1');
 assert.deepEqual(JSON.parse(JSON.stringify(p.added)),[{url:'/oras-sky-engine/landscapes/pennsylvania-woodland-v1',key:'pennsylvania-woodland-v1'}]);
 p.core.landscapes.visible=false;p.adapter.presentation(false);assert.equal(p.core.landscapes.current_id,'guereins');assert.equal(p.core.landscapes.visible,false);
 p.select('native-choice');p.adapter.presentation(true);assert.equal(p.core.landscapes.current_id,'pennsylvania-woodland-v1');assert.equal(p.added.length,1);
 p.adapter.presentation(false);assert.equal(p.core.landscapes.current_id,'native-choice');
});
test('panorama never recolors or reactivates the original zero circle',()=>{
 const p=page(true,'zero');assert.equal(p.core.landscapes.current_id,'pennsylvania-woodland-v1');assert.deepEqual(p.core.landscapes.zero.horizon_color,[.1,.15,.1,1]);
 p.adapter.presentation(false);assert.equal(p.core.landscapes.current_id,'zero');assert.deepEqual(p.core.landscapes.zero.horizon_border_color,[.2,.4,.1,1]);
});
