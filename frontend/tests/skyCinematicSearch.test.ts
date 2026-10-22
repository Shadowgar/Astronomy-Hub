import{it,expect}from'vitest'
import{parseSkySearch}from'../src/features/workspace/skyCinematicSearch'
it('preserves stable string identity and rejects incomplete, external and mismatched links',()=>{
 const row={catalog:'gaia_dr2',source_id:'1234567890123456789',model:'star',display_name:'Source',sky_engine_url:'/oras-sky-engine/skysource/Source?catalog=gaia_dr2&source_id=1234567890123456789&model=star&ra=1&dec=2'}
 expect(parseSkySearch({data:{results:[row]}})[0].url).toContain(row.source_id)
 for(const value of[{...row,source_id:123}, {...row,sky_engine_url:'https://external.test/'},{...row,sky_engine_url:row.sky_engine_url.replace('model=star','model=dso')},{...row,sky_engine_url:null}])expect(parseSkySearch({data:{results:[value]}})).toEqual([])
})
