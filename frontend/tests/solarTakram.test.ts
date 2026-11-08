import {describe,expect,it,vi} from 'vitest'
import {createSolarTakram,solarTakramFrame,loadSolarTakramTextures,TAKRAM_LUTS} from '../src/features/solar/solarTakram'

const rotation=[0,-1,0,1,0,0,0,0,1]
const earth=[1,2,3] as const
const frame={earthPositionAU:earth,cameraPositionAU:[1.001,2,3] as const,sunPositionAU:[0,2,3] as const,icrfToItrs:rotation,kmPerAu:149597870.7,earthRadiusM:6371000,physicalScale:1,frameAvailable:true}

describe('Takram Earth-local contract',()=>{
 it('subtracts authoritative AU positions in doubles before rotating to ECEF metres',()=>{
  const f=solarTakramFrame(frame)
  expect(f.reason).toBeNull()
  expect(f.cameraECEFM[0]).toBe(0)
  expect(f.cameraECEFM[1]).toBeCloseTo(149597870.7,3)
  expect(f.sunDirectionECEF).toEqual([0,-1,0])
 })
 it('preserves a 10 metre local displacement at Neptune-sized global coordinates',()=>{
  const au=frame.kmPerAu*1000,radius=frame.earthRadiusM
  const f=solarTakramFrame({...frame,earthPositionAU:[30,0,0],cameraPositionAU:[30+(radius+10)/au,0,0],sunPositionAU:[0,0,0]})
  expect(f.altitudeM).toBeCloseTo(10,2)
 })
 it('refuses unknown orientation, cinematic scale, underground and unbounded distance',()=>{
  expect(solarTakramFrame({...frame,frameAvailable:false}).reason).toBe('earth-frame-unavailable')
  expect(solarTakramFrame({...frame,physicalScale:2}).reason).toBe('cinematic-scale')
  expect(solarTakramFrame({...frame,cameraPositionAU:earth}).reason).toBe('outside-qualified-altitude')
  expect(solarTakramFrame({...frame,cameraPositionAU:[10,2,3]}).reason).toBe('outside-qualified-altitude')
  expect(solarTakramFrame({...frame,icrfToItrs:[1,0,0,0,2,0,0,0,1]}).reason).toBe('invalid-earth-frame')
  expect(solarTakramFrame({...frame,icrfToItrs:[1,0,0,0,1,0,0,0,-1]}).reason).toBe('invalid-earth-frame')
 })
})

describe('bounded LUT acquisition',()=>{
 it('aborts an outstanding acquisition with its owner',async()=>{
  const controller=new AbortController()
  const fetcher=vi.fn((_url:string,{signal}:any)=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))))
  const pending=loadSolarTakramTextures(controller.signal,fetcher as typeof fetch)
  controller.abort()
  await expect(pending).rejects.toThrow('Aborted')
  expect(fetcher).toHaveBeenCalledTimes(3)
 })
 it('rejects truncated bytes before GPU allocation',async()=>{
  const fetcher=vi.fn(async()=>new Response(new Uint8Array(2)))
  await expect(loadSolarTakramTextures(new AbortController().signal,fetcher as typeof fetch)).rejects.toThrow('LUT length')
 })
 it('keeps the combined half-float LUT allocation below nine MiB',()=>{
  expect(TAKRAM_LUTS.reduce((sum,entry)=>sum+entry.bytes,0)).toBe(8527872)
 })
 it('reports an unsupported GPU and disposes without starting a renderer or loop',async()=>{
  const onStatus=vi.fn(),domElement=new EventTarget()
  const adapter=createSolarTakram({domElement,capabilities:{isWebGL2:false},extensions:{has:()=>false}}, {},{onStatus})
  await adapter.ready
  expect(adapter.diagnostics()).toMatchObject({state:'fallback',reason:'unsupported-gpu',active:false,lookupBytes:0,independentAnimationLoops:0})
  adapter.dispose();adapter.dispose()
  expect(adapter.diagnostics()).toMatchObject({state:'disposed',disposed:true,lookupBytes:0})
  domElement.dispatchEvent(new Event('webglcontextlost'))
  expect(adapter.diagnostics().state).toBe('disposed')
 })
})
