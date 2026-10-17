// Compare actual before/after captures. Analysis canvas is never attached to Sky.
import {chromium} from '../../node_modules/playwright/index.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='output/n1/native-horizon';
const paths={before:`${out}/before/before-green-1440.png`,after:`${out}/visual/night-off-1440.png`,off:`${out}/visual/landscape-off-1440.png`};
const bytes={};for(const [key,path]of Object.entries(paths))bytes[key]=(await readFile(path)).toString('base64');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();const result=await page.evaluate(async bytes=>{
  const images={};for(const [key,b64]of Object.entries(bytes)){const bitmap=await createImageBitmap(new Blob([Uint8Array.from(atob(b64),c=>c.charCodeAt(0))],{type:'image/png'}));const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);images[key]={width:bitmap.width,height:bitmap.height,data:ctx.getImageData(0,0,bitmap.width,bitmap.height).data};bitmap.close()}
  const {width:w,height:h}=images.before;let groundPixels=0,changedGroundPixels=0,offBrightPixels=0;const skyBefore=new Set(),skyAfter=new Set();
  for(let y=Math.round(h*.2);y<h*.8;y++)for(let x=Math.round(w*.2);x<w*.7;x++){const i=(y*w+x)*4,a=images.before.data,b=images.after.data,c=images.off.data;if(y>h*.6){groundPixels++;if(a.slice(i,i+3).some((v,j)=>v!==b[i+j]))changedGroundPixels++;if(c[i]>180&&c[i+1]>180&&c[i+2]>180)offBrightPixels++}else if(y<h*.45){if(a[i]>180&&a[i+1]>180&&a[i+2]>180)skyBefore.add(y*w+x);if(b[i]>180&&b[i+1]>180&&b[i+2]>180)skyAfter.add(y*w+x)}}
  const pixel=img=>[...img.data.slice((Math.round(h*.7)*w+Math.round(w*.35))*4,(Math.round(h*.7)*w+Math.round(w*.35))*4+4)];
  return {groundPixels,changedGroundPixels,beforeGround:pixel(images.before),afterGround:pixel(images.after),aboveBrightPixelsBefore:skyBefore.size,aboveBrightPixelsAfter:skyAfter.size,aboveBrightPixelsMatched:[...skyBefore].filter(p=>skyAfter.has(p)).length,landscapeOffBrightPixelsBelowHorizon:offBrightPixels};
 },bytes);
 console.log(result);
 await writeFile(`${out}/before-after-pixels-raw.json`,JSON.stringify(result,null,2)+'\n');
 assert.equal(result.groundPixels,result.changedGroundPixels);assert.deepEqual(result.beforeGround,[26,38,26,255]);assert.deepEqual(result.afterGround,[9,10,13,255]);assert.ok(result.aboveBrightPixelsAfter>20);assert.ok(result.landscapeOffBrightPixelsBelowHorizon>0);
 await writeFile(`${out}/before-after-pixels.json`,JSON.stringify({status:'PASS',paths,...result,abovePixelLimit:'Separate fresh loads do not establish exact bright-pixel equality. Controlled native-color-only comparisons are in visual/proof.json.'},null,2)+'\n');console.log(result);
}finally{await browser.close()}
