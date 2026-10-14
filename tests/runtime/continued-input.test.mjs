import test from 'node:test';import assert from 'node:assert/strict';
import {ContinuedInput} from '../../packages/runtime-protocol/continued-input.mjs';
const input=(gate,now,pixels=120,extra={})=>gate.input({atBoundary:true,continuing:true,pixels,now,...extra});
test('continuous outward input works without pausing at the boundary',()=>{
 const gate=new ContinuedInput();for(let t=0;t<400;t+=100)input(gate,t,120,{atBoundary:false});
 const phases=[];for(let t=400;t<=1600;t+=100)phases.push(input(gate,t).phase);
 assert.equal(phases[0],'boundary');assert.ok(phases.includes('request'));
});
test('slow notches and irregular cadence retain deliberate progress',()=>{
 for(const times of [[0,600,1200,1800,2400,3000],[0,170,610,790,1410,2010,2290,2830]]){
  const gate=new ContinuedInput();assert.ok(times.map(t=>input(gate,t).phase).includes('request'));
 }
});
test('small trackpad input can continue directly from ordinary zoom',()=>{
 const gate=new ContinuedInput();const phases=[];
 for(let t=0;t<2400;t+=20)phases.push(input(gate,t,8).phase);
 assert.ok(phases.includes('request'));
});
test('arrival, short overshoot, a single huge event and decaying inertia do not transition',()=>{
 let gate=new ContinuedInput();for(let t=0;t<=300;t+=20)assert.notEqual(input(gate,t).phase,'request');
 gate=new ContinuedInput();assert.notEqual(input(gate,0,9999).phase,'request');assert.notEqual(input(gate,900,9999).phase,'request');
 gate=new ContinuedInput();for(let i=0;i<160;i++)assert.notEqual(input(gate,i*20,120*.96**i).phase,'request');
});
test('reversal, pan, cooldown and departure from hysteresis discard intent',()=>{
 const gate=new ContinuedInput();input(gate,0);input(gate,500);input(gate,700);
 assert.equal(input(gate,800,120,{continuing:false}).phase,'idle');assert.equal(input(gate,900).phase,'boundary');
 assert.equal(input(gate,1400,120,{atBoundary:false,withinBoundary:true}).phase,'boundary');
 assert.equal(input(gate,1500,120,{atBoundary:false,withinBoundary:false}).phase,'idle');
 gate.reset(3000);assert.equal(input(gate,2900).phase,'idle');assert.equal(input(gate,3100).phase,'boundary');
});
test('abandoned progress expires, without requiring a second pause to restart',()=>{
 const gate=new ContinuedInput();input(gate,0);input(gate,500);input(gate,700);
 assert.notEqual(input(gate,6000).phase,'request');assert.ok([6600,7200,7800,8400].map(t=>input(gate,t).phase).includes('request'));
});
