import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {it,expect} from 'vitest'
import {formatSkyFov,SkyFovIndicator} from '../src/features/workspace/SkyFovIndicator'
const radians=(degrees:number)=>degrees*Math.PI/180
it.each([[120,'120°'],[20,'20°'],[4.79388385,'4.8°'],[.0002777777778,'0.00028°']])('formats actual native %s degrees without misleading zero', (value,label)=>{expect(formatSkyFov(radians(value as number))).toBe(label)})
it('rejects invalid angles and exposes a keyboard-readable, non-announcing readout',()=>{
 for(const value of [null,0,-1,NaN,Infinity,7])expect(formatSkyFov(value)).toBe('—')
 const html=renderToStaticMarkup(<SkyFovIndicator fovRad={radians(4.8)}/>);expect(html).toContain('FOV 4.8°');expect(html).toContain('tabindex="0"');expect(html).toContain('aria-live="off"');expect(html).toContain('Field of view')
})
