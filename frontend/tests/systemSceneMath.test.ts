import {describe,it,expect} from 'vitest'
import {sceneVector,displayRadius,fitSystem,validCamera,systemDiskBudgets,systemViewport} from '../src/features/systems/systemSceneMath'
import type {SystemCamera,Vec3} from '../src/features/systems/systemTypes'

describe('parent-centered scene geometry',()=>{
 it('converts km without rotating, enlarging or mutating source positions',()=>{
  const p:Vec3=[384400,-12100,4500];const original=[...p]
  expect(sceneVector(p)).toEqual([384.4,-12.1,4.5]);expect(p).toEqual(original)
 })
 it('keeps physical radius and independently enlarges only unresolved cinematic disks',()=>{
  expect(displayRadius(1737.4,1000000,800,42,'physical',24)).toBe(1737.4)
  expect(displayRadius(1737.4,1000000,800,42,'cinematic',24)).toBeGreaterThan(20000)
  expect(displayRadius(1737.4,4000,800,42,'cinematic',24)).toBe(1737.4)
 })
 it('fits distant trajectory extrema, including thin portrait and coincident points',()=>{
  const pose=fitSystem([[0,0,0],[400000,0,0],[-410000,0,0]],.3,42)
  expect(pose.target).toEqual([-5000,0,0]);expect(Math.hypot(...pose.position)).toBeGreaterThan(2000000)
  expect(fitSystem([[0,0,0]],1,42).position.every(Number.isFinite)).toBe(true)
 })
 it('rejects coincident, nonfinite, huge, parallel-up and unknown-focus camera bookmarks',()=>{
  const c:SystemCamera={position:[0,-500000,500000],target:[0,0,0],up:[0,0,1],focus:'moon'}
  expect(validCamera(c,['earth','moon'])).toBe(true)
  for(const bad of [{...c,position:c.target},{...c,position:[NaN,0,1]},{...c,position:[1e16,0,0]},{...c,up:[0,-1,1]},{...c,focus:'io'}])expect(validCamera(bad,['earth','moon'])).toBe(false)
 })
 it('reserves a gap between enlarged neighboring disks and clears HUD without shrinking physical bodies',()=>{
  const disks=[{x:100,y:100,desired:65,physical:2},{x:155,y:100,desired:24,physical:1}]
  const radii=systemDiskBudgets(disks,300,200,[])
  expect(radii[0]+radii[1]).toBeLessThan(55)
  expect(radii[0]/radii[1]).toBeCloseTo(65/24)
  expect(systemDiskBudgets([disks[0]],300,200,[{left:130,right:180,top:50,bottom:150}])[0]).toBeLessThanOrEqual(24)
  expect(systemDiskBudgets([{x:10,y:10,desired:65,physical:30}],300,200,[])[0]).toBe(30)
  expect(disks[0]).toEqual({x:100,y:100,desired:65,physical:2})
 })
 it('uses the full clear landscape strip between top controls and footer',()=>{
  const view=systemViewport(667,390,[{left:12,right:199,top:10,bottom:126},{left:369,right:655,top:77,bottom:126},{left:12,right:655,top:324,bottom:380}])
  expect(view.clearWidth).toBeGreaterThan(600);expect(view.clearHeight).toBeGreaterThan(150)
  expect(Math.abs(view.rectangleOffsetX)).toBeLessThan(1)
 })
})
