// Native format packaging. Source PNG is preserved; near-opaque generated matte
// values (250..255) encode as opaque in HiPS, with antialiased edges retained.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from '../../node_modules/playwright/index.mjs';
const root='runtimes/sky-adapter/assets/pennsylvania-woodland-v1',out=`${root}/hips`,tmp='output/n1/pennsylvania/packing';
await mkdir(`${out}/Norder0/Dir0`,{recursive:true});await mkdir(tmp,{recursive:true});
const native=process.env.SWE_SOURCE_DIR||'/var/tmp/oras-phase-c/sky-reconstruction/upstream/src';
assert.equal(createHash('sha256').update(await readFile(native+'/algos/healpix.c')).digest('hex'),'35dbe93b341d8924c03e8eedd3081eaf2d553f4d3cf8894cd889fd7aa72c2484','Use the qualified pinned SWE HEALPix source');
execFileSync('cc',['-std=gnu11','-O2','-I'+native,'scripts/runtime/landscape_hips_sample.c',native+'/algos/healpix.c','-lm','-o',tmp+'/sample']);
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();const original=await readFile(`${root}/panorama.png`);
 const input=await page.evaluate(async b64=>{const b=await createImageBitmap(new Blob([Uint8Array.from(atob(b64),c=>c.charCodeAt(0))],{type:'image/png'}));const c=new OffscreenCanvas(b.width,b.height),ctx=c.getContext('2d');ctx.drawImage(b,0,0);const d=ctx.getImageData(0,0,b.width,b.height).data;let transparent=0,opaque=0,nearOpaque=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)transparent++;if(d[i]===255)opaque++;if(d[i]>=250)nearOpaque++}let binary='';for(let i=0;i<d.length;i+=8192)binary+=String.fromCharCode(...d.slice(i,i+8192));return {width:b.width,height:b.height,rgba:btoa(binary),transparent,opaque,nearOpaque}},original.toString('base64'));
 console.log(JSON.stringify({width:input.width,height:input.height,transparent:input.transparent,opaque:input.opaque,nearOpaque:input.nearOpaque}));
 assert.ok(input.transparent>input.width*input.height*.25);assert.ok(input.nearOpaque>input.width*input.height*.25);
 const rgba=Buffer.from(input.rgba,'base64');const size=512,tiles=[];
 for(let pix=0;pix<12;pix++){
  const raw=`${tmp}/Npix${pix}.rgba`;execFileSync(tmp+'/sample',[String(input.width),String(input.height),String(size),String(pix),raw],{input:rgba});
  const pixels=await readFile(raw);const png=await page.evaluate(async ({data,size})=>{const rgba=Uint8ClampedArray.from(atob(data),c=>c.charCodeAt(0)),c=new OffscreenCanvas(size,size),ctx=c.getContext('2d');ctx.putImageData(new ImageData(rgba,size,size),0,0);const b=await c.convertToBlob({type:'image/png'});const d=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<d.length;i+=8192)s+=String.fromCharCode(...d.slice(i,i+8192));return btoa(s)},{data:pixels.toString('base64'),size});
  await writeFile(`${out}/Norder0/Dir0/Npix${pix}.png`,Buffer.from(png,'base64'));tiles.push(png);
 }
 // Native level-zero Allsky atlas uses floor(sqrt(12))=3 columns and 4 rows.
 const atlas=await page.evaluate(async tiles=>{const c=new OffscreenCanvas(384,512),ctx=c.getContext('2d');for(let i=0;i<12;i++){const b=await createImageBitmap(new Blob([Uint8Array.from(atob(tiles[i]),c=>c.charCodeAt(0))],{type:'image/png'}));ctx.drawImage(b,(i%3)*128,Math.floor(i/3)*128,128,128);b.close()}const d=new Uint8Array(await(await c.convertToBlob({type:'image/png'})).arrayBuffer());let s='';for(let i=0;i<d.length;i+=8192)s+=String.fromCharCode(...d.slice(i,i+8192));return btoa(s)},tiles);
 await writeFile(`${out}/Norder0/Allsky.png`,Buffer.from(atlas,'base64'));
 await writeFile(`${out}/properties`,'hips_order = 0\nhips_order_min = 0\nhips_tile_width = 512\nhips_tile_format = png\ndataproduct_type = image\nobs_title = Illustrative Pennsylvania woodland\nhips_service_url = /oras-sky-engine/landscapes/pennsylvania-woodland-v1\ntype = landscape\n');
 await writeFile(`${out}/description.en.utf8`,'<h1>Illustrative Pennsylvania woodland</h1><p>Original synthetic 360-degree scenery inspired by rural northwestern Pennsylvania. Not surveyed ORAS terrain or any measured local geography. Artistic ridge heights are decorative pixels, never scientific horizon measurements. Observer coordinates, ephemerides and geometric horizon calculations remain native Stellarium.</p>');
 const sha=data=>createHash('sha256').update(data).digest('hex'),files=[];for(const name of ['properties','description.en.utf8','Norder0/Allsky.png',...Array.from({length:12},(_,i)=>`Norder0/Dir0/Npix${i}.png`)]){const data=await readFile(`${out}/${name}`);files.push({path:name,bytes:data.length,sha256:sha(data)})}
 const manifest={id:'pennsylvania-woodland-v1',illustrative:true,surveyed:false,scientificHorizon:false,source:{path:'panorama.png',sha256:sha(original),width:input.width,height:input.height,transparentPixels:input.transparent,opaquePixels:input.opaque},nativeHealpixSha256:sha(await readFile(native+'/algos/healpix.c')),format:'native observed-frame HiPS PNG RGBA; NESTED order 0',alphaEncoding:'source matte alpha 250..255 becomes opaque 255; lower edge coverage retained; premultiplied-alpha bilinear resampling',files};
 await writeFile(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({source:manifest.source,files:files.length,bytes:files.reduce((sum,f)=>sum+f.bytes,0)}));
}finally{await browser.close()}
