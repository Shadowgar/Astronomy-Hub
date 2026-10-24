import {describe,it,expect} from 'vitest'
import {advanceSystemTime} from '../src/features/systems/systemPlayback'
describe('astronomical playback clock',()=>{
 const start=Date.parse('2026-10-23T01:05:00Z'),end=start+32*86400000
 it.each([60,3600,21600,86400])('advances %i simulated seconds per wall second',speed=>{expect(advanceSystemTime(start,1000,speed,end)).toBe(start+speed*1000)})
 it('is independent of frame subdivision',()=>{let now=start;for(let i=0;i<100;i++)now=advanceSystemTime(now,10,86400,end);expect(now).toBe(advanceSystemTime(start,1000,86400,end))})
 it('stops exactly at qualified coverage',()=>{expect(advanceSystemTime(end-10,1000,86400,end)).toBe(end)})
})
