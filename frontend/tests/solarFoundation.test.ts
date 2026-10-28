import {describe,it,expect} from 'vitest'
import {relativeVector,absoluteVector,stopAtSurface,flightSpeed} from '../src/features/solar/solarPrecision'
import {SolarClock} from '../src/features/solar/solarClock'

describe('camera-relative scientific coordinates',()=>{
 it('retains meter offsets at Neptune distances before conversion to GPU floats',()=>{
  const origin:[number,number,number]=[30.148528129,12.41,-8.22]
  const position:[number,number,number]=[origin[0]+1/149597870700,origin[1],origin[2]]
  const local=relativeVector(position,origin)
  expect(Math.fround(local[0])*149597870700).toBeCloseTo(1,2)
  expect(absoluteVector(local,origin)).toEqual(position)
  expect(Math.fround(position[0])-Math.fround(origin[0])).toBe(0)
 })
 it('stops a long flight at the first opaque surface rather than tunneling through',()=>{
  const bodies=[{position:[2,0,0] as [number,number,number],radius:.1},{position:[0,0,0] as [number,number,number],radius:.2}]
  const result=stopAtSurface([-5,0,0],[5,0,0],bodies)
  expect(result[0]).toBeCloseTo(-.204,8)
  expect(stopAtSurface([-5,1,0],[5,1,0],bodies)).toEqual([5,1,0])
 })
 it('allows escape from a bad inside-body restore and rejects a deeper move',()=>{
  const bodies=[{position:[0,0,0] as [number,number,number],radius:1}]
  expect(stopAtSurface([.5,0,0],[2,0,0],bodies)).toEqual([2,0,0])
  expect(stopAtSurface([.5,0,0],[.1,0,0],bodies)).toEqual([.5,0,0])
 })
 it('scales free flight by proximity without negative speeds at a surface',()=>{
  expect(flightSpeed([0,0,10],[{position:[0,0,0],radius:1}])).toBeGreaterThan(flightSpeed([0,0,1.1],[{position:[0,0,0],radius:1}]))
  expect(flightSpeed([0,0,1],[{position:[0,0,0],radius:1}])).toBeGreaterThan(0)
 })
})
describe('one monotonic Solar clock',()=>{
 it('is initially paused, advances both directions and changes rates without jumps',()=>{
  const c=new SolarClock('2026-10-27T04:00:00Z')
  const initial=c.tick(0).epochMs
  expect(c.tick(1000).epochMs).toBe(initial)
  c.play(1000,86400);expect(c.tick(2000).epochMs).toBe(initial+86400000)
  c.play(2000,-3600);expect(c.tick(3000).epochMs).toBe(initial+82800000)
  c.pause();expect(c.tick(5000).epochMs).toBe(initial+82800000)
 })
 it('stops at coverage edges and reports the reason rather than extrapolating',()=>{
  const c=new SolarClock('2026-10-27T04:00:00Z'),initial=c.tick(0).epochMs
  c.play(0,86400);const result=c.tick(1000,[initial-100,initial+100])
  expect(result.epochMs).toBe(initial+100);expect(result.reason).toBe('coverage');expect(result.running).toBe(false)
 })
 it('does not jump through a suspended browser interval',()=>{
  const c=new SolarClock('2026-10-27T04:00:00Z'),initial=c.tick(0).epochMs
  c.play(0,86400);const result=c.tick(6000)
  expect(result.epochMs).toBe(initial);expect(result.reason).toBe('suspended');expect(result.running).toBe(false)
 })
 it('rejects invalid time/rate and seeks atomically',()=>{
  expect(()=>new SolarClock('garbage')).toThrow()
  const c=new SolarClock('2026-10-27T04:00:00Z')
  expect(()=>c.play(0,Infinity)).toThrow();expect(()=>c.seek('no')).toThrow()
  c.seek('2026-10-28T00:00:00Z');expect(c.tick(0).epochMs).toBe(Date.parse('2026-10-28T00:00:00Z'))
 })
})
