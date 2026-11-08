// Real native Earth entity picking and product Focus/Deselect, desktop and touch.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from '../../node_modules/playwright/index.mjs';
const out=process.env.N1_EVIDENCE_DIR||'output/n1/smooth-camera/selection',base='http://127.0.0.1:4202';await mkdir(out,{recursive:true});
const proof={status:'RUNNING',runs:[],limitations:['Chromium software rendering; touch emulation, not physical-device qualification.']},browser=await chromium.launch({headless:true});
try{
 for(const width of [1280,390]){
  const mobile=width<768,context=await browser.newContext({viewport:{width,height:mobile?844:800},isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);await page.goto(base+'/earth');await page.locator('[data-runtime-mode=earth][data-runtime-status=ready]').waitFor({timeout:90000});
  const f=page.frames().find(f=>f.url().includes('/earth-runtime/'));await f.waitForFunction(()=>window.orasEarthVisibleTargets().some(e=>e.id==='oras-site'));
  const target=await f.evaluate(()=>window.orasEarthVisibleTargets().find(e=>e.id==='oras-site')),box=await f.locator('canvas').first().boundingBox(),x=box.x+target.x,y=box.y+target.y;
  if(mobile)await page.touchscreen.tap(x,y);else {await page.mouse.move(x,y);await page.mouse.wheel(0,-12);await page.mouse.click(x,y);}
  await f.waitForFunction(()=>window.orasEarthDiagnostics().selection?.layerId==='oras-site');
  // Native Tab reveals/focuses the chrome without racing a transient reveal button.
  await page.keyboard.press('Tab');
  // Native selection automatically opens the mobile context sheet.
  await page.getByRole('button',{name:'Focus',exact:true}).click();await page.waitForTimeout(1400);
  const focused=await f.evaluate(()=>window.orasEarthDiagnostics());assert.equal(focused.selection.layerId,'oras-site');assert.equal(focused.cameraMotion.active,false);assert.ok(focused.cameraHeightM<1000000);assert.equal(await page.locator('iframe').count(),1);
  await page.screenshot({path:`${out}/selection-${width}.png`});await page.getByRole('button',{name:'Deselect',exact:true}).click();await f.waitForFunction(()=>window.orasEarthDiagnostics().selection===null);assert.deepEqual(errors,[]);
  proof.runs.push({width,touch:mobile,status:'PASS',selection:focused.selection,cameraHeightM:focused.cameraHeightM,pageErrors:errors});console.log(width,'native site selection, Focus and Deselect PASS');await context.close();
 }
 proof.status='PASS';
}catch(e){proof.status='FAIL';proof.error=e.stack;throw e}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n')}
