import {chromium} from '../../node_modules/playwright/index.mjs'
import {writeFile,mkdir} from 'node:fs/promises'
import path from 'node:path'
const out=process.argv[2];await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
try{for(const system of ['jupiter','saturn']){
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage(),cdp=await context.newCDPSession(page)
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Profiler.enable');await cdp.send('Profiler.start')
 await page.goto(`http://localhost:4231/planetary-system/${system}?date=2026-10-27T04:00:00.000Z&moon=${system}`)
 await page.waitForFunction(()=>{const d=window.orasSystemDiagnostics?.();return d&&!d.animating&&!d.detail.pending&&!d.assets.requests&&d.bodies.every(b=>b.overviewReady)},{},{timeout:60000})
 const profile=await cdp.send('Profiler.stop');await writeFile(path.join(out,system+'.cpuprofile'),JSON.stringify(profile.profile));await page.screenshot({path:path.join(out,system+'.png')});await context.close()
}}finally{await browser.close()}
