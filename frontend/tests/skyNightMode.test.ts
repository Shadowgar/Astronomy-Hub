import {describe,it,expect} from 'vitest'
import {SKY_NIGHT_MODE_KEY,readSkyNightMode,saveSkyNightMode} from '../src/features/workspace/skyNightMode'
describe('Sky-only native Night Mode preference',()=>{
 it('persists the reported native setting across reads, including explicit off',()=>{
  const values=new Map<string,string>(),storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)}}
  expect(readSkyNightMode(storage)).toBe(false);saveSkyNightMode(true,storage);expect(values.get(SKY_NIGHT_MODE_KEY)).toBe('true');expect(readSkyNightMode(storage)).toBe(true);saveSkyNightMode(false,storage);expect(readSkyNightMode(storage)).toBe(false)
 })
 it('rejects malformed persisted data and retains native state if storage is unavailable',()=>{
  for(const value of ['1','TRUE','{}','false',''])expect(readSkyNightMode({getItem:()=>value})).toBe(false)
  const blocked={getItem:()=>{throw new Error('blocked')},setItem:()=>{throw new Error('blocked')}}
  saveSkyNightMode(true,blocked);expect(readSkyNightMode(blocked)).toBe(true);saveSkyNightMode(false,blocked);expect(readSkyNightMode(blocked)).toBe(false)
 })
})
