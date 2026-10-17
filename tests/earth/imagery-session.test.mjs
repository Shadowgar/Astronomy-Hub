import test from 'node:test';
import assert from 'node:assert/strict';
import {openImagerySession} from '../../runtimes/earth-runtime/core/imagerySession.mjs';
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}};
test('legacy source preference is discarded while accepted ion usage survives renderer recreation',()=>{
 const store=storage();store.setItem('oras-earth-imagery-session.v1',JSON.stringify({mode:'pema',ionUsed:2}));
 const first=openImagerySession(store);assert.equal(first.mode,undefined);assert.equal(first.ionUsed,2);assert.equal(first.canUseIon(2),false);
 assert.deepEqual(JSON.parse(store.getItem('oras-earth-imagery-session.v1')),{ionUsed:2});first.recordIonRequest();assert.equal(openImagerySession(store).ionUsed,3);
});
test('ion cannot dispatch without a durable tab ledger, including a later storage failure',()=>{
 const unavailable=openImagerySession(null);assert.equal(unavailable.canUseIon(60),false);assert.equal(unavailable.available,false);
 const store=storage(),session=openImagerySession(store);assert.equal(session.canUseIon(60),true);store.setItem=()=>{throw Error('Denied storage')};session.recordIonRequest();assert.equal(session.canUseIon(60),false);
});
