import {chromium} from '/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026/node_modules/playwright/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026',base='http://10.254.108.2:8879';
const output=root+'/output/playwright/source-qualification';await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile(root+'/output/source-qualification/distribution-f7cb702c/manifest.json','utf8'));
const proof={status:'RUNNING',base,source_revision:manifest.source_revision,checks:[],layouts:[]};
const browser=await chromium.launch();
try{
 const response=await fetch(base+manifest.archive.url);const body=Buffer.from(await response.arrayBuffer());assert.equal(response.status,200);assert.equal(body.length,manifest.archive.bytes);assert.equal(createHash('sha256').update(body).digest('hex'),manifest.archive.sha256);proof.checks.push('Anonymous private HTTP archive bytes and SHA match descriptor');
 for(const [width,height] of [[1440,900],[390,900]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<768,reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/sky-engine');await page.getByRole('button',{name:'More Sky options',exact:true}).click();await page.getByRole('button',{name:'About & Licenses',exact:true}).click();const dialog=page.getByRole('dialog',{name:'About & Licenses'});await dialog.getByText('Local, unpublished source candidate',{exact:true}).waitFor();await dialog.getByText(manifest.archive.sha256,{exact:true}).waitFor();
  const download=dialog.getByRole('link',{name:'Download corresponding source and build instructions',exact:true});await download.scrollIntoViewIfNeeded();const rect=await download.boundingBox();await download.focus();assert.equal(await download.evaluate(el=>el===document.activeElement),true);
  const eventPromise=page.waitForEvent('download');if(width<768)await download.tap();else await page.keyboard.press('Enter');const event=await eventPromise;assert.equal(event.suggestedFilename(),manifest.archive.url.split('/').at(-1));await event.cancel();
  await page.screenshot({path:output+`/${width}-about.png`});await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog[open]'));await page.waitForFunction(()=>document.activeElement?.matches('[data-ws-trigger=menu]'));
  await page.goto(base+'/oras-sky-engine/');const native=page.getByRole('link',{name:'Source code & licenses',exact:true});await native.waitFor();const nativeRect=await native.boundingBox();assert(nativeRect.height>=44);await native.focus();const popupPromise=page.waitForEvent('popup');if(width<768)await native.tap();else await page.keyboard.press('Enter');const popup=await popupPromise;await popup.getByRole('heading',{name:'Source code & licenses'}).waitFor();await popup.getByText('Matching source revision: '+manifest.source_revision,{exact:true}).waitFor();assert.equal(await popup.locator('#offer a').getAttribute('href'),manifest.archive.url);await popup.screenshot({path:output+`/${width}-native-source.png`});
  proof.layouts.push({width,height,download_rect:rect,native_link_rect:nativeRect,page_errors:errors,about_keyboard_or_touch:true,source_page_verified:true});await context.close();
 }
 proof.status='PASS';proof.checks.push('Hub About and standalone native source offer: keyboard/touch, matching revision/digest, Escape focus return');
}catch(error){proof.status='FAIL';proof.error=error.stack;process.exitCode=1}finally{await browser.close();await writeFile(output+'/proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2))}
