import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {MemoryRouter} from 'react-router-dom'
import {expect,it,vi} from 'vitest'
import EarthSearch from '../src/features/workspace/EarthSearch'
import EarthExplore from '../src/features/workspace/EarthExplore'
it('renders a permanent submitted Search Earth field outside any dialog',()=>{const html=renderToStaticMarkup(<MemoryRouter><EarthSearch active busy={false} onNavigate={async()=>true}/></MemoryRouter>);expect(html).toContain('>Search Earth</label>');expect(html).toContain('data-earth-search');expect(html).not.toContain('<dialog');expect(html).toContain('aria-label="Show search results and location"')})
it('Explore retains cross-mode/manual coordinates without duplicating search',()=>{const html=renderToStaticMarkup(<EarthExplore busy={false} onSky={vi.fn()} onLocation={async()=>true} center={async()=>null}/>);expect(html).toContain('Enter Sky here');expect(html).toContain('Go to exact coordinates');expect(html).not.toContain('earth-search-query')})
