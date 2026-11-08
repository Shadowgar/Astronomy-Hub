import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import DiagnosticsSurface from '../src/features/workspace/DiagnosticsSurface';
const render=(imagery:string)=>renderToStaticMarkup(<DiagnosticsSurface version="1.1" status="ready" snapshot={{selection:null,layers:[],tracking:false,quality:{imagery,terrain:'Terrain unavailable · ellipsoid'}}} onClose={()=>{}} onRetryImagery={()=>{}} earth/>);
it('degraded HD exposes explicit retry while disclosing coverage and separate terrain',()=>{
 const html=render('USGS unavailable · Blue Marble · NASA static 500m');
 expect(html).toContain('Retry imagery');expect(html).toContain('contiguous United States');expect(html).not.toContain('about 2 m near ORAS');expect(html).toContain('capture dates vary');expect(html).toContain('Detailed terrain requires a configured source');
});
it('healthy HD and legacy global sources do not show unavailable retry or invent global HD',()=>{
 expect(render('USGS aerial · CONUS only')).not.toContain('Retry imagery');
 expect(render('Blue Marble · NASA static 500m')).not.toContain('Aerial detail covers');
});

it('Earth Sources exposes owned cache controls and truthful dated/non-global detail',()=>{const html=render('EOX · Global Satellite · partial · Sentinel-2 cloudless · 2016 mosaic · 10 m');expect(html).toContain('Imagery Cache');expect(html).toContain('Clear Imagery Cache');expect(html).toContain('2016');expect(html).toContain('Browser HTTP cache');expect(html).not.toContain('imagery-source')});
it('Sky sources do not expose Earth cache controls',()=>{const html=renderToStaticMarkup(<DiagnosticsSurface version="1" status="ready" snapshot={{selection:null,layers:[],tracking:false}} onClose={()=>{}} onRetryImagery={()=>{}}/>);expect(html).not.toContain('Clear Imagery Cache')});
