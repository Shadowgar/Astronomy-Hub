// Independent source/math review. Does not launch a browser or modify runtime files.
import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath,pathToFileURL} from 'node:url'
import path from 'node:path'
const root=fileURLToPath(new URL('../../../../',import.meta.url))
const load=p=>import(pathToFileURL(path.join(root,p)).href)
const ts=(await load('frontend/node_modules/typescript/lib/typescript.js')).default
const T=await load('frontend/graphics/node_modules/three/build/three.module.js')
const atmosphereUrl=pathToFileURL(path.join(root,'frontend/graphics/node_modules/@takram/three-atmosphere/build/index.js')).href
const {AerialPerspectiveEffect}=await import(atmosphereUrl)
const adapterPath='frontend/src/features/solar/solarTakramDepth.ts'
const source=await readFile(path.join(root,adapterPath),'utf8')
const compiled=ts.transpileModule(source.replace("from '@takram/three-atmosphere'",`from '${atmosphereUrl}'`),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const {SolarAerialPerspectiveEffect,solarDepthReconstruction}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'))
const camera=new T.PerspectiveCamera(48,1440/900,100,2000*149597870700)
const original=new AerialPerspectiveEffect(camera),candidate=new SolarAerialPerspectiveEffect(camera,{})
const old=original.getFragmentShader(),changed=candidate.getFragmentShader()
const start=old.indexOf('  depth = reverseLogDepth(depth, cameraNear, cameraFar);')
const end=old.indexOf('  vec3 worldPosition',start)
assert(start>=0&&end>start)
assert(changed.startsWith(old.slice(0,start)))
assert(changed.endsWith(old.slice(end)))
assert.equal(changed,solarDepthReconstruction(old))
assert.throws(()=>solarDepthReconstruction('missing upstream block'),/Unsupported Takram/)
assert.throws(()=>solarDepthReconstruction(old+old),/Unsupported Takram/)
assert.throws(()=>solarDepthReconstruction(changed),/Unsupported Takram/)
assert(changed.includes('#if defined(PERSPECTIVE_CAMERA) && (defined(USE_LOGDEPTHBUF) || defined(USE_LOGARITHMIC_DEPTH_BUFFER))'))
assert(changed.includes('viewPosition = screenToView(uv, depth, getViewZ(depth), projectionMatrix, inverseProjectionMatrix);'))
original.dispose();candidate.dispose()
const f=Math.fround,near=f(camera.near),far=f(camera.far)
const numeric=[100,1000,1e5,1e6,1e7,2e7,2.6e7,3.2e7,1e8,1e9,1e11].map(distance=>{
 const depth=f(Math.log2(distance+1)/Math.log2(far+1))
 const direct=f(f(2**f(depth*f(Math.log2(f(far+1)))))-1)
 const perspective=f(f(far/f(far-near))+f(f(f(far*near)/f(near-far))/direct))
 const denominator=f(f(f(far-near)*perspective)-far)
 const oldDistance=denominator?-f(f(near*far)/denominator):Infinity
 return{distance,oldDistance:Number.isFinite(oldDistance)?oldDistance:null,oldNonFinite:!Number.isFinite(oldDistance),oldErrorM:Number.isFinite(oldDistance)?oldDistance-distance:null,directDistance:direct,directErrorM:direct-distance}
})
assert(Math.abs(numeric.find(x=>x.distance===2.6e7).oldErrorM)>1e5)
assert(Math.abs(numeric.find(x=>x.distance===2.6e7).directErrorM)<100)
camera.setViewOffset(1920,1080,120,65,1440,900)
let maximumUvError=0,cases=0
for(const distance of [100,1e3,1e6,2.6e7,1e9])for(const uv of [[.1,.1],[.5,.5],[.9,.9]]){
 const h=new T.Vector4(uv[0]*2-1,uv[1]*2-1,1,1).applyMatrix4(camera.projectionMatrixInverse)
 const position=new T.Vector3(h.x,h.y,h.z).multiplyScalar(-distance/h.z)
 const projected=position.clone().applyMatrix4(camera.projectionMatrix)
 maximumUvError=Math.max(maximumUvError,Math.abs((projected.x+1)/2-uv[0]),Math.abs((projected.y+1)/2-uv[1]));cases++
}
assert(maximumUvError<1e-12)
const result={scope:'Independent installed-source and arithmetic review; no GPU, application or physical-device qualification',pass:true,adapterPath,adapterSha256:createHash('sha256').update(source).digest('hex'),guard:{upstreamPrefixSuffixPreserved:true,missingDuplicateAndAlreadyPatchedRejected:true,ordinaryBranchPreserved:true},nearM:near,farM:camera.far,numeric,offAxisProjection:{cases,maximumUvError}}
await writeFile(new URL('review-atmosphere.json',import.meta.url),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({pass:true,guard:result.guard,offAxisProjection:result.offAxisProjection,adapterSha256:result.adapterSha256}))
