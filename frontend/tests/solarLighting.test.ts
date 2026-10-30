import {describe,it,expect,vi} from 'vitest'
import * as T from 'three'
import {planetMaterial,earthMaterial,atmosphereMaterial,setSolarMaterialLight} from '../src/features/solar/solarMaterials'
import {saturnRingProfile,ringTransmission,ringMaterial,SATURN_RING_OUTER_RATIO} from '../src/features/solar/solarRings'
import {solarPipelinePolicy} from '../src/features/solar/solarRenderPipeline'
import {atmosphereForBody,atmosphereShellRatio,setAtmosphereQuality} from '../src/features/solar/solarAtmosphere'

describe('Solar material source/presentation boundary',()=>{
 it('keeps the exact source Sun direction when both render coordinates are rebased',()=>{
  const material=planetMaterial('saturn')
  setSolarMaterialLight(material,[10,4,-2],[0,0,0])
  const first=material.uniforms.sunDirection.value.clone()
  setSolarMaterialLight(material,[1010,204,-302],[1000,200,-300])
  expect(material.uniforms.sunDirection.value.distanceTo(first)).toBeLessThan(1e-12)
  expect(first.distanceTo(new T.Vector3(-10,-4,2).normalize())).toBeLessThan(1e-12)
  material.dispose()
 })
 it('allows source textures on gas giants and does not fabricate unavailable lighting',()=>{
  for(const material of [earthMaterial(),planetMaterial('jupiter'),atmosphereMaterial('#5cafff')]){
   expect(material.uniforms.sunDirection).toBeDefined()
   expect(()=>setSolarMaterialLight(material,[NaN,0,0],[0,0,0])).toThrow()
   material.dispose()
  }
  const gas=planetMaterial('jupiter')
  expect(gas.uniforms.hasMap.value).toBe(false)
  expect(gas.uniforms.map.value).toBe(null)
  gas.dispose()
 })
})
describe('Per-body illustrative atmospheres',()=>{
 it('omits airless bodies and distinguishes giant/venus profiles from Mars dust',()=>{
  expect(atmosphereForBody('mercury')).toBe(null)
  expect(atmosphereShellRatio('sun')).toBe(null)
  const mars=atmosphereForBody('mars')
  for(const id of ['earth','venus','jupiter','saturn','uranus','neptune']){
   const material=atmosphereForBody(id),ratio=atmosphereShellRatio(id)!
   expect(ratio).toBeGreaterThan(1)
   expect(ratio).toBeLessThanOrEqual(1.05)
   expect(material.uniforms.outerRadius.value).toBe(ratio)
   expect(material.uniforms.betaM.value.toArray()).not.toEqual(mars.uniforms.betaM.value.toArray())
   expect(material.userData.calibration).toBe('illustrative; not measured atmospheric conditions')
   material.dispose()
  }
  mars.dispose()
 })
 it('reduces integration work without replacing the material or its body profile',()=>{
  const material=atmosphereForBody('saturn'),version=material.version,coefficients=material.uniforms.betaR.value.clone()
  setAtmosphereQuality(material,'detailed');const high=material.uniforms.viewSamples.value*material.uniforms.lightSamples.value
  setAtmosphereQuality(material,'efficient');const low=material.uniforms.viewSamples.value*material.uniforms.lightSamples.value
  expect(low).toBeLessThan(high)
  expect(material.version).toBe(version)
  expect(material.uniforms.betaR.value.equals(coefficients)).toBe(true)
  material.dispose()
 })
})
describe('Saturn radial optical profile',()=>{
 it('places named structures using kilometres and the actual mean-radius contract',()=>{
  expect(saturnRingProfile(70000).opticalDepth).toBe(0)
  expect(saturnRingProfile(82000).opticalDepth).toBeGreaterThan(.05)
  expect(saturnRingProfile(105000).opticalDepth).toBeGreaterThan(.4)
  expect(saturnRingProfile(119500).opticalDepth).toBeLessThan(.1)
  expect(saturnRingProfile(126000).opticalDepth).toBeGreaterThan(.4)
  expect(saturnRingProfile(137900).opticalDepth).toBe(0)
  expect(saturnRingProfile(139850).opticalDepth).toBeGreaterThan(0)
  expect(SATURN_RING_OUTER_RATIO*58232).toBeCloseTo(140180,8)
 })
 it('increases optical path at oblique incidence while keeping edge-on/gap results finite',()=>{
  expect(ringTransmission(1,.2)).toBeLessThan(ringTransmission(1,1))
  expect(ringTransmission(0,0)).toBe(1)
  expect(ringTransmission(2.5,0)).toBeGreaterThanOrEqual(0)
  expect(ringTransmission(2.5,0)).toBeLessThan(1e-10)
 })
 it('uses a single transparent ring pass and releases its owned radial profile',()=>{
  const material=ringMaterial(),texture=material.uniforms.ringProfile.value,dispose=vi.fn()
  texture.addEventListener('dispose',dispose)
  expect(material.forceSinglePass).toBe(true)
  expect(material.depthWrite).toBe(false)
  material.dispose()
  expect(dispose).toHaveBeenCalledOnce()
 })
})
describe('HDR policy',()=>{
 it('retains linear LDR composition without float support and never blooms the efficient tier',()=>{
  expect(solarPipelinePolicy('detailed',false,true).mode).toBe('linear-ldr')
  expect(solarPipelinePolicy('efficient',true,true).mode).toBe('linear-hdr')
  expect(solarPipelinePolicy('efficient',true,true).bloom).toBe(false)
  const rich=solarPipelinePolicy('detailed',true,true)
  expect(rich.mode).toBe('linear-hdr')
  expect(rich.bloom).toBe(true)
  expect(rich.threshold).toBeGreaterThan(1)
  expect(rich.strength).toBeLessThan(.5)
  expect(solarPipelinePolicy('balanced',true,false).bloom).toBe(false)
 })
})
