import {sourceIdentity} from './r4_evidence.mjs';
// Real native-browser qualification. No mocked successful science or image responses.
import {chromium} from '../../node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.R4_URL||'http://127.0.0.1:4222',out=process.env.R4_OUT||'output/r4-a/browser';
await mkdir(out,{recursive:true});
const proof={status:'RUNNING',runs:[],limitations:['Chromium SwiftShader; viewport/touch emulation is not physical-device/GPU qualification.','Historical coarse lunar photomosaic, no terrain or calibrated reflectance.']};
const browser=await chromium.launch();
const epoch='2026-10-23T01:05:00Z',solar='/solar-system?date='+epoch;
const close=(a,b,t=1e-8)=>Math.abs(a-b)<t;
const sameCamera=(a,b)=>{for(const k of ['camera','target','cameraUp'])assert.ok(a[k].every((v,i)=>close(v,b[k][i])),k+' preserved');assert.equal(a.epoch,b.epoch);assert.equal(a.selected,b.selected);for(const k of ['quality','sizeMode','effectsVisible','orbitsVisible','closeView'])assert.equal(a[k],b[k],k+' preserved');};
proof.source_sha256=await sourceIdentity();
try{
for(const [width,height] of (process.env.R4_VIEWPORT?[process.env.R4_VIEWPORT.split('x').map(Number)]:[[1440,900],[390,900],[667,390]])){
 const run={width,height,status:'RUNNING',checks:[],screenshots:[],errors:[]};proof.runs.push(run);
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<768,reducedMotion:'reduce'}),p=await context.newPage();p.setDefaultTimeout(15000);
 p.on('pageerror',e=>run.errors.push(e.message));run.consoleErrors=[];p.on('console',m=>{if(m.type()==='error')run.consoleErrors.push(m.text().slice(0,1200))});
 await p.addInitScript(()=>{window.r4BridgeEvidence=[];addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.namespace==='oras.planet.v1')window.r4BridgeEvidence.push(e.data)})});
 const f=()=>p.frames().find(f=>f.url().includes('/planet-runtime/'));
 const native=()=>f().evaluate(()=>window.orasPlanetDiagnostics());
 const s=()=>p.evaluate(()=>window.orasSolarDiagnostics());
 const readySolar=()=>p.locator('[data-solar-status=ready]').waitFor({timeout:60000});
 const readyMoon=async()=>{try{await p.locator('[data-planet-status=ready]').waitFor({timeout:30000});await f().waitForFunction(()=>window.orasPlanetDiagnostics()?.globeTilesLoaded,null,{timeout:15000});}catch(error){run.failure={url:p.url(),body:await p.locator('body').innerText(),native:f()?await native():null,bridge:await p.evaluate(()=>window.r4BridgeEvidence)};await p.screenshot({path:out+`/${width}x${height}-failure.png`});throw error}};
 const shot=async(name)=>{const file=`${width}x${height}-${name}.png`;await p.screenshot({path:out+'/'+file});run.screenshots.push(file);return file};
 const enter=async()=>{if(!new URL(p.url()).searchParams.has('solarSatellite'))await p.getByRole('button',{name:'Moon',exact:true}).click();await p.getByRole('button',{name:'Approach Moon',exact:true}).click();await readyMoon();};
 await p.goto(base+solar);await readySolar();
 await p.getByRole('button',{name:'Orbit camera left',exact:true}).click();
 await p.getByRole('button',{name:'Moon',exact:true}).click();await p.getByRole('button',{name:'Approach Moon',exact:true}).waitFor();
 await shot('solar-moon-context');const before=await s();await enter();
 const initial=await native();run.native=initial;
 assert.equal(initial.bodyId,'moon');assert.equal(initial.centerNaifId,'301');assert.equal(initial.frame,'MOON_ME_DE440_ME421');assert.equal(Date.parse(initial.epoch),Date.parse(epoch));assert.equal(Date.parse(initial.sceneEpoch),Date.parse(epoch));assert.equal(initial.terrain,false);assert.equal(initial.earthEffectsDisabled,true);
 for(const k of ['radiiM','globeRadiiM','sceneRadiiM','projectionRadiiM','terrainRadiiM','imageryRadiiM'])assert.deepEqual(initial[k],[1737400,1737400,1737400],k);
 assert.ok(initial.renderedFrames>0,'a real native frame completed');assert.equal(initial.source.status,'ready');assert.equal(initial.source.noDataPixels,325773);
 assert.equal(await p.locator('.solar-canvas canvas').count(),0,'Solar renderer absent in Planet');assert.equal(await p.locator('iframe').count(),1);
 await shot('moon-globe');run.checks.push('Actual native globe: center301, lunar radii in all six components, correct ME frame/UTC, actual imagery ready, no Earth effects, one renderer');
 const api=await (await p.request.get(base+'/api/v1/planet-view/moon?time='+epoch)).json();assert.ok(initial.lightEmissionDirection.every((v,i)=>Math.abs(v+api.illumination.direction_body_fixed[i])<1e-12),'normalized Moon-to-Sun vector has opposite light propagation sign');
 await p.getByRole('button',{name:'Sources',exact:true}).click();await shot('moon-sources');assert.match(await p.getByRole('region',{name:'Planet source and capabilities'}).innerText(),/No terrain/);await p.getByRole('button',{name:'Close source details',exact:true}).click();
 // Inputs are Hub-owned, but destinations must be verified on the real camera.
 await p.getByLabel('Lunar latitude',{exact:true}).fill('12.5');await p.getByLabel('Lunar longitude',{exact:true}).fill('-42');await p.getByLabel('Height above lunar reference sphere',{exact:true}).fill('1000000');await p.getByRole('button',{name:'Go',exact:true}).click();
 await f().waitForFunction(()=>Math.abs(window.orasPlanetDiagnostics().camera.longitudeDeg+42)<1e-6);
 let camera=(await native()).camera;assert.ok(close(camera.latitudeDeg,12.5,1e-6));assert.ok(close(camera.heightM,1000000,1));
 await p.getByLabel('Lunar latitude',{exact:true}).fill('91');await p.getByRole('button',{name:'Go',exact:true}).click();await p.getByRole('alert').filter({hasText:/Enter latitude/}).waitFor();assert.ok(close((await native()).camera.latitudeDeg,camera.latitudeDeg));await p.getByRole('button',{name:'Dismiss',exact:true}).click();
 await p.getByLabel('Lunar latitude',{exact:true}).fill('12.5');await p.getByLabel('Height above lunar reference sphere',{exact:true}).fill('100');await p.getByRole('button',{name:'Go',exact:true}).click();await p.getByRole('alert').filter({hasText:/30,000/}).waitFor();assert.ok(close((await native()).camera.heightM,camera.heightM));await p.getByRole('button',{name:'Dismiss',exact:true}).click();
 await p.getByRole('button',{name:'Zoom Moon in',exact:true}).click();await f().waitForFunction(height=>window.orasPlanetDiagnostics().camera.heightM<height,camera.heightM);const orbitBefore=(await native()).camera.longitudeDeg;await p.getByRole('button',{name:'Orbit Moon right',exact:true}).click();await f().waitForFunction(lon=>Math.abs(window.orasPlanetDiagnostics().camera.longitudeDeg-lon)>1,orbitBefore);
 const canvas=f().locator('canvas');await canvas.focus();let keyBefore=(await native()).camera;await p.keyboard.press('ArrowRight');await f().waitForFunction(old=>Math.abs(window.orasPlanetDiagnostics().camera.longitudeDeg-old)>1,keyBefore.longitudeDeg);
 const box=await canvas.boundingBox();if(width<768){const cd=await context.newCDPSession(p);const x=Math.round(width*.62),y=Math.round(height*.55);let a=(await native()).camera;await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=6;i++)await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+8*i,y:y+2*i,id:1}]});await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(400);let b=(await native()).camera;assert.ok(Math.abs(a.longitudeDeg-b.longitudeDeg)+Math.abs(a.latitudeDeg-b.latitudeDeg)>.01,'native touch moves camera');}
 else{await p.mouse.move(box.x+box.width*.65,box.y+box.height*.5);await p.mouse.down();await p.mouse.move(box.x+box.width*.7,box.y+box.height*.55,{steps:6});await p.mouse.up();await p.waitForTimeout(400);}
 run.checks.push('Native coordinate destination, invalid latitude/height unchanged, zoom/orbit, keyboard, '+(width<768?'CDP touch drag':'mouse drag'));
 await p.waitForFunction(()=>{const c=document.querySelector('iframe')?.contentWindow?.orasPlanetDiagnostics()?.camera,q=new URLSearchParams(location.search);return c&&Math.abs(c.latitudeDeg-Number(q.get('lat')))<1e-7&&Math.abs(c.longitudeDeg-Number(q.get('lon')))<1e-7&&Math.abs(c.heightM-Number(q.get('height')))<.01});camera=(await native()).camera;run.beforeReload={camera,url:p.url()};await p.reload();await readyMoon();const reloaded=(await native()).camera;run.afterReload=reloaded;for(const k of ['latitudeDeg','longitudeDeg','heightM','headingRad','pitchRad','rollRad'])assert.ok(close(camera[k],reloaded[k],k==='heightM'?1:1e-5),k+' reload');run.checks.push('Native camera/epoch survives direct route reload');
 // Explicit return awaits the real native viewer.destroy() acknowledgement.
 await p.getByRole('button',{name:'Return to Solar',exact:true}).first().click();await readySolar();sameCamera(before,await s());assert.equal(await p.locator('iframe').count(),0);assert.ok(await p.evaluate(()=>window.r4BridgeEvidence.some(m=>m.type==='ack'&&m.state?.disposed&&m.state?.viewerDestroyed)));run.checks.push('Return restores Solar source camera/target/up/epoch/selection/display policy; native destroy acknowledged');
 // Browser Back and Forward have independent history semantics.
 await enter();await p.goBack();await readySolar();sameCamera(before,await s());await p.goForward();await readyMoon();assert.equal((await native()).epoch,initial.epoch);await p.getByRole('button',{name:'Return to Solar',exact:true}).first().click();await readySolar();
 for(let i=0;i<3;i++){const a=await s();await enter();await p.getByRole('button',{name:'Return to Solar',exact:true}).first().click();await readySolar();sameCamera(a,await s());}
 run.checks.push('Five explicit return cycles plus independent Back/Forward; one canvas/iframe ownership retained');
 if(width===1440){
  await p.getByRole('navigation',{name:'Select a celestial body'}).getByRole('button',{name:'Mars',exact:true}).click();await p.getByRole('button',{name:'View selected body',exact:true}).click();await p.getByRole('button',{name:'Moon',exact:true}).click();const closeBefore=await s();assert.equal(closeBefore.closeView,true);await enter();await p.getByRole('button',{name:'Return to Solar',exact:true}).click();await readySolar();await p.waitForTimeout(250);sameCamera(closeBefore,await s());await p.setViewportSize({width:1350,height:850});await p.waitForTimeout(250);assert.equal((await s()).closeView,true);
  await p.getByRole('navigation',{name:'Select a celestial body'}).getByRole('button',{name:'Jupiter',exact:true}).click();await p.reload();await readySolar();assert.equal((await s()).selected,'jupiter');assert.equal(new URL(p.url()).searchParams.get('solarBody'),'jupiter');run.checks.push('Close-up semantics retained across return/resize; subsequent selection reload discards stale snapshot');
  await p.setViewportSize({width,height});
 }
 assert.deepEqual(run.errors,[]);run.status='PASS';await context.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2));console.log(width,height,'PASS',run.checks.length,'groups');
}
proof.status='PASS';
}catch(error){proof.status='FAIL';proof.error=error.stack;console.error(error.stack);process.exitCode=1;}finally{await browser.close();assert.deepEqual(await sourceIdentity(),proof.source_sha256,'Source changed during browser qualification');await writeFile(out+'/proof.json',JSON.stringify(proof,null,2));}
