import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {MemoryRouter} from 'react-router-dom'
import {it,expect} from 'vitest'
import EarthSearch from '../src/features/workspace/EarthSearch'
it('retains selected source location in its own collapsed card when results are closed',()=>{
 const html=renderToStaticMarkup(<MemoryRouter initialEntries={[{pathname:'/earth',state:{r2Search:true,r2Place:{name:'Coordinates',description:'User supplied coordinates',lat:41,lon:-79}}}]}><EarthSearch active busy={false} onNavigate={async()=>true}/></MemoryRouter>)
 expect(html).toContain('aria-label="Selected location"');expect(html).toContain('Expand location details');expect(html).toContain('41.00000°');expect(html).toContain('Search Earth');expect(html).not.toContain('id="earth-search-content"')
})
