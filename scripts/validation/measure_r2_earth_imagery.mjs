// Read-only, explicitly opted-in native renderer measurement; real public imagery, no replay.
import {chromium} from '../../node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.R2_BASE||'http://127.0.0.1:4208',out=process.env.R2_EVIDENCE||'output/playwright/r2-earth-ux-baseline';
const cases=[['reference',-79.79659134,41.36516869,35189],['oras-medium',-79.585394,41.321903,12000],['oras-close',-79.585394,41.321903,900],['us-aerial',-79.585394,41.321903,3000],['paris',2.3522,48.8566,2000],['uncovered',-149.9003,61.2181,2000]];
await mkdir(out,{recursive:true});const proof={base,class:'real-source software Chromium; native flight, no forced source update',started:new Date().toISOString(),cases,runs:[]};
try{for(const width of(process.env.R2_WIDTHS||'1440,390').split(',').map(Number)){
 const profile=`${out}/profile-${width}`;let context;
 for(const phase of ['cold','warm','restart']){
 if(phase!=='warm')context=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width,height:844},isMobile:width<768,hasTouch:width<768});
 const page=await context.newPage(),cdp=await context.newCDPSession(page),requests=new Map();await cdp.send('Network.enable');
 cdp.on('Network.requestWillBeSent',e=>{if(/tiles|MapServer|eox|wms|wmts|imagery/i.test(e.request.url))requests.set(e.requestId,{url:e.request.url,wallTime:e.wallTime,timestamp:e.timestamp})});
 cdp.on('Network.responseReceived',e=>{const row=requests.get(e.requestId);if(row)Object.assign(row,{status:e.response.status,mimeType:e.response.mimeType,fromDiskCache:e.response.fromDiskCache,fromServiceWorker:e.response.fromServiceWorker,timing:e.response.timing,responseTimestamp:e.timestamp})});
 cdp.on('Network.loadingFinished',e=>{const row=requests.get(e.requestId);if(row)Object.assign(row,{finished:e.timestamp,encodedBytes:e.encodedDataLength})});cdp.on('Network.loadingFailed',e=>{const row=requests.get(e.requestId);if(row)Object.assign(row,{error:e.errorText,finished:e.timestamp})});
 await page.goto(base+'/earth-runtime/?orasProof=1&orasPerf=1');await page.waitForFunction(()=>typeof window.orasEarthPerformanceFlight==='function',{},{timeout:30000});
 const startup=await page.evaluate(()=>window.orasEarthDiagnostics());
 for(const [name,lon,lat,height]of cases){requests.clear();const row={width,phase,name,startup,checkpoints:[]};proof.runs.push(row);console.log(width,phase,name);
 await page.evaluate(args=>window.orasEarthPerformanceFlight(args),{lon,lat,height,utc:'2026-06-05T17:00:00Z'});const start=Date.now();
 for(const ms of[1000,3000,8000]){await page.waitForTimeout(Math.max(0,ms-(Date.now()-start)));const file=`${width}-${phase}-${name}-${ms}.png`;await page.screenshot({path:out+'/'+file,timeout:12000});row.checkpoints.push({requestedMs:ms,actualMs:Date.now()-start,file,state:await page.evaluate(()=>({diagnostics:window.orasEarthDiagnostics(),native:window.orasEarthProofState()}))})}
 row.cache=await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration('/earth-runtime/');if(!registration?.active)return {status:'uncontrolled'};return await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>resolve({status:'timeout'}),5000);channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data)};registration.active.postMessage({type:'imagery-cache-status'},[channel.port2])})});row.requests=[...requests.values()];await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n')}
 await page.close();if(phase!=='cold'){await context.close();context=null}
 }if(context)await context.close();}
 proof.status='RECORDED';}catch(e){proof.status='FAIL';proof.error=e.stack;throw e}finally{await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n')}
