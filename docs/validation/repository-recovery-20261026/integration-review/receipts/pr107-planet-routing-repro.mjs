import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const root=process.argv[2]||'/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026';
// Vite normally supplies __dirname while bundling this existing .mjs config.
globalThis.__dirname=root+'/frontend';
const {default:config}=await import(pathToFileURL(root+'/frontend/vite.config.mjs'));
const emitted=[];
config.plugins.find(p=>p.name==='oras-runtime-spa').generateBundle.call({emitFile:file=>emitted.push(file.fileName)});
const nginx=readFileSync(root+'/frontend/nginx.conf','utf8');
const compose=readFileSync(root+'/docker-compose.yml','utf8');
const result={devProxy:Object.keys(config.server.proxy),previewProxy:Object.keys(config.preview.proxy),emitted:emitted.length,planetRuntimeAssets:emitted.filter(f=>f.startsWith('planet-runtime/')),planetDataAssets:emitted.filter(f=>f.startsWith('planet-data/')),productionPlanetRoute:nginx.includes('location /planet-runtime/'),productionPlanetData:nginx.includes('location /planet-data/'),composePlanetRuntime:compose.includes('planet-runtime'),composeMoonSurface:compose.includes('lunar-surface')};
console.log(JSON.stringify(result,null,2));
assert.ok(result.devProxy.includes('/planet-runtime/'),'canonical Vite must serve or proxy the new Moon renderer');
assert.ok(result.devProxy.includes('/planet-data/'),'canonical Vite must serve or proxy source Moon imagery');
assert.ok(result.productionPlanetRoute&&result.productionPlanetData,'production nginx must route the isolated Moon runtime and data');
