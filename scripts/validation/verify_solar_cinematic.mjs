// Actual WebGL behavior and layout; no synthetic ephemeris or imagery responses.
import {chromium} from '../../node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=process.env.CINEMATIC_BASE||'http://127.0.0.1:4211';
const out=process.env.CINEMATIC_EVIDENCE||'output/playwright/solar-cinematic';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const proof={status:'RUNNING',base,runs:[]};
try{
 for(const width of[1440,390]){
  const c=await browser.newContext({viewport:{width,height:900},isMobile:width<700,hasTouch:width<700,reducedMotion:width<700?'reduce':'no-preference'});
  const p=await c.newPage();p.setDefaultTimeout(12000);
  const r={width,checks:[],errors:[],screens:[]};proof.runs.push(r);p.on('pageerror',e=>r.errors.push(e.message));
  const diag=()=>p.evaluate(()=>window.orasSolarDiagnostics());
  const check=(s)=>{r.checks.push(s);console.log(width,s)};
  const shot=async(name)=>{const file=`after-${width}-${name}.png`;await p.screenshot({path:out+'/'+file});r.screens.push({file,sha256:createHash('sha256').update(await readFile(out+'/'+file)).digest('hex')})};
  await p.goto(base+'/solar-system?date=2026-02-28T00:00:00Z');await p.locator('[data-solar-status=ready]').waitFor();
  const stage=await p.locator('.solar-canvas').boundingBox();assert.ok(stage.width>=width*.95&&stage.height>=850,'Full viewport belongs to the scene');
  assert.equal(await p.getByLabel('Selected body details').count(),0,'No permanent empty details panel');
  check('Full-viewport scene and contextual-only details');
  await p.waitForFunction(()=>window.orasSolarDiagnostics?.().texturesReady===2);await p.waitForFunction(()=>!window.orasSolarDiagnostics().animating);
  const d=await diag();const api=await(await p.request.get(base+'/api/v1/solar-system?epoch=2026-02-28T00:00:00Z')).json();
  for(const body of d.bodies)assert.deepEqual(body.position,api.bodies.find(b=>b.source_id===body.id).position_au);
  assert.equal(d.starfield,'illustrative');assert.ok(d.starCount>500&&d.starCount<=4000);assert.ok(d.drawCalls<30);r.overview=d;
  check('Exact source vectors; bounded real textured scene and illustrative starfield');await shot('overview');
  await p.getByRole('button',{name:'Show orbit paths',exact:true}).click();assert.equal((await diag()).orbitsVisible,false);await p.getByRole('button',{name:'Show orbit paths',exact:true}).click();assert.equal((await diag()).orbitsVisible,true);check('Orbit visibility changes native scene');
  for(const id of['mars','earth']){
   await p.getByRole('navigation',{name:'Select a celestial body'}).getByRole('button',{name:id==='mars'?'Mars':'Earth',exact:true}).click();
   if(width<700)assert.equal((await diag()).animating,false,'Reduced-motion focus is synchronous');
   await p.waitForFunction(id=>{const d=window.orasSolarDiagnostics(),b=d.bodies.find(b=>b.id===id);return !d.animating&&d.selected===id&&d.target.every((v,i)=>Math.abs(v-b.position[i])<1e-8)},id);
   await shot(id);await p.getByRole('button',{name:'Expand body details',exact:true}).click();await p.getByLabel('Selected body details').getByText('Reference radius',{exact:true}).waitFor();await shot(id+'-details');
   await p.getByRole('button',{name:'Collapse body details',exact:true}).click();await p.getByRole('button',{name:'Approach selected body',exact:true}).click();await p.waitForFunction(()=>!window.orasSolarDiagnostics().animating);await shot(id+'-close');
   check(id+' focus/approach/expanded/collapsed; actual camera and accessible controls');
  }
  await p.getByRole('button',{name:'Overview',exact:true}).click();await p.waitForFunction(()=>!window.orasSolarDiagnostics().animating);
  const b=(await diag()).bodies.find(b=>b.id==='mars');await p.mouse.click(b.screen[0],b.screen[1]);await p.waitForFunction(()=>window.orasSolarDiagnostics().selected==='mars');check('Direct ray selection on Mars geometry');
  await p.getByRole('button',{name:'Simulation time',exact:true}).click();await p.getByLabel('Epoch (UTC)',{exact:true}).fill('2026-03-01T00:00');await shot('time');await p.getByRole('button',{name:'Apply epoch',exact:true}).click();await p.waitForFunction(()=>window.orasSolarDiagnostics?.().epoch?.startsWith('2026-03-01'));await p.waitForFunction(()=>window.orasSolarDiagnostics().texturesReady===2&&!window.orasSolarDiagnostics().animating);check('Time controls update actual JPL geometry');
  const old=(await diag()).camera;await p.getByLabel('Orbit camera right',{exact:true}).focus();await p.keyboard.press('Enter');assert.notDeepEqual((await diag()).camera,old);check('Keyboard camera movement');
  await p.getByRole('button',{name:'Science, scale & sources',exact:true}).click();await p.getByRole('dialog',{name:'Science, scale & sources'}).waitFor();await p.getByRole('link',{name:'NASA imagery usage guidelines'}).waitFor();await shot('sources');await p.keyboard.press('Escape');check('Accessible source dialog and Escape return');
  r.final=await diag();assert.deepEqual(r.errors,[]);r.status='PASS';await c.close();
 }
 proof.status='PASS';
}catch(e){proof.status='FAIL';proof.error=e.stack;process.exitCode=1;console.error(e.message)}finally{await browser.close();await writeFile(out+'/cinematic-proof.json',JSON.stringify(proof,null,2)+'\n')}
