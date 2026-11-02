import {chromium} from '../../node_modules/playwright/index.mjs'
import {writeFile} from 'node:fs/promises'
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),samples=[]
page.on('pageerror',e=>console.log('ERROR',e.message))
try{
await page.goto('http://localhost:4231/planetary-system/jupiter?date=2026-10-27T04:00:00.000Z&moon=callisto')
await page.waitForFunction(()=>{const d=window.orasSystemDiagnostics?.();return d?.selected==='callisto'&&!d.animating&&!d.detail.pending})
await page.getByRole('button',{name:'Resume orbital motion',exact:true}).click()
for(let i=0;i<30;i++){await page.waitForTimeout(300);const d=await page.evaluate(()=>{const x=window.orasSystemDiagnostics?.();return{epoch:x?.epoch,playing:x?.playing,instance:x?.instanceId,coverage:x?.sampledCoverage,renderCount:x?.renderCount,notice:document.querySelector('.solar-notice')?.textContent,error:document.querySelector('[role=alert]')?.textContent,url:location.href}});samples.push(d);console.log(JSON.stringify(d))}
}finally{await writeFile(process.argv[2],JSON.stringify(samples,null,2));await browser.close()}
