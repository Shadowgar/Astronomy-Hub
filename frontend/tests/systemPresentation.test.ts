import {describe,it,expect} from 'vitest'
import {systemOverviewPose,systemSurfaceFrame,systemToAU,systemToKm} from '../src/features/systems/systemPresentation'
import {celestialAppearance} from '../src/features/celestial/celestialAssets'

describe('source-preserving system presentation',()=>{
 it('uses nominal PCK spin for a cartographic XYZ grid without claiming exact map meridian registration',()=>{
  const q:[number,number,number,number]=[0,0,Math.SQRT1_2,Math.SQRT1_2]
  const frame=systemSurfaceFrame('pluto',q,{body_fixed_frame:'IAU_PLUTO'},celestialAppearance('pluto'))
  expect(frame.quaternion).toEqual(q);expect(frame.qualified).toBe(false);expect(frame.classification).toMatch(/longitude offset unqualified/)
  expect(systemSurfaceFrame('pluto',q,{body_fixed_frame:'IAU_CHARON'},celestialAppearance('pluto')).quaternion).toBeNull()
 })
 it('converts only units and fits the current distribution without moving centers',()=>{
  const points=[[0,0,0],[1e6,0,0],[-2e6,3e5,1e5]] as [number,number,number][]
  const original=JSON.stringify(points),pose=systemOverviewPose(points.map(systemToAU),[0,0,1],[1,0,0],390,500,40)
  expect(JSON.stringify(points)).toBe(original);expect([...pose.position,...pose.target,...pose.up].every(Number.isFinite)).toBe(true)
  expect(systemToKm(systemToAU(points[1]))).toEqual(points[1])
 })
 it('never claims a NASA source UV map is registered to an IAU meridian',()=>{
  expect(systemSurfaceFrame('io',[0,0,0,1],{body_fixed_frame:'IAU_IO'},celestialAppearance('io')).qualified).toBe(false)
 })
 it('requires the exact PDS shape frame and model before rotating measured vertices',()=>{
  const asset=celestialAppearance('phobos')!
  expect(systemSurfaceFrame('phobos',[0,0,0,1],{body_fixed_frame:'IAU_PHOBOS',model_id:'pck00011'},asset).qualified).toBe(false)
  const accepted=systemSurfaceFrame('phobos',[0,0,0,1],{body_fixed_frame:'IAU_PHOBOS',model_id:'pds-gaskell-phobos-pck00006'},asset)
  expect(accepted.qualified).toBe(true);expect(accepted.quaternion).toEqual([0,0,0,1])
 })
 it('maps a qualified Earth/Moon sphere north axis to the native body pole',()=>{
  const frame=systemSurfaceFrame('moon',[0,0,0,1],{body_fixed_frame:'MOON_ME_DE440_ME421'},celestialAppearance('moon'))
  expect(frame.qualified).toBe(true);expect(frame.quaternion[0]).toBeCloseTo(Math.SQRT1_2)
 })
})

import {advanceSystemTime} from '../src/features/systems/systemPlayback'
it('bounds forward and reverse motion without extrapolation',()=>{
 expect(advanceSystemTime(100,10,-20,200,0)).toBe(0)
 expect(advanceSystemTime(100,10,20,200,0)).toBe(200)
 expect(advanceSystemTime(100,1,-20,200,0)).toBe(80)
})

import * as T from 'three'
it('aligns the visual Saturn north with the scientific ring pole without claiming a registered meridian',()=>{
 const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.4)
 const surface=systemSurfaceFrame('saturn',q.toArray() as any,{body_fixed_frame:'IAU_SATURN'},celestialAppearance('saturn'))
 expect(surface.qualified).toBe(false);expect(surface.classification).toMatch(/longitude illustrative/)
 expect(new T.Vector3(0,1,0).applyQuaternion(new T.Quaternion(...surface.quaternion!)).distanceTo(new T.Vector3(0,0,1).applyQuaternion(q))).toBeLessThan(1e-12)
})

import {systemWindowRefreshEpoch} from '../src/features/systems/systemPlayback'
it('requests an overlapping source window before either playback boundary and stops at global coverage',()=>{
 expect(systemWindowRefreshEpoch(80,1,0,100,-1000,1000)).toBe(80)
 expect(systemWindowRefreshEpoch(20,-1,0,100,-1000,1000)).toBe(20)
 expect(systemWindowRefreshEpoch(50,1,0,100,-1000,1000)).toBeNull()
 expect(systemWindowRefreshEpoch(80,1,0,100,-1000,100)).toBeNull()
 expect(systemWindowRefreshEpoch(20,-1,0,100,0,1000)).toBeNull()
})

it('fits physical ring envelopes as well as centers in a shallow landscape overview',()=>{
 const points:[[number,number,number],[number,number,number],[number,number,number]]=[[0,0,0],[.008,0,0],[.001,0,.0005]],radii=[.001,.00002,.000002]
 const pose=systemOverviewPose(points,[0,0,1],[1,0,0],800,170,40,radii),camera=new T.PerspectiveCamera(40,800/170,1e-10,10)
 camera.position.fromArray(pose.position);camera.up.fromArray(pose.up);camera.lookAt(new T.Vector3(...pose.target));camera.updateMatrixWorld()
 for(let i=0;i<points.length;i++)for(const axis of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
  const p=new T.Vector3(...points[i]).addScaledVector(new T.Vector3(...axis),radii[i]).project(camera)
  expect(Math.abs(p.x)).toBeLessThan(1);expect(Math.abs(p.y)).toBeLessThan(1)
 }
})
