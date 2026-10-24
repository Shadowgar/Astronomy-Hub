import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const source=process.env.GODS_EYE_SOURCE;
if(!source)throw Error('GODS_EYE_SOURCE required to reuse the qualified SDK');
const sdk=path.join(source,'node_modules/cesium');
if(JSON.parse(fs.readFileSync(path.join(sdk,'package.json'),'utf8')).version!=='1.138.0')throw Error('Unqualified Cesium SDK; expected 1.138.0');
export default {root:here,base:'/planet-runtime/',publicDir:false,resolve:{alias:[{find:/^cesium$/,replacement:path.join(sdk,'Source/Cesium.js')},{find:/^cesium\/(.*)$/,replacement:path.join(sdk,'$1')}]},plugins:[{name:'qualified-lunar-source-ledger',generateBundle(){this.emitFile({type:'asset',fileName:'moon-source-manifest.json',source:fs.readFileSync(path.join(here,'moon-source-manifest.json'),'utf8')});}}],define:{CESIUM_BASE_URL:JSON.stringify('/earth-runtime/cesium/')},build:{outDir:process.env.ORAS_PLANET_OUT,emptyOutDir:true,sourcemap:false,assetsInlineLimit:0}};
