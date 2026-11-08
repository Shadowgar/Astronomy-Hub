import {describe,it,expect} from 'vitest'
import {PerspectiveCamera} from 'three'
import {AerialPerspectiveEffect} from '@takram/three-atmosphere'
import {SolarAerialPerspectiveEffect,solarDepthReconstruction} from '../src/features/solar/solarTakramDepth'

describe('pinned atmospheric depth integration',()=>{
 it('retains the actual upstream effect and all scattering outside reconstruction',()=>{
  const camera=new PerspectiveCamera(45,1,100,299195741400000)
  const upstream=new AerialPerspectiveEffect(camera),adapted=new SolarAerialPerspectiveEffect(camera,{})
  const before=upstream.getFragmentShader(),after=adapted.getFragmentShader()
  expect(adapted).toBeInstanceOf(AerialPerspectiveEffect)
  expect(after.slice(after.indexOf('  vec3 worldPosition ='))).toEqual(before.slice(before.indexOf('  vec3 worldPosition =')))
  expect(after.slice(0,after.indexOf('  vec3 viewPosition;'))).toEqual(before.slice(0,before.indexOf('  depth = reverseLogDepth(depth, cameraNear, cameraFar);')))
  expect(after).toContain('defined(PERSPECTIVE_CAMERA)')
  expect(after).toContain('viewPosition = screenToView(uv, depth, getViewZ(depth), projectionMatrix, inverseProjectionMatrix);')
  upstream.dispose();adapted.dispose()
 })
 it('refuses upstream drift or duplicate reconstruction rather than silently losing the correction',()=>{
  const original=new AerialPerspectiveEffect(new PerspectiveCamera())
  const shader=original.getFragmentShader()
  expect(()=>solarDepthReconstruction('changed source')).toThrow('Unsupported Takram')
  expect(()=>solarDepthReconstruction(shader+shader)).toThrow('Unsupported Takram')
  expect(()=>solarDepthReconstruction(solarDepthReconstruction(shader))).toThrow('Unsupported Takram')
  original.dispose()
 })
})
