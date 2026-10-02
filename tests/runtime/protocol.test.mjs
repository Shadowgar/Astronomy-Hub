import test from 'node:test';
import assert from 'node:assert/strict';
const p = await import('../../packages/runtime-protocol/index.mjs').catch(() => ({}));
const expected = {origin:'http://localhost:4173', source:{}, runtime:'earth', nonce:'0123456789abcdef0123456789abcdef', generation:7};
const hello = {type:'ready',protocol:{major:1,minor:0},runtime:'earth',nonce:expected.nonce,generation:7,version:'pin',capabilities:['destroy','timeIntent']};
test('validates authenticated bootstrap; rejects each session boundary independently', () => {
 assert.equal(typeof p.validateBootstrap,'function');
 const event={origin:expected.origin,source:expected.source,data:hello};
 assert.equal(p.validateBootstrap(event,expected),true);
 for (const change of [{origin:'https://evil.example'},{source:{}},{data:{...hello,nonce:'wrong'}},{data:{...hello,generation:6}},{data:{...hello,runtime:'sky'}},{data:{...hello,protocol:{major:2,minor:0}}},{data:{...hello,capabilities:'bad'}},{data:{...hello,extra:'bad'}}]) assert.equal(p.validateBootstrap({...event,...change},expected),false);
 assert.equal(p.validateBootstrap({...event,data:{...hello,protocol:{major:1,minor:5}}},expected),true);
});
test('rejects malformed channel commands and stale generation', () => {
 assert.equal(typeof p.validateMessage,'function');
 const message={type:'command',runtime:'earth',nonce:expected.nonce,generation:7,id:1,command:'setTimeIntent',payload:{utc:'2026-10-02T00:00:00Z'}};
 assert.equal(p.validateMessage(message,expected),true);
 for(const change of [{generation:6},{nonce:'bad'},{command:'arbitrary'},{payload:{utc:'garbage'}},{id:0},{extra:true}]) assert.equal(p.validateMessage({...message,...change},expected),false);
});
