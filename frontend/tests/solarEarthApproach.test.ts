import {it,expect} from 'vitest'
import {stopAtSurface} from '../src/features/solar/solarPrecision'
it('permits the qualified Earth approach while preventing a fast segment crossing the surface',()=>{
 const au=149597870700,r=6371000/au,clearanceAU=1000/au,earth={position:[1,0,0] as [number,number,number],radius:r,clearanceAU}
 const safe=stopAtSurface([1+2*r,0,0],[1-r,0,0],[earth])
 expect((safe[0]-1-r)*au).toBeCloseTo(1000,3)
 const legacy=stopAtSurface([1+2*r,0,0],[1-r,0,0],[{position:earth.position,radius:r}])
 expect((legacy[0]-1-r)*au).toBeCloseTo(6371000*.02,3)
})

import {pointOccluded} from '../src/features/solar/solarPrecision'
it('hides markers behind the displayed globe without hiding foreground or tangent positions',()=>{
 const globe={position:[0,0,-5] as [number,number,number],radius:1}
 expect(pointOccluded([0,0,-10],[globe])).toBe(true)
 expect(pointOccluded([0,0,-2],[globe])).toBe(false)
 expect(pointOccluded([3,0,-10],[globe])).toBe(false)
 expect(pointOccluded([0,0,0],[globe])).toBe(false)
 expect(pointOccluded([0,0,-10],[{position:[1,0,-5],radius:1}])).toBe(false)
})
