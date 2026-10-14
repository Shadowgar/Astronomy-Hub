import test from 'node:test';import assert from 'node:assert/strict';
// A missing module is the initial red state; the protocol tests fail assertions.
import {ContinuedInput} from '../../packages/runtime-protocol/continued-input.mjs';
test('ordinary zoom and uninterrupted arrival/momentum never request a renderer handoff',()=>{
 const gate=new ContinuedInput();for(let t=0;t<3000;t+=20)assert.notEqual(gate.input({atBoundary:t>300,continuing:true,pixels:120,now:t}).phase,'request');
});
test('new deliberate gesture at the boundary requires distance, event count and duration',()=>{
 const gate=new ContinuedInput();assert.equal(gate.input({atBoundary:true,continuing:true,pixels:120,now:0}).phase,'boundary');
 assert.equal(gate.input({atBoundary:true,continuing:true,pixels:120,now:400}).phase,'progress');
 assert.equal(gate.input({atBoundary:true,continuing:true,pixels:120,now:520}).phase,'progress');
 assert.equal(gate.input({atBoundary:true,continuing:true,pixels:120,now:640}).phase,'request');
 assert.equal(gate.input({atBoundary:true,continuing:true,pixels:120,now:800}).phase,'idle');
});
test('trackpad small deltas work; reverse input, pan and cancellation discard accumulated intent',()=>{
 const gate=new ContinuedInput();gate.input({atBoundary:true,continuing:true,pixels:24,now:0});
 for(let i=0;i<14;i++)assert.notEqual(gate.input({atBoundary:true,continuing:true,pixels:24,now:400+i*20}).phase,'request');
 assert.equal(gate.input({atBoundary:true,continuing:true,pixels:24,now:680}).phase,'request');
 gate.reset(1000);assert.notEqual(gate.input({atBoundary:true,continuing:true,pixels:120,now:1100}).phase,'request');
 gate.reset();gate.input({atBoundary:true,continuing:true,pixels:120,now:0});gate.input({atBoundary:true,continuing:true,pixels:120,now:400});
 assert.equal(gate.input({atBoundary:true,continuing:false,pixels:120,now:500}).phase,'idle');
 assert.equal(gate.input({atBoundary:true,continuing:true,pixels:120,now:600}).phase,'boundary');
});
test('hysteresis retains boundary awareness in its band but never counts or requests before the strict clamp',()=>{
 const gate=new ContinuedInput();gate.input({atBoundary:true,continuing:true,pixels:120,now:0});
 assert.equal(gate.input({atBoundary:false,withinBoundary:true,continuing:true,pixels:120,now:400}).phase,'boundary');
 assert.equal(gate.input({atBoundary:false,withinBoundary:false,continuing:true,pixels:120,now:600}).phase,'idle');
});
test('a long pause at a still-qualified boundary starts deliberate input without a second artificial pause',()=>{
 const gate=new ContinuedInput();gate.input({atBoundary:true,continuing:true,pixels:120,now:0});
 assert.equal(gate.input({atBoundary:true,continuing:true,pixels:120,now:6000}).phase,'progress');
 gate.input({atBoundary:true,continuing:true,pixels:120,now:6120});
 assert.equal(gate.input({atBoundary:true,continuing:true,pixels:120,now:6240}).phase,'request');
});
