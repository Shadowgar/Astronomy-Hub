import {describe,it,expect} from 'vitest'
import {workspaceModePath,skyStandalonePath,skyWorkspacePath} from '../src/features/workspace/workspaceNavigation'
describe('validated workspace recovery navigation',()=>{
 it('normal actions preserve the complete source query and string identity in Hub Sky',()=>{
  const query=new URLSearchParams({catalog:'Gaia DR3',source_id:'1576683529448755328',model:'star',ra:'193.508',dec:'55.959',date:'2026-10-03T02:00:00.000Z',lat:'42',lng:'-80',elev:'0',fov:'20'})
  const result=new URL(skyWorkspacePath('/oras-sky-engine/skysource/Cosmetic?'+query)!,'https://oras.test')
  expect(result.pathname).toBe('/sky-engine');for(const [key,value] of query)expect(result.searchParams.get(key)).toBe(value)
  expect(result.searchParams.get('focus')).toBe('1')
 })
 it('does not create identity from a name or accept external/standalone diagnostic routes',()=>{
  for(const url of ['/oras-sky-engine/skysource/M31','/oras-sky-engine/','https://other.test/oras-sky-engine/skysource/M31?catalog=C&source_id=1&model=dso'])expect(skyWorkspacePath(url)).toBeNull()
 })
 it('keeps microsecond backend peak time controlled at native millisecond precision',()=>{
  const path=skyWorkspacePath('/oras-sky-engine/skysource/M31?catalog=Messier&source_id=M31&model=dso&date=2026-10-03T05%3A13%3A21.070748Z')!
  expect(new URL(path,'https://oras.test').searchParams.get('date')).toBe('2026-10-03T05:13:21.070Z')
  expect(skyWorkspacePath('/oras-sky-engine/skysource/M31?catalog=Messier&source_id=M31&model=dso&date=2026-02-30T05%3A13%3A21.070748Z')).toBeNull()
 })
 it('shares fixed time and observer while removing Sky-only identity on Earth recovery',()=>{const path=workspaceModePath('earth','?date=2026-10-03T02%3A00%3A00Z&lat=42&lng=-80&elev=0&catalog=Gaia&source_id=1&model=star&fov=20'),url=new URL(path,'https://oras.test');expect(url.pathname).toBe('/earth');expect(url.searchParams.get('date')).toBe('2026-10-03T02:00:00.000Z');expect(url.searchParams.get('lat')).toBe('42');expect(url.searchParams.has('catalog')).toBe(false);expect(workspaceModePath('sky','?date=invalid')).toBe('/sky-engine')})
 it('preserves exact string identity and controlled scene intent in standalone paths',()=>{const intent={requestedTime:'2026-10-03T02:00:00.000Z',observer:{lat:42,lon:-80,elevationM:0},selection:{catalog:'Gaia DR3',source_id:'1576683529448755328',model:'star',ra:193.508,dec:55.959}},url=new URL(skyStandalonePath(intent,false),'https://oras.test');expect(url.searchParams.get('source_id')).toBe(intent.selection.source_id);expect(url.searchParams.get('date')).toBe(intent.requestedTime);expect(url.searchParams.get('elev')).toBe('0');expect(new URL(skyStandalonePath(intent,true),'https://oras.test').searchParams.has('date')).toBe(false)})
})
