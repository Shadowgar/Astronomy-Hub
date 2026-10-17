// Investigation only: temporarily probes the public color property in an isolated browser.
// Never patches native objects, binaries, geometry or the served artifact.
import {chromium} from '../../node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const out=process.env.N1_EVIDENCE_DIR||'output/n1/horizon';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://127.0.0.1:4202/sky-engine?date=2026-10-14T02%3A10%3A00.000Z');
 await page.locator('[data-runtime-mode=sky][data-runtime-status=ready]').waitFor({timeout:90000});
 const frame=page.frames().find(f=>f.url().includes('/oras-sky-engine/'));
 await frame.evaluate(()=>{const a=window.orasSkyAdapter,n=a.navigation();a.restoreView({...n.camera,fovRad:Math.PI/2,pitchRad:0,landscapeVisible:true});});
 await page.waitForTimeout(6000);
 const inspect=()=>frame.evaluate(()=>{const s=window.__ORAS_STEL,l=s.core.landscapes.current,children=l.listObjs(s.core.observer,99,()=>true);const result={currentId:s.core.landscapes.current_id,keys:Object.keys(l),tree:Object.fromEntries(Object.entries(l.getTree(true)).filter(([key])=>key!=='description')),listObjectCount:children.length,navigation:window.orasSkyAdapter.navigation()};children.forEach(o=>o.destroy());return result;});
 const before=await inspect();await page.screenshot({path:out+'/green-before.png'});
 let attempted;
 try {
  await frame.evaluate(()=>window.__ORAS_STEL.core.landscapes.current.color=[0.02,0.02,0.02,1]);await page.waitForTimeout(2000);
  attempted=await inspect();await page.screenshot({path:out+'/public-color-no-effect.png'});
 } finally {
  await frame.evaluate(color=>window.__ORAS_STEL.core.landscapes.current.color=color,before.tree.color.v);
 }
 await page.waitForTimeout(1000);
 const pixels=await page.evaluate(async ({before,after})=>{
  async function region(b64){const binary=atob(b64),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0)),bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'})),canvas=new OffscreenCanvas(1000,200),ctx=canvas.getContext('2d');ctx.drawImage(bitmap,-300,-550);bitmap.close();return [...ctx.getImageData(0,0,1000,200).data];}
  const a=await region(before),b=await region(after);let changed=0;for(let i=0;i<a.length;i+=4)if(a.slice(i,i+4).some((v,j)=>v!==b[i+j]))changed++;return {region:[300,550,1300,750],pixels:a.length/4,changedPixels:changed,beforeFirstPixel:a.slice(0,4),afterFirstPixel:b.slice(0,4)};
 },{before:(await readFile(out+'/green-before.png')).toString('base64'),after:(await readFile(out+'/public-color-no-effect.png')).toString('base64')});
 await writeFile(out+'/pixel-comparison.json',JSON.stringify(pixels,null,2)+'\n');
 assert.equal(before.currentId,'zero');assert.equal(before.listObjectCount,0);
 assert.deepEqual(attempted.tree.color.v,[0.02,0.02,0.02,1]);
 assert.deepEqual(attempted.navigation,before.navigation);
 assert.equal(pixels.changedPixels,0,'public color affected the sampled ground; investigate before claiming a blocker');
 assert.deepEqual(errors,[]);
 await writeFile(out+'/native-api-investigation.json',JSON.stringify({status:'BLOCKED_NATIVE_CONFIGURATION',before,attempted,errors,publicColorRestored:await frame.evaluate(()=>window.__ORAS_STEL.core.landscapes.current.color)},null,2)+'\n');
 console.log(JSON.stringify({status:'BLOCKED_NATIVE_CONFIGURATION',before,attempted,errors}));
} finally {await browser.close();}
