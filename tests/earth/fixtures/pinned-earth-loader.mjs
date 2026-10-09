// Test-only resolver for the same public exports used by the pinned Vite builder.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const source=process.env.GODS_EYE_SOURCE||'/var/tmp/oras-cesium/gods-eye';
const pkg=JSON.parse(fs.readFileSync(source+'/package.json'));
export async function resolve(specifier,context,next){
 if(specifier==='cesium')return {url:pathToFileURL(source+'/node_modules/cesium/Source/Cesium.js').href,shortCircuit:true};
 if(specifier.startsWith('gods-eye-view/')){const target=pkg.exports['./'+specifier.slice('gods-eye-view/'.length)];if(typeof target!=='string')throw Error('Unknown public export');return {url:pathToFileURL(source+'/'+target).href,shortCircuit:true};}
 return next(specifier,context);
}
