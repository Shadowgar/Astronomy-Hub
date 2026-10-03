import test from 'node:test';import assert from 'node:assert/strict';
import {validateMessage,envelope} from '../../packages/runtime-protocol/index.mjs';
const s={runtime:'earth',nonce:'a'.repeat(32),generation:3};
const command=(name,payload={})=>envelope(s,'command',1,name,payload);
test('admits only qualified workspace commands with bounded canonical string identity',()=>{
 assert.equal(validateMessage(command('setLayerEnabled',{id:'satellites',enabled:true}),s),true);
 assert.equal(validateMessage(command('setLayerEnabled',{id:'imaginary',enabled:true}),s),false);
 assert.equal(validateMessage(command('setLayerEnabled',{id:'satellites',enabled:1}),s),false);
 assert.equal(validateMessage(command('selectEntity',{catalog:'Gaia DR3',source_id:'5853498713190525696',model:'star',ra:20,dec:40}),s),true);
 assert.equal(validateMessage(command('selectEntity',{catalog:'Gaia',source_id:5853498713190525696,model:'star'}),s),false);
 assert.equal(validateMessage(command('setPresentation',{embedded:true}),s),true);
 assert.equal(validateMessage(command('focusSelection'),s),true);
 assert.equal(validateMessage(command('openNativeTools'),s),true);
 assert.equal(validateMessage(command('openNativeTools',{secret:'unexpected'}),s),false);
});
test('workspace snapshots are bounded DTOs and stale channel events cannot mutate state',()=>{
 const v=envelope(s,'result',1,'getWorkspaceState',{ok:true,state:{selection:null,layers:[],tracking:false}});
 assert.equal(validateMessage(v,s),true);
 assert.equal(validateMessage({...v,generation:2},s),false);
 assert.equal(validateMessage({...v,payload:{ok:true,state:{selection:null,layers:[],tracking:false,secret:'token'}}},s),false);
 assert.equal(validateMessage(envelope(s,'event',1,'interaction',{active:true,focused:false}),s),true);
 assert.equal(validateMessage(envelope(s,'event',1,'interaction',{active:'yes',focused:false}),s),false);
});
