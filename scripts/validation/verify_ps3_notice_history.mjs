import {chromium} from '../../node_modules/playwright/index.mjs';
import{mkdir,writeFile}from'node:fs/promises';import assert from'node:assert/strict';
const out=process.env.PS_NOTICE_REVIEW_OUT||'output/planetary-systems/ps3/notice-history';await mkdir(out,{recursive:true});const proof={checks:[],errors:[]};const b=await chromium.launch();const c=await b.newContext({reducedMotion:'reduce'});const p=await c.newPage();p.on('pageerror',e=>proof.errors.push(e.message));
try{
 await p.goto('http://127.0.0.1:4225/planetary-system/mars?date=2026-10-23T01:05:00Z');await p.waitForFunction(()=>window.orasSystemDiagnostics?.().renderCount>0);await p.waitForTimeout(400);
 proof.initial=await p.evaluate(()=>({epoch:window.orasSystemDiagnostics().epoch,url:location.href}));
 await p.getByRole('button',{name:'Set system epoch',exact:true}).click();await p.getByLabel('System epoch UTC',{exact:true}).fill('2026-10-31T23:58');await p.getByRole('button',{name:'Apply epoch',exact:true}).click();await p.waitForTimeout(400);
 await p.getByRole('button',{name:'Resume orbital motion',exact:true}).click();await p.waitForFunction(()=>!window.orasSystemDiagnostics().playing&&window.orasSystemDiagnostics().epoch==='2026-10-31T23:58:50.817Z');await p.waitForTimeout(400);
 proof.end=await p.evaluate(()=>({epoch:window.orasSystemDiagnostics().epoch,notice:document.querySelector('.solar-notice')?.textContent,url:location.href}));assert.match(proof.end.notice,/paused at the end/);
 await p.goBack();await p.waitForTimeout(600);proof.back=await p.evaluate(()=>({epoch:window.orasSystemDiagnostics().epoch,notice:document.querySelector('.solar-notice')?.textContent,url:location.href}));assert.equal(proof.back.epoch,proof.initial.epoch);assert.ok(!proof.back.notice?.includes('paused at the end'),'Back to an earlier epoch retains obsolete end-of-coverage notice');assert.deepEqual(proof.errors,[]);proof.status='PASS';
}catch(e){proof.status='FAIL';proof.failure=e.stack;process.exitCode=1}finally{await writeFile(out+'/proof.json',JSON.stringify(proof,null,2));await b.close();console.log(JSON.stringify(proof,null,2))}
