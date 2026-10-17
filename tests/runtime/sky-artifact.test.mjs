import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),read=path=>readFileSync(new URL(path,root));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
test('Sky marker and public admission digest bind every qualified application file',()=>{
 const lock=JSON.parse(read('integrations/renderers.lock.json')),marker=JSON.parse(read('frontend/public/oras-sky-engine/oras-runtime-build.json')),versions=JSON.parse(read('frontend/public/runtime-versions.json'));
 for(const row of lock.sky.artifact_files){assert.ok(!row.path.startsWith('skydata/'));const bytes=read('frontend/public/oras-sky-engine/'+row.path);assert.equal(bytes.length,row.bytes,row.path);assert.equal(digest(bytes),row.sha256,row.path)}
 if(lock.sky.native_horizon){assert.equal(marker.native_wasm_identical,lock.sky.reconstruction.native_wasm_identical);assert.equal(marker.native_vendor_chunks_identical,lock.sky.reconstruction.native_vendor_chunks_identical??false)}
 const payload=lock.sky.artifact_files.filter(row=>row.path!=='oras-runtime-build.json');
 assert.equal(digest(JSON.stringify(payload)),lock.sky.artifact_sha256);assert.equal(marker.artifact_sha256,lock.sky.artifact_sha256);assert.equal(versions.sky.artifact_sha256,marker.artifact_sha256);
 assert.equal(marker.adapter_sha256,digest(read('runtimes/sky-adapter/plugin.js')));
 assert.equal(marker.wheel_input_sha256,digest(read('runtimes/sky-adapter/native-wheel.mjs')));
 assert.equal(lock.sky.wheel_input_sha256,marker.wheel_input_sha256);
 for(const name of ['entry.mjs','native-panels.mjs']){assert.equal(marker.bridge_input_sha256[name],digest(read('runtimes/sky-adapter/'+name)));assert.equal(lock.sky.bridge_input_sha256[name],marker.bridge_input_sha256[name])}
 for(const name of ['continued-input.mjs','navigation.mjs']){assert.equal(marker.navigation_input_sha256[name],digest(read('packages/runtime-protocol/'+name)));assert.equal(lock.sky.navigation_input_sha256[name],marker.navigation_input_sha256[name])}
});
