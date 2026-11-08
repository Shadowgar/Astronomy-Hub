import {describe,it,expect} from 'vitest'
import {lunarLocator,regionalCameraEnvelope} from '../src/features/terrain/terrainContext'

describe('bounded lunar context',()=>{
 it('places source longitude east to the right and north up, with a visible hemisphere check',()=>{
  expect(lunarLocator(0,0)).toEqual({x:0,y:0,visible:true})
  const apollo=lunarLocator(20.18,30.71)
  expect(apollo.x).toBeCloseTo(.479,2);expect(apollo.y).toBeCloseTo(-.345,2);expect(apollo.visible).toBe(true)
  expect(lunarLocator(0,180).visible).toBe(false)
  expect(lunarLocator(90,0).y).toBeCloseTo(-1,10)
  expect(()=>lunarLocator(NaN,0)).toThrow();expect(()=>lunarLocator(91,0)).toThrow()
 })
 it('keeps overview within the measured-region viewing envelope across aspect ratios',()=>{
  for(const aspect of [1440/900,390/500,844/240]){
   const e=regionalCameraEnvelope([5120,5120],aspect)
   // A sphere enclosing the full measured rectangle must fit the limiting FOV.
   const halfFov=Math.atan(Math.tan(Math.PI/8)*Math.min(1,aspect))
   expect(e.overviewDistance*Math.sin(halfFov)).toBeGreaterThan(Math.hypot(5120,5120)/2)
   expect(e.maximumDistance).toBeGreaterThanOrEqual(e.overviewDistance)
   expect(e.maximumDistance).toBeLessThan(5120*6)
   expect(e.detailDistance).toBeLessThan(e.overviewDistance)
  }
 })
})
