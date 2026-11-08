import {expect,it} from 'vitest'
import * as T from 'three'
import * as p from '../src/features/solar/solarPresentation'
import {radii} from './fixtures/solarRadii'

it('settles the destination target before the final physical-scale approach',()=>{
 const from:[number,number,number]=[0,0,10],origin:[number,number,number]=[0,0,0],to={position:[5,0,.002] as [number,number,number],target:[5,0,0] as [number,number,number]}
 expect(p.cameraTransition(from,origin,to,.7).target).toEqual(to.target)
 expect(p.cameraTransition(from,origin,to,0)).toEqual({position:from,target:origin})
 expect(p.cameraTransition(from,origin,to,1)).toEqual(to)
 // No start/end acceleration step in either target translation or radial zoom.
 for(const u of [.001,.999]){const endpoint=u<.5?from:to.position,pose=p.cameraTransition(from,origin,to,u);expect(Math.hypot(...pose.position.map((v,i)=>v-endpoint[i]))).toBeLessThan(.00001)}
})
it('clears the departing body before translating toward a larger destination',()=>{
 const from:[number,number,number]=[1,0,.0002],target:[number,number,number]=[1,0,0],to={position:[0,0,.02] as [number,number,number],target:[0,0,0] as [number,number,number]}
 const first=p.cameraTransition(from,target,to,.1)
 expect(first.target).toEqual(target);expect(first.position[2]).toBeGreaterThan(.0002)
})
it('allows interplanetary travel time while keeping short refits responsive',()=>{
 expect(typeof p.cameraTravelDuration).toBe('function')
 const target:[number,number,number]=[0,0,0],to={position:[0,0,.0002] as [number,number,number],target}
 expect(p.cameraTravelDuration([0,0,30],target,to)).toBeGreaterThan(3500)
 expect(p.cameraTravelDuration([0,0,.0003],target,to)).toBeLessThan(2200)
 expect(p.cameraTravelDuration([0,0,1000],target,to)).toBeLessThanOrEqual(4800)
})
it('frames Saturn rings with a deliberate opening angle at representative source positions',()=>{
 const normal=new T.Vector3(0,-Math.sin(.48),Math.cos(.48))
 for(const source of [[9,0,0],[0,9,0],[-9,0,0],[0,-9,0]] as [number,number,number][]){
  const pose=p.focusPose(radii,'saturn',source,1.6),view=new T.Vector3(...pose.position).sub(new T.Vector3(...source)).normalize()
  expect(Math.abs(view.dot(normal))).toBeGreaterThanOrEqual(.449)
  expect(pose.target).toEqual(source)
 }
})
