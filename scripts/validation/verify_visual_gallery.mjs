// Gallery-only browser regression; does not start or rebuild application engines.
import {readFile,writeFile} from 'node:fs/promises'
import {createServer} from 'node:http'
import assert from 'node:assert/strict'
import {chromium} from '../../node_modules/playwright/index.mjs'

const root=new URL('../../',import.meta.url),gallery=new URL('docs/validation/repository-recovery-20261026/visual-fidelity/',root)
const modes=['solar','solar-mars','earth','sky','moon'],sizes=['desktop','portrait','landscape']
const references=['solar-primary-cinematic.png','solar-adaptive-explorer.png','earth-cinematic.png','sky-cinematic.png']
const privatePath='/owner-review/visual-fidelity/',repoPath='/docs/validation/repository-recovery-20261026/visual-fidelity/'
const assets=new Map(),html=await readFile(new URL('index.html',gallery))
for(const prefix of [privatePath,repoPath]){
 assets.set(prefix,{type:'text/html; charset=utf-8',bytes:html})
 for(const phase of ['before','after'])for(const mode of modes)for(const size of sizes){const file=`${phase}/${size}-${mode}.png`;assets.set(prefix+file,{type:'image/png',bytes:await readFile(new URL(file,gallery))})}
}
for(const name of references){const resource={type:'image/png',bytes:await readFile(new URL('docs/design/cinematic-references-2026-10-21/'+name,root))};assets.set(privatePath+'references/'+name,resource);assets.set('/docs/design/cinematic-references-2026-10-21/'+name,resource)}
for(const name of ['moon-desktop.png','moon-mobile.png']){const resource={type:'image/png',bytes:await readFile(new URL('docs/design/adaptive-explorer-r1a/evidence/'+name,root))};assets.set(privatePath+'references/'+name,resource);assets.set('/docs/design/adaptive-explorer-r1a/evidence/'+name,resource)}
// The server returns only preloaded, explicit assets; the request never selects a filesystem path.
const unexpected=[]
const server=createServer((request,response)=>{const asset=assets.get(request.url);if(!asset){if(request.url!=='/favicon.ico')unexpected.push(request.url);response.writeHead(404).end();return}response.writeHead(200,{'Content-Type':asset.type});response.end(asset.bytes)})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const origin='http://127.0.0.1:'+server.address().port,proof={status:'RUNNING',roots:[],errors:[]}
let browser
try{
 browser=await chromium.launch({headless:true})
 for(const prefix of [privatePath,repoPath]){
  const page=await browser.newPage();page.on('pageerror',e=>proof.errors.push(e.message));await page.goto(origin+prefix)
  const snapshot=()=>page.evaluate(()=>['before','before-link','after','after-link','concept','reference-link'].map(id=>{const node=document.getElementById(id);return node.tagName==='A'?node.href:node.src}))
  let combinations=0
  for(const mode of modes)for(const size of sizes)for(const ref of references.slice(0,2)){
   await page.locator('#mode').selectOption(mode);await page.locator('[data-size="'+size+'"]').click();await page.locator('#reference').selectOption(ref)
   await page.waitForFunction(()=>Array.from(document.images).every(image=>image.complete&&image.naturalWidth>0))
   const reference=mode.startsWith('solar')?ref:mode==='moon'?(size==='desktop'?'moon-desktop.png':'moon-mobile.png'):mode+'-cinematic.png'
   const referencePath=prefix===privatePath?privatePath+'references/':mode==='moon'?'/docs/design/adaptive-explorer-r1a/evidence/':'/docs/design/cinematic-references-2026-10-21/'
   const before=origin+prefix+'before/'+size+'-'+mode+'.png',after=origin+prefix+'after/'+size+'-'+mode+'.png',concept=origin+referencePath+reference
   assert.deepEqual(await snapshot(),[before,before,after,after,concept,concept]);combinations++
  }
  await page.locator('#mode').selectOption('solar');const trusted=await snapshot()
  const hostile=['__proto__','constructor','toString','../../outside','..\\outside','%2e%2e%2foutside','//outside.invalid/x','javascript:window.__galleryUnsafe=1','data:text/html,<script>window.__galleryUnsafe=1</script>','"><img src=x onerror="window.__galleryUnsafe=1">']
  for(const id of ['mode','reference'])for(const value of hostile){
   await page.evaluate(({id,value})=>{const control=document.getElementById(id),option=document.createElement('option');option.value=value;option.textContent='Invalid test entry';control.append(option);control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}))},{id,value})
   assert.deepEqual(await snapshot(),trusted)
  }
  const portrait=page.getByRole('button',{name:'Portrait · 390×844',exact:true})
  await portrait.evaluate(button=>{button.dataset.size='../../outside'})
  await portrait.click();assert.match((await snapshot())[0],/\/before\/portrait-solar\.png$/)
  assert.equal(await page.evaluate(()=>window.__galleryUnsafe),undefined)
  proof.roots.push({path:prefix,validCombinations:combinations,hostileMutations:hostile.length*2,viewportTamperRejected:true});await page.close()
 }
 assert.deepEqual(proof.errors,[]);assert.deepEqual(unexpected,[]);proof.status='PASS';console.log('PASS gallery browser: 60 legitimate combinations, 40 hostile mutations, 2 viewport-tamper cases; real assets loaded')
}catch(error){proof.status='FAIL';proof.error=error.stack;throw error}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(proof,null,2))}
