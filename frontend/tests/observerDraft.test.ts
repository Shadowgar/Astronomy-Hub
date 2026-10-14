import {describe,it,expect} from 'vitest'
import {observerDraft,parseObserverDraft} from '../src/features/workspace/AdaptiveSkyChrome'
describe('observing-location text drafts',()=>{
 it('preserves string coordinates until complete signed decimals are submitted',()=>{
  expect(observerDraft({lat:-33.875,lon:-80.125,elevationM:12.5})).toEqual({lat:'-33.875',lon:'-80.125',elevationM:'12.5'})
  expect(parseObserverDraft({lat:'-33.875',lon:'-80.125',elevationM:'12.5'})).toEqual({lat:-33.875,lon:-80.125,elevationM:12.5})
  expect(parseObserverDraft({lat:'+.25',lon:'-0.5',elevationM:'-10.75'})).toEqual({lat:.25,lon:-.5,elevationM:-10.75})
 })
 it('rejects empty, partial and invalid text in every field',()=>{
  for(const key of ['lat','lon','elevationM'] as const)for(const value of ['', ' ', '-', '.', '-.', 'NaN', 'Infinity', '1e999', '0x10', '12,5','abc'])expect(parseObserverDraft({...observerDraft({lat:42,lon:-80,elevationM:400}),[key]:value})).toBeNull()
 })
 it('rejects out-of-range intent and accepts the existing inclusive protocol limits',()=>{
  for(const [key,value] of [['lat','-90.1'],['lat','90.1'],['lon','-180.1'],['lon','180.1'],['elevationM','-1000.1'],['elevationM','100000.1']])expect(parseObserverDraft({...observerDraft({lat:42,lon:-80,elevationM:400}),[key]:value})).toBeNull()
  expect(parseObserverDraft({lat:'-90',lon:'180',elevationM:'-1000'})).toEqual({lat:-90,lon:180,elevationM:-1000})
  expect(parseObserverDraft({lat:'90',lon:'-180',elevationM:'100000'})).toEqual({lat:90,lon:-180,elevationM:100000})
 })
})
