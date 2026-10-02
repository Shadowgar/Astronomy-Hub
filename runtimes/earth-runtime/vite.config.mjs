import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const source=process.env.GODS_EYE_SOURCE;
if(!source)throw Error('GODS_EYE_SOURCE required');
const pkg=JSON.parse(fs.readFileSync(path.join(source,'package.json')));
const forbidden=/\/src\/(?:main\.js|standalone\/application\.js|app\/|data\/local_data\/)|\/public\/(?:models|events)\//;
export default {
 root:here,base:'/earth-runtime/',publicDir:false,
 resolve:{alias:[
  {find:/^gods-eye-view\/(.+)$/,replacement:'gods-eye-view/$1',customResolver(id){const surface='./'+id.slice('gods-eye-view/'.length),target=pkg.exports[surface];if(typeof target!=='string')throw Error('Unqualified public export '+id);return path.join(source,target)}},
  {find:/^cesium$/,replacement:path.join(source,'node_modules/cesium/Source/Cesium.js')},
  {find:/^cesium\/(.*)$/,replacement:path.join(source,'node_modules/cesium/$1')},
  {find:/^satellite.js$/,replacement:path.join(source,'node_modules/satellite.js/lib/index.js')},
 ]},
 define:{CESIUM_BASE_URL:JSON.stringify('/earth-runtime/cesium/')},
 plugins:[{name:'oras-selective-export-policy',moduleParsed(info){if(forbidden.test(info.id))throw Error('Forbidden full-app or unqualified asset import '+info.id)},generateBundle(){const upstream=[...this.getModuleIds()].filter(id=>id.startsWith(source+'/src/')).map(id=>id.slice(source.length+1)).sort();this.emitFile({type:'asset',fileName:'module-policy.json',source:JSON.stringify({upstreamModules:upstream,completeApplication:false,viewerOwner:'Astronomy Hub',bundledThirdPartyDatasets:[]},null,2)});}}],
 build:{outDir:process.env.ORAS_EARTH_OUT,emptyOutDir:true,sourcemap:false,assetsInlineLimit:0},
};
