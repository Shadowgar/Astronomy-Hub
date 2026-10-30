import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {it,expect} from 'vitest'
import AboutLicenses,{SourceOfferDetails} from '../src/features/workspace/AboutLicenses'
import {validateSourceOffer} from '../src/features/workspace/sourceOffer'
it('offers product identity, pinned engine notices, complete license text and modified source without a standalone app destination',()=>{
 const html=renderToStaticMarkup(<AboutLicenses open={false} onClose={()=>{}}/>);expect(html).toContain('Astronomy Hub');expect(html).toContain('Stellarium Web Engine');expect(html).toContain('Stellarium Labs SRL');expect(html).toContain('/licenses/stellarium-web-engine-AGPL-3.0.txt');expect(html).toContain('Corresponding source');expect(html).toContain('023e3b26babf7ffddf45f39293230b14cfe96993');expect(html).toContain('Data and imagery credits');expect(html).toContain('Close About &amp; Licenses');expect(html).not.toContain('href="/oras-sky-engine/');expect(html).not.toContain('href="/earth-runtime/')
})
it('shows manifest-bound revision, archive digest, retrieval location, licenses and unpublished limits',()=>{
 const offer=validateSourceOffer({schema:1,status:'candidate',source_revision:'a'.repeat(40),archive:{url:'/source-distribution/astronomy-hub-source-'+'a'.repeat(40)+'.tar.gz',sha256:'b'.repeat(64),bytes:123456},runtime:{sky_artifact_sha256:'c'.repeat(64),native_wasm_sha256:'d'.repeat(64)},licenses:[{name:'GNU AGPL v3',url:'/licenses/stellarium-web-engine-AGPL-3.0.txt'},{name:'Hub MIT',url:'/licenses/astronomy-hub-MIT.txt'}],limitations:['Public distribution is not yet qualified.']})
 const html=renderToStaticMarkup(<SourceOfferDetails offer={offer}/>)
 expect(html).toContain('Local, unpublished source candidate')
 expect(html).toContain('Public anonymous HTTPS retrieval has not been qualified')
 expect(html).toContain('https://github.com/Shadowgar/Astronomy-Hub/tree/'+'a'.repeat(40))
 expect(html).toContain('b'.repeat(64));expect(html).toContain('123,456 bytes')
 expect(html).toContain('href="/source-distribution/astronomy-hub-source-'+'a'.repeat(40)+'.tar.gz"')
 expect(html).toContain('GNU AGPL v3');expect(html).toContain('Hub MIT')
 expect(html).toContain('separately licensed imagery');expect(html).toContain('Public distribution is not yet qualified.')
 expect(html).not.toContain('n1-sky-earth-navigation-1')
})
it('does not advertise historical branch archives as the current corresponding source',()=>{
 const html=renderToStaticMarkup(<AboutLicenses open={false} onClose={()=>{}}/> )
 expect(html).not.toContain('n1-sky-earth-navigation-1')
 expect(html).toContain('Corresponding source')
})

import DiagnosticsSurface from '../src/features/workspace/DiagnosticsSurface'
it('public diagnostics points to in-product acknowledgments rather than the standalone renderer',()=>{const html=renderToStaticMarkup(<DiagnosticsSurface version="test" status="ready" snapshot={{selection:null,layers:[],tracking:false}} onClose={()=>{}} onRetryImagery={()=>{}}/>);expect(html).not.toContain('standalone renderer');expect(html).toContain('About &amp; Licenses')})
