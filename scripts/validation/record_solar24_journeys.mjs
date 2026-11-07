import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
assert.equal(process.platform,'win32')
const out=process.argv[2],epoch='2026-10-27T04:00:00.000Z';await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']}),receipt={status:'RUNNING',runs:[],limits:['Actual Windows desktop NVIDIA recordings; not physical iPhone evidence.','Video capture overhead excludes these runs from performance measurements.']}
async function ready(p,id){await p.waitForFunction(id=>{const d=window.orasSolarDiagnostics?.();return d?.selected===id&&d.renderCount>0&&!d.animating&&!d.destinations.pendingFocus&&!d.assets.requests&&!d.detail.pending},id,{timeout:60000})}
async function select(p,id){await p.locator('.solar-destinations>summary').click();await p.getByLabel('Search Solar System',{exact:true}).fill(id);await p.locator('.solar-search-results button').first().click();await ready(p,id)}
async function preset(p,name){await p.locator('.solar-framing>summary').click();await p.getByRole('button',{name,exact:true}).click();await ready(p,null)}
try{for(const [name,width,height] of [['pluto-charon',1440,900],['ceres-asteroids',1440,900],['kuiper-eris',844,390],['comet-trajectories',390,844]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,reducedMotion:'no-preference',recordVideo:{dir:path.join(out,'video'),size:{width,height}}}),p=await context.newPage(),run={name,width,height,steps:[],errors:[]};receipt.runs.push(run)
 p.on('pageerror',e=>run.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')run.errors.push(m.text())})
 async function mark(label){run.steps.push({label,url:p.url(),diagnostics:await p.evaluate(()=>window.orasSolarDiagnostics?.()??window.orasSystemDiagnostics?.())});await p.waitForTimeout(500)}
 await p.goto('http://localhost:4231/solar-system?date='+epoch);await ready(p,null)
 if(name==='pluto-charon'){
  await preset(p,'Outer planets');await mark('Outer planets');await select(p,'pluto');await mark('Pluto');await p.getByRole('button',{name:'Explore Pluto & Charon →',exact:true}).click();await p.waitForFunction(()=>{const d=window.orasSystemDiagnostics?.();return d?.system==='pluto'&&d.renderCount>0&&!d.animating&&!d.assets.requests});await mark('Pluto system')
  await p.getByRole('button',{name:/^Moons/}).click();await p.locator('#system-moon-list').getByRole('button',{name:/Charon/}).click();await p.waitForFunction(()=>{const d=window.orasSystemDiagnostics?.();return d?.selected==='charon'&&!d.animating&&!d.detail.pending});await mark('Charon')
  await p.getByRole('button',{name:'← Solar System',exact:true}).click();await ready(p,'pluto');await mark('Solar return')
 }else if(name==='ceres-asteroids'){
  await preset(p,'Asteroid belt');await p.waitForFunction(()=>window.orasSolarDiagnostics()?.population.drawnCount>0);await mark('Source asteroid population');for(const id of ['ceres','vesta','eros']){await select(p,id);await mark(id)}await preset(p,'Asteroid belt');await mark('Belt return')
 }else if(name==='kuiper-eris'){
  await preset(p,'Kuiper Belt');await p.waitForFunction(()=>window.orasSolarDiagnostics()?.population.drawnCount>0);await mark('Source TNO population');await select(p,'eris');await mark('Unresolved Eris reference body');await p.getByRole('button',{name:'View source trajectory →',exact:true}).click();await ready(p,'eris');await mark('Bounded Eris source path');await preset(p,'Kuiper Belt');await mark('Kuiper return')
 }else{
  for(const id of ['halley','67p','borisov']){await select(p,id);await mark(id);await p.getByRole('button',{name:'View source trajectory →',exact:true}).click();await ready(p,id);await mark(id+' source path')}await preset(p,'All planets');await mark('Solar return')
 }
 assert.deepEqual(run.errors,[]);run.video=path.basename(await p.video().path());run.status='PASS';await context.close();await writeFile(path.join(out,'journeys.json'),JSON.stringify(receipt,null,2));console.log(name,'PASS')
}receipt.status='PASS'}catch(e){receipt.status='FAIL';receipt.failure=String(e);throw e}finally{await browser.close();await writeFile(path.join(out,'journeys.json'),JSON.stringify(receipt,null,2))}
