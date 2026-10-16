import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {it,expect} from 'vitest'
import AboutLicenses from '../src/features/workspace/AboutLicenses'
it('offers product identity, pinned engine notices, complete license text and modified source without a standalone app destination',()=>{
 const html=renderToStaticMarkup(<AboutLicenses open={false} onClose={()=>{}}/>);expect(html).toContain('Astronomy Hub');expect(html).toContain('Stellarium Web Engine');expect(html).toContain('Stellarium Labs SRL');expect(html).toContain('/licenses/stellarium-web-engine-AGPL-3.0.txt');expect(html).toContain('Shadowgar/Astronomy-Hub');expect(html).toContain('023e3b26babf7ffddf45f39293230b14cfe96993');expect(html).toContain('Data and imagery credits');expect(html).toContain('Close About &amp; Licenses');expect(html).not.toContain('href="/oras-sky-engine/');expect(html).not.toContain('href="/earth-runtime/')
})

import DiagnosticsSurface from '../src/features/workspace/DiagnosticsSurface'
it('public diagnostics points to in-product acknowledgments rather than the standalone renderer',()=>{const html=renderToStaticMarkup(<DiagnosticsSurface version="test" status="ready" snapshot={{selection:null,layers:[],tracking:false}} onClose={()=>{}} onRetryImagery={()=>{}}/>);expect(html).not.toContain('standalone renderer');expect(html).toContain('About &amp; Licenses')})
