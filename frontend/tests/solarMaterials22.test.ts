import {describe,expect,it} from 'vitest'
import * as T from 'three'
import {planetMaterial,sunMaterial,coronaMaterial,setSolarMaterialLight} from '../src/features/solar/solarMaterials'
import {ringMaterial} from '../src/features/solar/solarRings'
import {createSolarRenderPipeline,solarPipelinePolicy} from '../src/features/solar/solarRenderPipeline'

// Execute the scalar arithmetic from the actual GLSL function, not a duplicated
// CPU model. This verifies numeric boundaries only; GPU compilation/pixels still
// require the separately coordinated real-browser campaign.
function scalarShaderFunction(shader:string,name:string){
 const match=shader.match(new RegExp(`float ${name}\\(([^)]*)\\)\\s*\\{([^{}]*)\\}`))
 expect(match,`GLSL scalar function ${name}`).not.toBeNull()
 const args=match![1].split(',').map(argument=>argument.trim().split(/\s+/).at(-1)!)
 return new Function(...args,`const {max,min,abs,exp,pow}=Math;const mix=(a,b,t)=>a+(b-a)*t;const clamp=(x,a,b)=>max(a,min(b,x));${match![2].replace(/\bfloat\b/g,'let')}`) as (...values:number[])=>number
}

describe('Solar 2.2 material boundaries',()=>{
 it('gives Mars a rocky response and Jupiter a distinct cloud-disk response with source-map support',()=>{
  const mars=planetMaterial('mars'),jupiter=planetMaterial('jupiter')
  expect(mars.uniforms.particulate?.value).toBeGreaterThan(.2)
  expect(jupiter.uniforms.limbExponent?.value).toBeGreaterThan(.1)
  expect(mars.uniforms.particulate.value).toBeGreaterThan(jupiter.uniforms.particulate.value)
  for(const material of [mars,jupiter]){
   expect(material.uniforms.hasMap.value).toBe(false)
   expect(material.uniforms.map.value).toBe(null)
   expect(material.uniforms.sourceContrast.value).toBeGreaterThanOrEqual(1)
   expect(material.uniforms.sourceContrast.value).toBeLessThan(1.12)
   setSolarMaterialLight(material,[2,3,4],[0,0,0])
   expect(material.uniforms.sunDirection.value.length()).toBeCloseTo(1,12)
   expect(material.fragmentShader).toContain('texture2D(map,vUv)')
   material.dispose()
  }
 })
 it('uses warm-white linear HDR photosphere energy with explicitly illustrative morphology',()=>{
  const material=sunMaterial(),color=material.uniforms.photosphereColor?.value
  expect(color).toBeDefined()
  expect(color.x/color.z).toBeLessThan(1.4)
  expect(color.y/color.x).toBeGreaterThan(.85)
  expect(material.uniforms.photosphereLuminance.value).toBeGreaterThan(2)
  expect(material.uniforms.photosphereLuminance.value).toBeLessThan(5)
  expect(material.userData.calibration).toContain('illustrative')
  expect(material.fragmentShader).toContain('dFdx')
  material.dispose()
 })
 it('bounds the corona around the existing seven-radius billboard and filters it by footprint',()=>{
  const material=coronaMaterial()
  expect(material.uniforms.diskRadius?.value).toBeCloseTo(2/7,12)
  expect(material.uniforms.outerRadius.value).toBeGreaterThan(1)
  expect(material.uniforms.outerRadius.value).toBeLessThan(2.5)
  expect(material.depthWrite).toBe(false)
  expect(material.fragmentShader).toContain('dFdx')
  material.dispose()
 })
 it('retains a luminous center while giving the photosphere visible limb shading',()=>{
  const material=sunMaterial(),limb=scalarShaderFunction(material.fragmentShader,'photosphereLimb')
  expect(limb(1)).toBe(1)
  expect(limb(0)).toBeGreaterThan(.2)
  expect(limb(0)).toBeLessThan(.35)
  expect(limb(.2)).toBeLessThan(.55)
  expect(limb(.8)).toBeGreaterThan(limb(.2))
  expect(limb(-1)).toBe(limb(0))
  material.dispose()
 })
 it('applies optical coverage once when blending ring radiance over the background',()=>{
  const material=ringMaterial()
  const radiance=scalarShaderFunction(material.fragmentShader,'ringStraightAlpha')
  // Fixed integrated scattering .1, half shadow, gain2.8 => radiance .14
  // regardless of the view coverage. Straight-alpha blending must recover it.
  for(const coverage of [.001,.01,.1,.2,1])expect(radiance(.1,.5,coverage)*coverage).toBeCloseTo(.14,12)
  expect(radiance(.1,0,.2)).toBe(0)
  expect(radiance(0,1,0)).toBe(0)
  material.dispose()
 })
 it('keeps backlit ring transmission finite and continuous at equal optical paths',()=>{
  const material=ringMaterial(),transmission=scalarShaderFunction(material.fragmentShader,'ringLayerTransmission')
  expect(transmission(.1,.5,.5)).toBeCloseTo(.1637461506155964,12)
  for(const offset of [-1e-6,-1e-9,0,1e-9,1e-6])expect(transmission(.1,.5+offset,.5)).toBeCloseTo(.1637461506155964,6)
  for(const tau of [0,1e-8,.01,.1,1,3])for(const mu of [.025,.1,.5,1])for(const mu0 of [.025,.1,.5,1]){
   const value=transmission(tau,mu,mu0)
   expect(Number.isFinite(value)).toBe(true)
   expect(value).toBeGreaterThanOrEqual(0)
   expect(value).toBeLessThanOrEqual(1)
  }
  material.dispose()
 })
 it('keeps every source-lit terminator dark and the limb response finite',()=>{
  const material=planetMaterial('jupiter'),response=scalarShaderFunction(material.fragmentShader,'planetDiskResponse')
  for(const particulate of [0,.08,.35])for(const limb of [0,.1,.16]){
   expect(response(-1,.5,particulate,limb)).toBe(0)
   expect(response(0,.5,particulate,limb)).toBe(0)
   expect(response(.5,0,particulate,limb)).toBeGreaterThan(0)
   expect(response(.5,0,particulate,limb)).toBeLessThanOrEqual(1)
   expect(response(.8,.5,particulate,limb)).toBeGreaterThan(response(.2,.5,particulate,limb))
  }
  expect(response(.5,.01,.08,.16)).toBeLessThan(response(.5,.8,.08,.16))
  material.dispose()
 })
 it('uses a high bloom threshold with restrained strength and radius',()=>{
  for(const quality of ['balanced','detailed'] as const){
   const policy=solarPipelinePolicy(quality,true,true)
   expect(policy.threshold).toBeGreaterThanOrEqual(1.75)
   expect(policy.strength).toBeLessThanOrEqual(.2)
   expect(policy.radius).toBeLessThanOrEqual(.3)
  }
 })
 it('composites scene alpha into a linear target before the single output pass in every quality',()=>{
  for(const hdrSupported of [true,false])for(const quality of ['efficient','balanced','detailed'] as const){
   // Keep the real composer/passes and record this pipeline's renderer boundary.
   // No GPU or pixel claims: WebGL blending is qualified in the browser run.
   const draws:{object:any;target:any}[]=[]
   let target:any=null
   const renderer={extensions:{has:()=>hdrSupported},info:{autoReset:true,reset:()=>{}},toneMapping:T.NoToneMapping,toneMappingExposure:1,outputColorSpace:T.SRGBColorSpace,
    getPixelRatio:()=>1,getRenderTarget:()=>target,setRenderTarget:(value:any)=>{target=value},clear:()=>{},render:(object:any)=>{draws.push({object,target})}}
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(),pipeline=createSolarRenderPipeline(renderer,scene,camera)
   pipeline.setEffects(false);pipeline.setQuality(quality);pipeline.render()
   expect(draws[0].object).toBe(scene)
   expect(draws[0].target).not.toBeNull()
   expect(draws[0].target.texture.type).toBe(hdrSupported?T.HalfFloatType:T.UnsignedByteType)
   expect(draws[0].target.texture.colorSpace).toBe(T.LinearSRGBColorSpace)
   const outputs=draws.filter(draw=>draw.object.material?.name==='OutputShader')
   expect(outputs).toHaveLength(1)
   expect(outputs[0].object.material.uniforms.tDiffuse.value).toBe(draws[0].target.texture)
   expect(outputs[0].object.material.defines).toHaveProperty('ACES_FILMIC_TONE_MAPPING')
   expect(outputs[0].object.material.defines).toHaveProperty('SRGB_TRANSFER')
   expect(draws.at(-1)!.target).toBeNull()
   expect(pipeline.diagnostics().hdrClipping).toBe(!hdrSupported)
   expect(pipeline.diagnostics().bloom).toBe(false)
   pipeline.dispose()
   expect(renderer.toneMapping).toBe(T.NoToneMapping)
  }
 })
 it('retains one output transform in each material and no material clock',()=>{
  for(const material of [planetMaterial('mars'),planetMaterial('jupiter'),planetMaterial('saturn'),sunMaterial(),coronaMaterial(),ringMaterial()]){
   expect(material.fragmentShader.match(/#include <tonemapping_fragment>/g)).toHaveLength(1)
   expect(material.fragmentShader.match(/#include <colorspace_fragment>/g)).toHaveLength(1)
   expect(material.uniforms.time).toBeUndefined()
   material.dispose()
  }
 })
})
