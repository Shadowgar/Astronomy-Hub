import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMessage,envelope} from '../../packages/runtime-protocol/index.mjs';
const session={runtime:'sky',nonce:'0123456789abcdef0123456789abcdef',generation:1};
const module=await import('../../runtimes/sky-adapter/simulation.mjs').catch(()=>({}));
test('simulation is a Sky-only authenticated intent with bounded speed',()=>{
 assert.equal(validateMessage(envelope(session,'command',1,'setSimulation',{playing:true}),session),true);
 for(const payload of [{playing:1},{playing:true,speed:100},{playing:true,utc:'bad'},{playing:true,utc:'2026-02-30T00:00:00Z'}])assert.equal(validateMessage(envelope(session,'command',1,'setSimulation',payload),session),false);
 const earth={...session,runtime:'earth'};assert.equal(validateMessage(envelope(earth,'command',1,'setSimulation',{playing:true}),earth),false);
});
test('native simulation preserves selection/display/camera and reads actual native UTC',()=>{
 assert.equal(typeof module.createSimulation,'function');
 const calls=[],adapter={observer:{utc:61338},setLive:value=>calls.push(value)},simulation=module.createSimulation(()=>adapter);
 assert.equal(simulation.active(),false);
 const start='2026-10-26T10:22:00.000Z';
 assert.equal(simulation.set({utc:start,playing:false}).simulation.playing,false);
 assert.equal(simulation.set({playing:true}).simulation.playing,true);
 adapter.observer.utc+=5/86400;
 assert.ok(Date.parse(simulation.status().utc)-Date.parse(start)>=4999);
 assert.equal(simulation.set({playing:false}).simulation.playing,false);
 assert.deepEqual(calls,[false,true,false]);
 simulation.clear();assert.equal(simulation.active(),false);
});
test('simulation cannot start without an explicit epoch and rejects bad direct inputs',()=>{
 assert.equal(typeof module.createSimulation,'function');
 const adapter={observer:{utc:61338},setLive:()=>{}},simulation=module.createSimulation(()=>adapter);
 assert.throws(()=>simulation.set({playing:true}));
 assert.throws(()=>simulation.set({playing:true,utc:'invalid'}));
 assert.equal(simulation.active(),false);
});
