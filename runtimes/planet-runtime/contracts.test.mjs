import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMoonContract, validateCamera, acceptsBridgeMessage, lightEmissionDirection} from './contracts.mjs';
const valid = () => ({schema:'oras.planet-view.v1',body:{source_id:'moon',model:'moon',naif_id:'301'},epoch:'2026-10-23T00:00:00Z',frame:{body_fixed:'MOON_ME_DE440_ME421',naif_frame_id:'31009',icrf_to_body_fixed:[[1,0,0],[0,1,0],[0,0,1]]},shape:{model:'reference sphere',radii_m:[1737400,1737400,1737400]},capabilities:{orientation:true,globe:true,terrain:false},illumination:{direction_body_fixed:[1,0,0]}});
test('only qualified lunar frame, center and sphere may create a globe',()=>{
 assert.equal(validateMoonContract(valid()).body.source_id,'moon');
 for(const mutate of [c=>c.body.naif_id='3',c=>c.frame.body_fixed='IAU_MOON',c=>c.shape.radii_m[0]=6378137,c=>c.capabilities.terrain=true,c=>c.illumination.direction_body_fixed=[0,0,0],c=>c.frame.icrf_to_body_fixed[0][0]=-1,c=>c.epoch='unknown']) {const c=valid();mutate(c);assert.throws(()=>validateMoonContract(c));}
});
test('coordinate controls reject invalid data and heights below the supported sphere',()=>{
 assert.deepEqual(validateCamera({latitudeDeg:-90,longitudeDeg:180,heightM:30000}),{latitudeDeg:-90,longitudeDeg:-180,heightM:30000});
 for(const c of [{latitudeDeg:91,longitudeDeg:0,heightM:100000},{latitudeDeg:0,longitudeDeg:NaN,heightM:100000},{latitudeDeg:0,longitudeDeg:0,heightM:-100},{latitudeDeg:0,longitudeDeg:360,heightM:100000}])assert.throws(()=>validateCamera(c));
});
test('floating-point Cartesian round trips remain valid at camera height limits',()=>{assert.equal(validateCamera({latitudeDeg:0,longitudeDeg:15,heightM:29999.9999999995}).heightM,30000);assert.equal(validateCamera({latitudeDeg:0,longitudeDeg:15,heightM:12000000.000000002}).heightM,12000000);assert.throws(()=>validateCamera({latitudeDeg:0,longitudeDeg:0,heightM:29999}));});
test('history restores valid camera orientation and rejects unsupported tilt',()=>{const c={latitudeDeg:1,longitudeDeg:2,heightM:30000,headingRad:1,pitchRad:-1.4,rollRad:0};assert.deepEqual(validateCamera(c),c);assert.throws(()=>validateCamera({...c,pitchRad:1}));});
test('directional light travels opposite the body-to-Sun direction',()=>assert.deepEqual(lightEmissionDirection([1,0,0]),[-1,-0,-0]));
test('bridge rejects other windows, origins, namespaces and channels',()=>{
 const parent={};const data={namespace:'oras.planet.v1',channel:'uuid',type:'initialize'};
 const event={source:parent,origin:'https://hub.test',data};
 assert.equal(acceptsBridgeMessage(event,{parent,origin:'https://hub.test',channel:'uuid'}),true);
 for(const patch of [{source:{}},{origin:'https://other.test'},{data:{...data,channel:'wrong'}},{data:{...data,namespace:'oras.earth.v1'}},{data:null}])assert.equal(acceptsBridgeMessage({...event,...patch},{parent,origin:'https://hub.test',channel:'uuid'}),false);
});
