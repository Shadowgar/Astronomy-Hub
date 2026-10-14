import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../../runtimes/sky-adapter/plugin.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace('export default','globalThis.plugin=');
const scope={BottomBar:{},swh:{},installNativeWheel(){}};runInNewContext(source,scope);
const component=scope.plugin.guiComponents.find(c=>c.name==='oras-workspace-bottom');
function view(panel,fullscreen=false){
 const core={constellations:{lines_visible:false,labels_visible:false,images_visible:false},atmosphere:{visible:false},landscapes:{visible:false},lines:{azimuthal:{visible:false},equatorial_jnow:{visible:false},equatorial:{visible:false}},dsos:{visible:false}};
 const calls=[],vm={embedded:true,panel,$stel:{core},$store:{state:{stel:core,nightmode:false,fullscreen}},setNightMode:b=>calls.push(['night',b]),toggleFullscreen:()=>calls.push(['fullscreen',true])};
 const h=(tag,data,children)=>Array.isArray(data)?{tag,children:data}:{tag,...data,children};
 const tree=component.render.call(vm,h),nodes=[];const walk=n=>{if(n&&typeof n==='object'){nodes.push(n);for(const child of n.children||[])walk(child)}};walk(tree);
 return {core,calls,nodes,button:id=>nodes.find(n=>n.attrs?.['data-sky-control']===id||n.attrs?.['data-sky-action']===id)};
}
test('constellation toggle updates native lines AND names; art stays independent',()=>{const v=view('constellations');v.button('constellations').on.click();assert.equal(v.core.constellations.lines_visible,true);assert.equal(v.core.constellations.labels_visible,true);assert.equal(v.core.constellations.images_visible,false);v.button('art').on.click();assert.equal(v.core.constellations.images_visible,true)});
test('observing controls address original SWE paths including distinct of-date and J2000 grids',()=>{const v=view('observing');for(const id of ['atmosphere','landscape','azimuthal','equatorial','dsos','j2000'])assert.ok(v.button(id));v.button('equatorial').on.click();assert.equal(v.core.lines.equatorial_jnow.visible,true);assert.equal(v.core.lines.equatorial.visible,false);v.button('j2000').on.click();assert.equal(v.core.lines.equatorial.visible,true);v.button('atmosphere').on.click();v.button('landscape').on.click();v.button('azimuthal').on.click();v.button('dsos').on.click();assert.equal(v.core.atmosphere.visible,true);assert.equal(v.core.landscapes.visible,true);assert.equal(v.core.lines.azimuthal.visible,true);assert.equal(v.core.dsos.visible,true)});
test('Night Mode reuses BottomBar and Fullscreen is an action',()=>{assert.equal(component.extends,scope.BottomBar);const v=view('display');v.button('night').on.click();v.button('fullscreen').on.click();assert.deepEqual(v.calls,[['night',true],['fullscreen',true]]);assert.equal(v.button('fullscreen').attrs['aria-pressed'],undefined)});
test('dismissal restores the connected immediate tool launcher and clears stale ownership',()=>{let focus=0;const vm={panel:'observing',panelLauncher:{isConnected:true,focus(){focus++}},$nextTick:f=>f()};component.methods.dismiss.call(vm);assert.equal(vm.panel,null);assert.equal(vm.panelLauncher,null);assert.equal(focus,1);component.methods.dismiss.call(vm);assert.equal(focus,1)});
test('standalone native interface remains untouched',()=>assert.equal(component.render.call({embedded:false},()=>{}),null));

test('embedded fullscreen targets the whole Hub and retains native state synchronization',async()=>{const calls=[],owner={fullscreenElement:null,documentElement:{requestFullscreen:async()=>calls.push('enter')},exitFullscreen:async()=>calls.push('exit')};scope.window={parent:{}};const vm={fullscreenDocument:owner};await component.methods.toggleFullscreen.call(vm);owner.fullscreenElement={};await component.methods.toggleFullscreen.call(vm);assert.deepEqual(calls,['enter','exit']);assert.equal(vm.fullscreenError,'')});

test('Vue receives explicit true/false ARIA strings, never false attributes that it removes',()=>{const v=view('observing');assert.equal(v.button('atmosphere').attrs['aria-pressed'],'false');for(const n of v.nodes.filter(n=>n.attrs?.['aria-expanded']!==undefined))assert.ok(['true','false'].includes(n.attrs['aria-expanded']))});
test('renderer disposal removes its listener from the parent document',()=>{const events=[],owner={addEventListener:(...v)=>events.push(['add',...v]),removeEventListener:(...v)=>events.push(['remove',...v])};scope.window={parent:{document:owner},addEventListener(){},removeEventListener(){}};const vm={onFullscreenChange(){}};vm.releaseFullscreen=()=>component.methods.releaseFullscreen.call(vm);component.mounted.call(vm);component.beforeDestroy.call(vm);assert.equal(events[0][0],'add');assert.equal(events[1][0],'remove');assert.equal(events[0][1],'fullscreenchange');assert.equal(events[0][2],events[1][2])});
test('mount immediately synchronizes an already-fullscreen Hub, then observes later exits',()=>{let notify;const values=[],owner={fullscreenElement:{},addEventListener:(_name,fn)=>{notify=fn},removeEventListener(){}};scope.window={parent:{document:owner},addEventListener(){},removeEventListener(){}};const vm={onFullscreenChange:value=>values.push(value),releaseFullscreen(){}};component.mounted.call(vm);assert.deepEqual(values,[true]);owner.fullscreenElement=null;notify();assert.deepEqual(values,[true,false])});
function fullscreenPage(){
 const owner=new EventTarget(),window=new EventTarget(),active=new Map(),notifications=[];
 for(const target of [owner,window]){
  const listeners=new Map();active.set(target,listeners);
  const add=target.addEventListener.bind(target),remove=target.removeEventListener.bind(target);
  target.addEventListener=(type,fn)=>{if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);add(type,fn)};
  target.removeEventListener=(type,fn)=>{listeners.get(type)?.delete(fn);remove(type,fn)};
 }
 owner.fullscreenElement={};window.parent={document:owner};scope.window=window;
 const vm={onFullscreenChange:value=>notifications.push(value)};
 vm.releaseFullscreen=()=>component.methods.releaseFullscreen.call(vm);component.mounted.call(vm);
 return {owner,window,vm,notifications,count:(target,type)=>active.get(target).get(type)?.size||0,
  dispatch(type,persisted){const e=new Event(type);Object.defineProperty(e,'persisted',{value:persisted});window.dispatchEvent(e)}};
}
test('cached pageshow reseeds actual fullscreen and label, then continues observing native changes',()=>{
 const p=fullscreenPage();p.dispatch('pagehide',true);p.owner.fullscreenElement=null;
 p.dispatch('pageshow',true);assert.equal(p.notifications.at(-1),false);
 assert.equal(view('display',p.notifications.at(-1)).button('fullscreen').children[0],'Fullscreen');
 p.owner.fullscreenElement={};p.owner.dispatchEvent(new Event('fullscreenchange'));
 assert.equal(p.notifications.at(-1),true);
 assert.equal(view('display',p.notifications.at(-1)).button('fullscreen').children[0],'Exit fullscreen');
 component.beforeDestroy.call(p.vm);
});
test('repeated cached navigation retains exactly one fullscreen listener; genuine departure cleans all ownership',()=>{
 const p=fullscreenPage();
 for(let i=0;i<3;i++){
  p.dispatch('pagehide',true);p.dispatch('pageshow',true);
  assert.equal(p.count(p.owner,'fullscreenchange'),1);
  assert.equal(p.count(p.window,'pageshow'),1);assert.equal(p.count(p.window,'pagehide'),1);
  const before=p.notifications.length;p.owner.dispatchEvent(new Event('fullscreenchange'));
  assert.equal(p.notifications.length,before+1);
 }
 p.dispatch('pagehide',false);
 for(const type of ['pagehide','pageshow','oras-sky-dispose'])assert.equal(p.count(p.window,type),0);
 assert.equal(p.count(p.owner,'fullscreenchange'),0);
 const before=p.notifications.length;p.dispatch('pageshow',true);p.owner.dispatchEvent(new Event('fullscreenchange'));
 assert.equal(p.notifications.length,before);component.beforeDestroy.call(p.vm);
});
test('explicit renderer disposal removes cached resume listeners and remains safe before Vue destruction',()=>{
 const p=fullscreenPage();p.dispatch('pagehide',true);p.window.dispatchEvent(new Event('oras-sky-dispose'));
 assert.equal(p.count(p.owner,'fullscreenchange'),0);
 for(const type of ['pagehide','pageshow','oras-sky-dispose'])assert.equal(p.count(p.window,type),0);
 component.beforeDestroy.call(p.vm);
});
