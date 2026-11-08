import {chromium} from '../../node_modules/playwright/index.mjs'
import {writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const base=process.argv[2]||'http://127.0.0.1:4231',output=process.argv[3]||'docs/validation/solar-system-2.1/gallery/browser.json'
const browser=await chromium.launch({headless:process.platform!=='win32',...(process.platform==='win32'?{executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']}: {})}),proof={base,platform:process.platform,layouts:[],assets:[]}
try{
 const page=await browser.newPage();await page.goto(base+'/owner-review/solar-system-2.1/')
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){await page.setViewportSize({width,height});const result=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,images:document.images.length,videos:document.querySelectorAll('video').length,title:document.title}));assert(result.scroll<=width);assert.equal(result.images,28);assert.equal(result.videos,6);proof.layouts.push(result)}
 const receipt=await(await page.request.get(base+'/owner-review/solar-system-2.1/receipt.json')).json()
 for(const file of receipt.files){const response=await page.request.get(base+'/owner-review/solar-system-2.1/'+file.path);assert.equal(response.status(),200);const bytes=await response.body();assert.equal(bytes.length,file.bytes);proof.assets.push({path:file.path,bytes:bytes.length,status:200})}
 proof.status='PASS'
}finally{await browser.close();await writeFile(output,JSON.stringify(proof,null,2))}
