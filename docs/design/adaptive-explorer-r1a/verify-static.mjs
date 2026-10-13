// Node-only reference contracts. Synthetic focus objects are NOT browser proof.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('./',import.meta.url);
const current=readFileSync(new URL('reference.js',root),'utf8');
// Supply a JSON map exported from the reviewed Git revision; no child processes.
const baselineFiles=JSON.parse(readFileSync(process.argv[2],'utf8'));
const baseline=baselineFiles['reference.js'];
function harness(source){
 const app={}, body={classList:{toggle(){}}};let aside;
 const document={body,activeElement:body,querySelector(selector){
  if(selector==='#app')return app;
  if(selector==='#modal')return modal;
  if(selector==='[data-panel="settings"]')return rail;
  if(selector==='[data-explore]')return explore;
  if(selector==='.panel')return aside;
  if(selector==='.explorer')return {classList:{add(){},remove(){}},append(el){aside=el;}};
  return {};
 },querySelectorAll(selector){return selector==='[aria-expanded="true"]'?[rail,explore].filter(e=>e.getAttribute('aria-expanded')==='true'):[];},createElement(){return {setAttribute(){},querySelector(){return {focus(){}};},remove(){aside=null;inner.isConnected=false;}};}};
 const target=()=>({isConnected:true,attributes:{},setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];},focus(){document.activeElement=this;}});
 const rail=target(),inner=target(),explore=target();
 const modal={open:false,contains(){return false;},showModal(){this.open=true;},close(){this.open=false;}};
 const context=vm.createContext({document,URLSearchParams,location:{search:'',href:'http://localhost/explorer.html'},history:{replaceState(){}},matchMedia:()=>({matches:false}),rail,inner});
 vm.runInContext(source.slice(0,source.indexOf("document.addEventListener('click'")),context);
 return {context,document,app,rail,inner,explore};
}
function markup(source,mode,panel){
 const h=harness(source);
 vm.runInContext(`mode=${JSON.stringify(mode)};render();`,h.context);
 if(!panel)return h.app.innerHTML;
 vm.runInContext(`panel=html=>{globalThis.output=html;};showPanel(${JSON.stringify(panel)});`,h.context);
 return h.context.output;
}
test('Other modes retain identical shell and panel markup',()=>{
 for(const [mode,panels] of Object.entries({earth:['layers','weather','aircraft','satellite','source','context'],solar:['orbit','time','settings','source','context'],moon:['landmark','layers','terrain','info','source','context']})){
  for(const panel of [null,...panels])assert.equal(markup(current,mode,panel),markup(baseline,mode,panel),`${mode}/${panel||'shell'}`);
 }
 for(const name of ['gallery.css','explorer.html','review.html','system.html']){
  const prior=Buffer.from(baselineFiles[name]);
  assert.deepEqual(readFileSync(new URL(name,root)),prior,name);
 }
});
test('Sky has nine original controls plus advanced J2000; Fullscreen is an action',()=>{
 const groups=['constellation','eye','settings'].map(id=>markup(current,'sky',id));
 const names=[...groups.join('').matchAll(/data-sky-control="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(names,['Constellations','Constellation Art','Atmosphere','Landscape','Azimuthal Grid','Equatorial Grid','Deep Sky Objects','Equatorial J2000 Grid','Night Mode']);
 assert.match(groups[1],/<details><summary[^>]*>Advanced observing<\/summary>.*Equatorial J2000 Grid/);
 const fullscreen=groups[2].match(/<button[^>]*data-sky-action="fullscreen"[^>]*>/)?.[0];
 assert(fullscreen);assert(!fullscreen.includes('aria-pressed'));
 for(const mode of ['earth','solar','moon'])for(const panel of ['settings','eye','constellation'])assert(!markup(current,mode,panel).includes('data-sky-'));
});
test('Synthetic nested-dialog lifetime keeps independent panel return target',()=>{
 const h=harness(current);
 vm.runInContext("panel('Weather',rail);openDialog('Unavailable',inner);closeDialog();",h.context);
 assert.equal(h.document.activeElement,h.inner);
 vm.runInContext('closePanel();',h.context);
 assert.equal(h.inner.isConnected,false);
 assert.equal(h.document.activeElement,h.rail);
});
test('Synthetic baseline reproduces nested-panel focus loss',()=>{
 const h=harness(baseline);
 vm.runInContext("panel('Weather',rail);openDialog('Unavailable',inner);closeDialog();closePanel();",h.context);
 assert.notEqual(h.document.activeElement,h.rail);
 assert.equal(h.document.activeElement.isConnected,false);
});

test('Restored Sky Display owns expanded state and dismissal focus',()=>{
 const h=harness(current);let restore;
 h.context.window={addEventListener(name,handler){if(name==='popstate')restore=handler;}};
 h.context.location.search='?mode=sky';
 vm.runInContext(current.slice(current.indexOf("window.addEventListener('popstate'"),current.indexOf('\nrender();\nconst initial')),h.context);
 restore({state:{r1aView:{panel:'settings'}}});
 assert.equal(h.rail.getAttribute('aria-expanded'),'true');
 assert.notEqual(h.explore.getAttribute('aria-expanded'),'true');
 vm.runInContext('closePanel();',h.context);
 assert.equal(h.rail.getAttribute('aria-expanded'),'false');
 assert.equal(h.document.activeElement,h.rail);
});
test('Native Advanced observing disclosure has a scoped 44px minimum; other CSS unchanged',()=>{
 const css=readFileSync(new URL('reference.css',root),'utf8');
 const rule='.explorer[data-mode="sky"] summary.control-row { min-height: 44px; min-width: 44px; }\n';
 assert(css.includes(rule),'Sky disclosure needs an explicit minimum touch target');
 assert.equal(css.replace(rule,''),baselineFiles['reference.css']);
 const html=markup(current,'sky','eye');
 assert.match(html,/<details><summary class="control-row">Advanced observing<\/summary>/);
 assert(!html.includes('tabindex="-1"'));
});
