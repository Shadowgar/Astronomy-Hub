import {radii} from './fixtures/solarRadii'
import {describe,it,expect} from 'vitest'
import * as T from 'three'
import * as presentation from '../src/features/solar/solarPresentation'
describe('Selected composition and explicit display budgets',()=>{
 it('frames the unchanged selected anchor above mobile details and clear of desktop cards',()=>{
  expect(typeof presentation.focusViewport).toBe('function')
  for(const [width,height] of [[1440,900],[390,900],[390,667],[320,568],[667,375]]){
   const v=presentation.focusViewport(width,height),camera=new T.PerspectiveCamera(42,width/height,.001,200)
   camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.setViewOffset(width,height,v.offsetX,v.offsetY,width,height);camera.updateMatrixWorld()
   const p=new T.Vector3(0,0,0).project(camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2
   expect(x).toBeGreaterThan(90);expect(x).toBeLessThan(width-70)
   if(width<560){expect(y).toBeLessThan(height*.5);expect(y).toBeGreaterThan(160)}
   else expect(x).toBeLessThan(width*.5)
  }
 })
 it('keeps compact landscape selected globes in the open strip without moving source targets',()=>{
  for(const[width,height]of[[540,390],[480,375],[559,560]]){
   const v=presentation.focusViewport(width,height);expect(height/2-v.offsetY).toBeLessThan(180)
   for(const id of['sun','earth','mars']as const){const source:[number,number,number]=[1,.2,.1],pose=presentation.focusPose(radii,id,source,width/height,true,height),distance=Math.hypot(...pose.position.map((n,i)=>n-source[i])),r=radii[id],pixelRadius=height*r/(2*Math.tan(21*Math.PI/180)*Math.sqrt(distance*distance-r*r));expect(pixelRadius).toBeLessThanOrEqual(v.maxGlobeRadius+.001);expect(pose.target).toEqual(source)}
  }
 })
 it('reduces display cost explicitly with the same scientific glyphs and data',()=>{
  expect(typeof presentation.qualityBudget).toBe('function')
  const high=presentation.qualityBudget('detailed',3),low=presentation.qualityBudget('efficient',3),balanced=presentation.qualityBudget('balanced',3)
  expect(low.pixelRatio).toBeLessThan(balanced.pixelRatio);expect(balanced.pixelRatio).toBeLessThan(high.pixelRatio)
  expect(low.background).toBe(false);expect(high.background).toBe(true);expect(low.starCount).toBeLessThan(high.starCount)
  expect(presentation.qualityBudget('detailed',1).pixelRatio).toBe(1)
 })
})
