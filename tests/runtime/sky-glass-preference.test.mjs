import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../runtimes/sky-adapter/plugin.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace('export default','globalThis.plugin=');
test('native frame restores shared opaque preference, follows storage changes and releases listener',()=>{
  const window=new EventTarget(),document={documentElement:{dataset:{}}};let saved='true';
  window.localStorage={getItem:()=>saved};
  const scope={window,document,site:{},BottomBar:{}};runInNewContext(source,scope);
  const stop=scope.installGlassPreference();assert.equal(document.documentElement.dataset.glass,'opaque');
  const change=key=>{const event=new Event('storage');Object.defineProperty(event,'key',{value:key});window.dispatchEvent(event)};
  saved='false';change('other-setting');assert.equal(document.documentElement.dataset.glass,'opaque');
  change('oras.glass.opaque.v1');assert.equal(document.documentElement.dataset.glass,'standard');
  saved='true';change(null);assert.equal(document.documentElement.dataset.glass,'opaque');
  stop();saved='false';change('oras.glass.opaque.v1');assert.equal(document.documentElement.dataset.glass,'opaque');
});
test('unavailable local storage leaves native frame in standard material mode',()=>{
  const window=new EventTarget(),document={documentElement:{dataset:{}}};
  window.localStorage={getItem(){throw new Error('unavailable')}};
  const scope={window,document,site:{},BottomBar:{}};runInNewContext(source,scope);
  scope.installGlassPreference()();assert.equal(document.documentElement.dataset.glass,'standard');
});
