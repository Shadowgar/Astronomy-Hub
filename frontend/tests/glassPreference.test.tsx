import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {expect,it} from 'vitest'
import {CinematicBrand} from '../src/features/workspace/cinematic'
it('keeps the existing accessible mode trigger with glass branding in every mode',()=>{
 for(const mode of ['sky','earth','solar'] as const){const html=renderToStaticMarkup(<CinematicBrand mode={mode} onMode={()=>{}}/>);expect(html).toContain('Choose exploration mode');expect(html).toContain('aria-expanded="false"');expect(html).toContain('Astronomy Hub')}
})
