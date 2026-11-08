import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
assert.equal(process.platform,'win32');const out=process.argv[2];await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']}),receipt={status:'RUNNING',layouts:[],videos:[],errors:[]}
try{
 for(const [width,height] of [[1440,900],[390,844]]){
  const context=await browser.newContext({viewport:{width,height}}),p=await context.newPage();p.on('pageerror',e=>receipt.errors.push(e.message));await p.goto('http://localhost:4231/owner-review/solar24-gallery/index.html')
  await p.locator('img').evaluateAll(images=>images.forEach(img=>img.loading='eager'));await p.waitForFunction(()=>[...document.images].length===69&&[...document.images].every(i=>i.complete&&i.naturalWidth>0))
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:path.join(out,width+'-gallery.png')});receipt.layouts.push({width,height,decodedImages:69,horizontalOverflow:false})
  if(width===1440)for(let i=0;i<4;i++){
   const v=p.locator('video').nth(i);await v.scrollIntoViewIfNeeded();const proof=await v.evaluate(video=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Video decode timeout')),15000);const seek=()=>{if(!Number.isFinite(video.duration)||video.duration<=2){clearTimeout(timer);reject(Error('Invalid video duration'));return}video.currentTime=video.duration*.5};video.addEventListener('seeked',()=>{clearTimeout(timer);resolve({source:video.getAttribute('src'),duration:video.duration,width:video.videoWidth,height:video.videoHeight,currentTime:video.currentTime,readyState:video.readyState})},{once:true});video.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Video decode error'))},{once:true});if(video.readyState>=1)seek();else{video.addEventListener('loadedmetadata',seek,{once:true});video.load()}}));assert.ok(proof.width>0&&proof.height>0&&proof.readyState>=2);receipt.videos.push(proof)
  }
  await context.close()
 }
 assert.deepEqual(receipt.errors,[]);receipt.status='PASS'
}catch(e){receipt.status='FAIL';receipt.failure=String(e);throw e}finally{await browser.close();await writeFile(path.join(out,'gallery.json'),JSON.stringify(receipt,null,2))}
