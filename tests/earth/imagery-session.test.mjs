import test from 'node:test';
import assert from 'node:assert/strict';
import {openImagerySession} from '../../runtimes/earth-runtime/core/imagerySession.mjs';
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}};
test('manual preference and accepted ion usage survive renderer recreation in the same browser tab',()=>{
 const store=storage(),first=openImagerySession(store);first.setMode('pema');first.recordIonRequest();first.recordIonRequest();
 const next=openImagerySession(store);assert.equal(next.mode,'pema');assert.equal(next.ionUsed,2);assert.equal(next.canUseIon(2),false);next.setMode('auto');assert.equal(openImagerySession(store).mode,'auto');assert.equal(openImagerySession(store).ionUsed,2);
});
test('ion cannot dispatch without a durable tab ledger, including a later storage failure',()=>{
 const unavailable=openImagerySession(null);assert.equal(unavailable.canUseIon(60),false);unavailable.setMode('local');assert.equal(unavailable.mode,'local');
 const store=storage(),session=openImagerySession(store);assert.equal(session.canUseIon(60),true);store.setItem=()=>{throw Error('Denied storage')};session.recordIonRequest();assert.equal(session.canUseIon(60),false);
});
