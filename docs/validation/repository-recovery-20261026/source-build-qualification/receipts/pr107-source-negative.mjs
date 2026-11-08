import {chromium} from '/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026/node_modules/playwright/index.mjs';
import {writeFile,readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const root='/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026',base='http://10.254.108.2:8879';
const manifest=JSON.parse(await readFile(root+'/output/source-qualification/extracted-f7cb702c/astronomy-hub-source/source-manifest.json','utf8'));
const identity=[];for(const row of manifest.expected_hub){const response=await fetch(base+'/'+row.path);assert.equal(response.status,200,row.path);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256,row.path);identity.push({path:row.path,sha256:row.sha256})}
const browser=await chromium.launch();const context=await browser.newContext();const page=await context.newPage();
try{
 await page.route('**/source-distribution/manifest.json',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));await page.goto(base+'/sky-engine');await page.getByRole('button',{name:'More Sky options',exact:true}).click();await page.getByRole('button',{name:'About & Licenses',exact:true}).click();await page.getByRole('dialog').getByText(/matching source distribution is unavailable/).waitFor();assert.equal(await page.getByRole('dialog').locator('a[download]').count(),0);
 await page.goto(base+'/licenses/source-offer.html');await page.getByText(/matching corresponding-source distribution is not available/).waitFor();assert.equal(await page.locator('#offer a').count(),0);
 const proof={status:'PASS',served_files:identity.length,served_sha256:identity,negative_checks:['Hub unavailable manifest exposes no download','Standalone unavailable manifest exposes no download'],limits:['Controlled private HTTP preview; not public HTTPS or production qualification']};await writeFile(root+'/output/source-qualification/served-identity-and-negative.json',JSON.stringify(proof,null,2));console.log('PASS',identity.length,'served hashes and2controlled negative offer checks');
}finally{await browser.close()}
