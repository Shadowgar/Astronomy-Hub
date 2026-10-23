import {it,expect} from 'vitest'
import * as presentation from '../src/features/solar/solarPresentation'
import {radiusSnapshot,radii} from './fixtures/solarRadii'

it('uses API mean radii in the same AU units as positions, without enlarging planets',()=>{
 const actual=presentation.physicalRadii(radiusSnapshot)
 expect(actual).toEqual(radii)
 expect(actual.sun/actual.earth).toBeCloseTo(695700/6371,10)
 expect(actual.earth).toBeCloseTo(.0000425875,9)
 const changed={...radiusSnapshot,bodies:radiusSnapshot.bodies.map(b=>b.source_id==='earth'?{...b,shape:{...b.shape,mean_radius_km:7000}}:b)}
 expect(presentation.physicalRadii(changed).earth).toBe(7000/radiusSnapshot.km_per_au)
})
it('camera framing groups never remove bodies from source or use distance as an identity filter',()=>{
 const bodies=radiusSnapshot.bodies.map((b,i)=>({...b,position_au:[i,0,0] as [number,number,number]})),before=JSON.stringify(bodies)
 expect(presentation.presetAnchors(bodies,'full').map(b=>b.source_id)).toEqual(bodies.map(b=>b.source_id))
 expect(presentation.presetAnchors(bodies,'inner').map(b=>b.source_id)).toEqual(['sun','mercury','venus','earth','mars'])
 expect(presentation.presetAnchors(bodies,'outer').map(b=>b.source_id)).toEqual(['jupiter','saturn','uranus','neptune'])
 expect(JSON.stringify(bodies)).toBe(before)
})
it('spreads clustered labels into clear tappable boxes without moving source anchors',()=>{
 const occupied=[{left:0,top:0,right:390,bottom:90},{left:0,top:100,right:74,bottom:750},{left:0,top:790,right:390,bottom:900}]
 for(let i=0;i<9;i++){
  const anchor={x:205+i*.3,y:420+i*.4,radius:2}
  const spot=presentation.labelPosition(anchor,80,44,390,900,occupied)
  expect(spot).not.toBeNull()
  if(!spot)continue
  const box={left:spot[0],top:spot[1],right:spot[0]+80,bottom:spot[1]+44}
  expect(box.left).toBeGreaterThanOrEqual(10);expect(box.right).toBeLessThanOrEqual(380)
  expect(occupied.some(o=>box.left<o.right&&box.right>o.left&&box.top<o.bottom&&box.bottom>o.top)).toBe(false)
  occupied.push(box)
 }
})
it('keeps all nine compact-system labels available around measured short-landscape controls',()=>{
 const occupied=[{left:10,top:10,right:530,bottom:84},{left:8,top:79,right:176,bottom:161},{left:8,top:162,right:118,bottom:228},{left:8,top:318,right:230,bottom:384},{left:234,top:230,right:532,bottom:384}]
 const anchors=[[269,204],[267,203],[270,202],[265,205],[275,204],[245,196],[287,185],[230,148],[324,152]]
 for(const [x,y]of anchors){const spot=presentation.labelPosition({x,y,radius:1},64,44,540,390,occupied);expect(spot).not.toBeNull();if(spot)occupied.push({left:spot[0]-3,top:spot[1]-3,right:spot[0]+67,bottom:spot[1]+47})}
})
it('approaches physical-size bodies across AU scales without holding all magnification until the last frame',()=>{
 const from:[number,number,number]=[0,0,100],origin:[number,number,number]=[0,0,0],to={position:[0,0,.0002] as [number,number,number],target:origin}
 const midpoint=presentation.cameraTransition(from,origin,to,.5)
 expect(Math.hypot(...midpoint.position)).toBeCloseTo(Math.sqrt(100*.0002),10)
 expect(presentation.cameraTransition(from,origin,to,0).position).toEqual(from)
 expect(presentation.cameraTransition(from,origin,to,1)).toEqual(to)
 expect(midpoint.target).toEqual(origin)
})
it('places compact all-system callouts with outer anchors considered before the crowded inner system',()=>{
 const occupied=[{left:12,top:12,right:308,bottom:84},{left:8,top:82,right:312,bottom:170},{left:8,top:333,right:312,bottom:475},{left:8,top:492,right:312,bottom:558}]
 const points=[[207,290,44],[205,291,62],[206,287,50],[205,295,48],[212,284,44],[179,310,56],[202,254,52],[113,286,54],[197,186,62]]
 for(const[x,y,w]of points.reverse()){const spot=presentation.labelPosition({x,y,radius:1},w,44,320,568,occupied);expect(spot).not.toBeNull();if(spot)occupied.push({left:spot[0]-3,top:spot[1]-3,right:spot[0]+w+3,bottom:spot[1]+47})}
})

it('packs all source-linked labels when a single greedy order leaves the Sun unnamed',()=>{
 const occupied=[{left:12,top:12,right:308,bottom:84},{left:8,top:82,right:312,bottom:170},{left:8,top:333,right:312,bottom:475},{left:8,top:492,right:312,bottom:558}]
 const points=[[207,290,44],[205,291,62],[206,287,50],[205,295,48],[212,284,44],[179,310,56],[202,254,52],[113,286,54],[197,186,62]]
 const labels=points.map(([x,y,width],i)=>({id:String(i),x,y,radius:1,width,height:44}))
 const bodies=points.map(([x,y])=>({left:x-4,right:x+4,top:y-4,bottom:y+4}))
 const result=presentation.arrangeLabels(labels,320,568,[...occupied,...bodies])
 expect([...result.values()].filter(Boolean)).toHaveLength(9)
})
it('fits a real clear strip on short mobile instead of placing the selected globe under a card',()=>{
 const obstacles=[{left:14,top:18,right:306,bottom:78},{left:14,top:88,right:306,bottom:164},{left:14,top:216,right:306,bottom:334},{left:14,top:339,right:306,bottom:468},{left:14,top:498,right:306,bottom:552}]
 const f=presentation.clearViewport(320,568,obstacles),x=160-f.offsetX,y=284-f.offsetY
 expect(f.maxGlobeRadius).toBeGreaterThanOrEqual(14)
 for(const r of obstacles)expect(x+f.maxGlobeRadius<=r.left||x-f.maxGlobeRadius>=r.right||y+f.maxGlobeRadius<=r.top||y-f.maxGlobeRadius>=r.bottom).toBe(true)
})
