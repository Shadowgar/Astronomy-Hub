import {expect,it} from 'vitest'
import PerspectiveFrustum from '@cesium/engine/Source/Core/PerspectiveFrustum.js'
import * as presentation from '../src/features/planet/planetPresentation'
import {validPlanetCamera,type PlanetContract} from '../src/features/planet/planetContracts'

// Only the validated shape/illumination contract is consumed by camera framing.
const contract={shape:{radii_m:[1737400,1737400,1737400]},illumination:{direction_body_fixed:[.8,0,.6]}} as PlanetContract
it('fits the reference sphere within both native frustum axes at actual desktop, portrait and short-landscape frame sizes',()=>{
 expect(typeof presentation.initialPlanetCamera).toBe('function')
 for(const [width,height] of [[1324,688],[300,570],[748,224]]){
  const camera=presentation.initialPlanetCamera(contract,undefined,width,height)
  expect(validPlanetCamera(camera)).toBe(true)
  const frustum=new PerspectiveFrustum({fov:Math.PI/3,aspectRatio:width/height,near:1,far:1e9})
  const angularRadius=Math.asin(1737400/(1737400+camera.heightM))
  const projectedRadius=Math.tan(angularRadius)
  expect(projectedRadius/Math.tan(frustum.fovy/2)).toBeLessThanOrEqual(.9)
  expect(projectedRadius/(Math.tan(frustum.fovy/2)*width/height)).toBeLessThanOrEqual(.9)
  expect(camera.longitudeDeg).toBe(0)
  expect(camera.latitudeDeg).toBeCloseTo(Math.asin(.6)*180/Math.PI)
 }
})
it('preserves explicit cameras exactly, including close-ups and history orientation',()=>{
 const camera={latitudeDeg:12,longitudeDeg:-45,heightM:30000,headingRad:1,pitchRad:-1.2,rollRad:.2}
 expect(presentation.initialPlanetCamera(contract,camera,748,224)).toBe(camera)
})
it('keeps missing, invalid and extreme viewport sizes finite and within native camera limits',()=>{
 for(const [width,height] of [[0,0],[NaN,224],[Infinity,224],[-1,20],[10000,1],[1,10000]]){
  const camera=presentation.initialPlanetCamera(contract,undefined,width,height)
  expect(validPlanetCamera(camera)).toBe(true)
  expect(camera.heightM).toBeLessThanOrEqual(12000000)
 }
})
