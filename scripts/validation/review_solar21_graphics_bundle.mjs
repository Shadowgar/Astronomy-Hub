/** Independent production module audit. No generated application files are written.
 * Run from repository root: node scripts/validation/review_solar21_graphics_bundle.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {build} from '../../frontend/node_modules/vite/dist/node/index.js'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..')
const frontend=path.join(root,'frontend')
const hashes={}
for(const name of ['package.json','package-lock.json','graphics/package.json','graphics/package-lock.json','vite.config.mjs']){
 hashes[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(frontend,name))).digest('hex')
}
const ids=new Set()
await build({root:frontend,configFile:path.join(frontend,'vite.config.mjs'),logLevel:'error',build:{write:false},plugins:[{
 name:'solar21-independent-module-audit',
 generateBundle(_,bundle){for(const chunk of Object.values(bundle))if(chunk.type==='chunk')for(const id of Object.keys(chunk.modules))ids.add(id)}
}]})
const all=[...ids],graphics=all.filter(id=>id.includes('/graphics/node_modules/'))
const unwanted=graphics.filter(id=>/\/(react|react-dom|react-reconciler|react-merge-refs|@react-three)\//.test(id))
const version=name=>JSON.parse(fs.readFileSync(path.join(frontend,name,'package.json'))).version
const relative=ids=>ids.map(id=>path.relative(root,id))
const receipt={
 status:unwanted.length?'FAIL':'PASS',
 command:'node scripts/validation/review_solar21_graphics_bundle.mjs',
 hashes,totalBundledModules:all.length,graphicsBundledModules:graphics.length,
 hubReactVersion:version('node_modules/react'),
 graphicsReactVersion:version('graphics/node_modules/react'),
 graphicsFiberVersion:version('graphics/node_modules/@react-three/fiber'),
 bundledReactModules:relative(all.filter(id=>/\/node_modules\/react\//.test(id))),
 unwantedGraphicsReactOrR3FModules:relative(unwanted),
 bundledTakramVanillaModules:relative(graphics.filter(id=>/\/@takram\/three-(atmosphere|geospatial)\/build\//.test(id))),
}
console.log(JSON.stringify(receipt,null,2))
if(unwanted.length)process.exitCode=1
