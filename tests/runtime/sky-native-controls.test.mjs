import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../../runtimes/sky-adapter/entry.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function page(){
 const window=new EventTarget(),document=new EventTarget(),events=[];
 window.orasSkyAdapter={panelOpen:()=>false};document.querySelector=()=>null;document.documentElement={classList:{contains:()=>true}};
 runInNewContext(source,{window,document,installSkyPanelReports:()=>()=>{},createRuntimeEndpoint:()=>({ready(){},emit:(_name,data)=>events.push(JSON.parse(JSON.stringify(data)))}),clearTimeout(){}});
 const dispatch=(type,fields)=>{const event=new Event(type,{cancelable:true});for(const [key,value] of Object.entries(fields))Object.defineProperty(event,key,{value});document.dispatchEvent(event);return event};
 return {events,dispatch,window};
}
test('native search retains normal Tab and Escape handling',()=>{
 const p=page(),target={closest:()=>({})};
 for(const key of ['Tab','Escape'])assert.equal(p.dispatch('keydown',{key,target}).defaultPrevented,false);
 assert.deepEqual(p.events,[]);
});
test('native toolbar retains Tab but forwards Escape recovery; native panels keep Escape',()=>{
 const p=page(),target={closest:selector=>selector.includes('.oras-workspace-bottom')?{}:null};
 p.dispatch('keydown',{key:'Tab',target});assert.deepEqual(p.events,[]);
 p.dispatch('keydown',{key:'Escape',target});assert.deepEqual(p.events,[{active:false,focused:false,key:'Escape'}]);
 p.window.orasSkyAdapter.panelOpen=()=>true;p.dispatch('keydown',{key:'Escape',target});assert.equal(p.events.length,1);
});
test('focusing native controls keeps Hub chrome available and leaving restores exploration',()=>{
 const p=page();p.dispatch('focusin',{target:{closest:()=>({})}});assert.equal(p.events.at(-1).focused,true);
 p.dispatch('focusout',{relatedTarget:null});assert.equal(p.events.at(-1).focused,false);
});
