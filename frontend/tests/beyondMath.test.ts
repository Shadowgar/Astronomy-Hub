import {describe,it,expect} from 'vitest'
import {relativeVector} from '../src/features/solar/solarPrecision'
import {AU_KM,LIGHT_YEAR_AU,distanceFacts,eclipticDirection,icrfToEcliptic,mollweide,scalePose,validBeyondCamera,illustrativeCloud} from '../src/features/beyond/beyondMath'

describe('Beyond source units and directional coordinates',()=>{
 it('uses the defined AU and light speed independently of display scale',()=>{
  expect(AU_KM).toBe(149597870.7)
  expect(distanceFacts(1).lightSeconds).toBeCloseTo(499.004783836,8)
  expect(LIGHT_YEAR_AU).toBeCloseTo(63241.077084,5)
  expect(distanceFacts(100000).lightYears).toBeCloseTo(1.58125074,7)
 })
 it('maps ECLIPJ2000 basis directions to the equatorial J2000 basis',()=>{
  expect(eclipticDirection(0,0)).toEqual([1,0,0])
  const y=eclipticDirection(90,0)
  expect(y[0]).toBeCloseTo(0,14);expect(y[1]).toBeCloseTo(.9174820620691818,13);expect(y[2]).toBeCloseTo(.3977771559319137,13)
  for(const [lon,lat] of [[3,-87],[177,3],[357,87],[90,0]]){
   const back=icrfToEcliptic(eclipticDirection(lon,lat));expect(back[0]).toBeCloseTo(lon,10);expect(back[1]).toBeCloseTo(lat,10)
  }
 })
 it('projects the longitude wrap, equator and poles without a false 3D radius',()=>{
  expect(mollweide(0,0)).toEqual([0,0]);expect(mollweide(360,0)).toEqual([0,0])
  expect(Math.abs(mollweide(180,0)[0])).toBeCloseTo(1,14)
  expect(mollweide(20,90)[0]).toBeCloseTo(0,14);expect(mollweide(20,90)[1]).toBe(1)
  expect(mollweide(20,-90)[1]).toBe(-1)
  expect(mollweide(90,0)[0]).toBeLessThan(0) // sky longitude increases left
  expect(()=>mollweide(0,91)).toThrow()
 })
 it('preserves solid-angle area in its Mollweide projection',()=>{
  const h=1e-4,deg=180/Math.PI
  for(const lat of [-70,-30,0,35,70]){
   const left=mollweide(60-h*deg,lat),right=mollweide(60+h*deg,lat),down=mollweide(60,lat-h*deg),up=mollweide(60,lat+h*deg)
   const jac=Math.abs(((right[0]-left[0])*(up[1]-down[1])-(right[1]-left[1])*(up[0]-down[0]))/(4*h*h))
   expect(jac/Math.cos(lat/deg)).toBeCloseTo(.25,6)
  }
 })
})
describe('extreme-scale visualization precision and persistence',()=>{
 it('subtracts doubles before float32 at 100000AU, with an explicit metre-level CPU limit',()=>{
  const origin:[number,number,number]=[100000,-34000,12345],point:[number,number,number]=[100000+10/AU_KM,-34000,12345]
  const local=relativeVector(point,origin)
  expect(Math.abs(Math.fround(local[0])*AU_KM-10)).toBeLessThan(.003)
  expect(Math.fround(point[0])-Math.fround(origin[0])).toBe(0)
 })
 it('frames Oort scale and restores exact camera values without moving scientific centers',()=>{
  const pose=scalePose(100000)
  expect(Math.hypot(...pose.position)).toBeGreaterThan(250000)
  expect(pose.target).toEqual([0,0,0])
  expect(validBeyondCamera({...pose,up:[0,0,1],radius:100000})).toBe(true)
  expect(validBeyondCamera({...pose,position:[Infinity,0,0],up:[0,0,1],radius:100000})).toBe(false)
  expect(validBeyondCamera({...pose,position:[2e6,0,0],up:[0,0,1],radius:100000})).toBe(false)
  expect(validBeyondCamera({...pose,position:[1e6,0,0],target:[-1e6,0,0],up:[0,0,1],radius:100000})).toBe(false)
  expect(JSON.parse(JSON.stringify(pose))).toEqual(pose)
 })
 it('bounds an unnamed illustrative population without creating catalog identities',()=>{
  const points=illustrativeCloud(400)
  expect(points).toHaveLength(400);expect(points).toEqual(illustrativeCloud(400))
  for(const point of points){expect(point).toHaveLength(3);const r=Math.hypot(...point);expect(r).toBeGreaterThanOrEqual(2000);expect(r).toBeLessThanOrEqual(100000)}
  expect(()=>illustrativeCloud(100001)).toThrow()
 })
})
