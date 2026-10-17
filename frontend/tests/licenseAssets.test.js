import {it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import config from '../vite.config.mjs'
it('production bundles ship the exact license and credit assets without copying mounted skydata',()=>{
 const emitted=[];config.plugins.find(p=>p.name==='oras-runtime-spa').generateBundle.call({emitFile:value=>emitted.push(value)})
 for(const name of ['stellarium-web-engine-AGPL-3.0.txt','cesium-license.txt','sky-data-credits.html','README.txt']){const row=emitted.find(x=>x.fileName==='licenses/'+name);expect(row?.source).toEqual(readFileSync(new URL('../public/licenses/'+name,import.meta.url)))}
 expect(emitted.some(x=>x.fileName.includes('/skydata/'))).toBe(false)
})
