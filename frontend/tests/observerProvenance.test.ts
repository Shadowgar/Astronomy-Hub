import {it,expect} from 'vitest'
import {observerWithProvenance,siteObserver} from '../src/features/workspace/observerProvenance'
const ny={lat:40.7829,lon:-73.9654,elevationM:123}
it.each([['?elev=123','provided'],['?elev=123&elevationSource=provided','provided'],['?elev=123&elevationSource=oras-site','provided'],['?elev=123&elevationSource=unavailable-zero','provided'],['?elev=123&elevationSource=bad','provided']])('validates URL claim %s',(query,source)=>{expect(observerWithProvenance(ny,query)).toEqual({...ny,elevationSource:source})})
it('qualified ORAS height, explicitly provided zero and genuine missing-elevation fallback remain distinct',()=>{
 expect(observerWithProvenance(siteObserver,'').elevationSource).toBe('oras-site')
 expect(observerWithProvenance({...ny,elevationM:0},'?elev=0').elevationSource).toBe('provided')
 expect(observerWithProvenance({...ny,elevationM:0},'?lat=40.7829&lng=-73.9654&elev=0&elevationSource=unavailable-zero').elevationSource).toBe('unavailable-zero')
 expect(observerWithProvenance({...ny,elevationM:0},'?lat=40.7829&lng=-73.9654').elevationSource).toBe('unavailable-zero')
})
it('a bare URL does not relabel a restored provided zero as missing-elevation fallback',()=>{
 const suppliedZero={...ny,elevationM:0}
 expect(observerWithProvenance(suppliedZero,'?lat=40.7829&lng=-73.9654&elev=0&elevationSource=provided').elevationSource).toBe('provided')
 expect(observerWithProvenance(suppliedZero,'').elevationSource).toBe('provided')
 expect(observerWithProvenance(suppliedZero,'?elevationSource=unavailable-zero').elevationSource).toBe('provided')
 expect(observerWithProvenance(suppliedZero,'?date=2026-06-05T02:10:00.000Z').elevationSource).toBe('provided')
})
