import {chromium} from '../../node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.PS_HISTORY_REVIEW_OUT||'output/planetary-systems/epoch-history';await mkdir(out,{recursive:true});
const b=await chromium.launch();const c=await b.newContext({reducedMotion:'reduce'});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));const proof={originalReviewSha:'a7de8908e54ed4e0b5a1406134f2648bd0047187',errors};
const capture=()=>p.evaluate(()=>({diagnostics:window.orasSystemDiagnostics(),url:location.href,state:history.state}));
try{
 await p.goto('http://127.0.0.1:4223/planetary-system/earth?date=2026-10-23T01:05:00Z&moon=moon');await p.waitForFunction(()=>window.orasSystemDiagnostics?.().renderCount>0);await p.waitForTimeout(700);proof.initial=await capture();
 await p.getByRole('button',{name:'Set system epoch',exact:true}).click();await p.getByLabel('System epoch UTC',{exact:true}).fill('2026-10-24T01:05');await p.getByRole('button',{name:'Apply epoch',exact:true}).click();await p.waitForTimeout(700);
 await p.getByRole('button',{name:'Orbit system left',exact:true}).click();await p.waitForTimeout(700);proof.newer=await capture();
 await p.goBack();await p.waitForTimeout(700);proof.back=await capture();
 const a=proof.initial.diagnostics.cameraState,z=proof.back.diagnostics.cameraState;
 proof.maxCameraErrorKm=Math.max(...['position','target','up'].flatMap(k=>a[k].map((v,i)=>Math.abs(v-z[k][i]))));
 assert.equal(proof.initial.diagnostics.epoch,proof.back.diagnostics.epoch);assert.deepEqual(errors,[]);
 assert.ok(proof.maxCameraErrorKm<1e-4,`Back changed saved camera by ${proof.maxCameraErrorKm} km`);
 proof.status='PASS';
}catch(e){proof.status='FAIL';proof.failure=e.stack;process.exitCode=1}finally{await writeFile(out+'/proof.json',JSON.stringify(proof,null,2));await b.close();console.log(JSON.stringify({status:proof.status,maxCameraErrorKm:proof.maxCameraErrorKm,failure:proof.failure,proof:out+'/proof.json'},null,2))}
