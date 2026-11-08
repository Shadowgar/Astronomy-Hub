import fs from 'node:fs';
import assert from 'node:assert/strict';
const filename=process.argv[2]||'frontend/public/licenses/source-offer.html';
const script=fs.readFileSync(filename,'utf8').match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const revision='a'.repeat(40);
const base=()=>({schema:1,status:'candidate',source_revision:revision,archive:{url:`/source-distribution/astronomy-hub-source-${revision}.tar.gz`,sha256:'b'.repeat(64),bytes:42},runtime:{sky_artifact_sha256:'c'.repeat(64),native_wasm_sha256:'d'.repeat(64)}});
const metadata=()=>({sky:{artifact_sha256:'c'.repeat(64),native_horizon:{native_output_sha256:{'stellarium-web-engine.wasm':'d'.repeat(64)}}}});
const fixtures=[
 ['matching candidate',base(),metadata(),true],
 ['both runtime identities absent',{...base(),runtime:{}},{},false],
 ['missing descriptor native hash',{...base(),runtime:{sky_artifact_sha256:'c'.repeat(64)}},metadata(),false],
 ['missing served metadata',base(),{},false],
 ['stale source revision',{...base(),source_revision:'e'.repeat(40)},metadata(),false],
 ['different served Sky hash',base(),{sky:{...metadata().sky,artifact_sha256:'e'.repeat(64)}},false],
];
for(const [name,offer,versions,expected] of fixtures){
 const shown=[];
 const target={replaceChildren(){shown.length=0},append(node){shown.push(node)},set textContent(value){shown.length=0;shown.push({error:value})}};
 const document={getElementById(){return target},querySelector(){return {content:revision}},createElement(type){return {type}}};
 const fetch=async path=>new Response(JSON.stringify(path==='/runtime-versions.json'?versions:offer));
 await new (Object.getPrototypeOf(async function(){}).constructor)('document','fetch',script)(document,fetch);
 assert.equal(shown.some(node=>node.type==='a'),expected,name);
 if(!expected)assert.ok(shown.some(node=>node.error?.includes('not available')),name);
 console.log('PASS',name);
}
console.log('6 passed; actual inline source-page script exercised without browser or source edits.');
