import {radii} from './fixtures/solarRadii'
import {describe,it,expect} from 'vitest'
import * as presentation from '../src/features/solar/solarPresentation'
import * as T from 'three'
describe('Cinematic presentation stays separate from source geometry',()=>{
 it('fits all source body spheres into portrait and landscape overview without moving their anchors',()=>{
  const bodies=[{source_id:'sun',position_au:[0,0,0]},{source_id:'earth',position_au:[-.925,.325,.141]},{source_id:'mars',position_au:[1.053,-.809,-.399]}] as any
  const before=JSON.stringify(bodies)
  expect(typeof presentation.overviewPose).toBe('function')
  for(const aspect of[1.6,.433,2.3]){
   const pose=presentation.overviewPose(radii,bodies,aspect)
   const camera=new T.PerspectiveCamera(42,aspect,.001,200);camera.up.fromArray(presentation.overviewUp?.(aspect)||[0,0,1]);camera.position.fromArray(pose.position);camera.lookAt(new T.Vector3(...pose.target));camera.updateMatrixWorld()
   for(const b of bodies){const v=new T.Vector3(...b.position_au).project(camera);expect(Math.abs(v.x)).toBeLessThan(.88);expect(Math.abs(v.y)).toBeLessThan(.78)}
   if(aspect<.75){const earth=new T.Vector3(...bodies[1].position_au).project(camera),mars=new T.Vector3(...bodies[2].position_au).project(camera);expect(Math.abs(earth.y-mars.y)).toBeGreaterThan(Math.abs(earth.x-mars.x)*aspect)}
  }
  expect(JSON.stringify(bodies)).toBe(before)
 })
 it('keeps a focused camera outside each physical globe and uses illumination direction from its real Sun vector',()=>{
  expect(typeof presentation.focusPose).toBe('function')
  for(const id of['sun','earth','mars']as const){const p:[number,number,number]=id==='sun'?[0,0,0]:[1,.2,.1];const pose=presentation.focusPose(radii,id,p,1.6,true);expect(pose.target).toEqual(p);expect(Math.hypot(...pose.position.map((v:number,i:number)=>v-p[i]))).toBeGreaterThan(radii[id]*2)}
 })
 it('creates bounded repeatable illustrative spatial points, never source-backed identities',()=>{
  expect(typeof presentation.decorativeStars).toBe('function')
  const stars=presentation.decorativeStars(2400);expect(stars).toEqual(presentation.decorativeStars(2400));expect(stars.positions.length).toBe(7200)
  expect(stars.positions.every(Number.isFinite)).toBe(true)
  for(let i=0;i<stars.positions.length;i+=3)expect(Math.hypot(...stars.positions.slice(i,i+3))).toBeGreaterThan(40)
 })
})
