import{it,expect}from'vitest'
import*as T from'three'
import*as presentation from'../src/features/solar/solarPresentation'
import{radii}from'./fixtures/solarRadii'
// Real October27 04:00UTC vectors, restricted to a test fixture.
const bodies=[{source_id:'sun',position_au:[0,0,0]},{source_id:'mercury',position_au:[.3563,-.0012,-.0376]},{source_id:'venus',position_au:[.5903,.3947,.1403]},{source_id:'earth',position_au:[.8294,.5025,.2178]},{source_id:'mars',position_au:[-.2249,1.4276,.6609]}]as any
it('allocates a substantial cinematic Sun and readable planets, with bounded mobile sizes',()=>{
 expect(typeof presentation.cinematicRadius).toBe('function')
 expect(presentation.cinematicRadius('sun',1440,900)).toBeGreaterThanOrEqual(180)
 expect(presentation.cinematicRadius('earth',1440,900)).toBeGreaterThanOrEqual(80)
 expect(presentation.cinematicRadius('mercury',1440,900)).toBeLessThan(30)
 for(const [w,h]of[[390,844],[844,390]])for(const b of bodies)expect(presentation.cinematicRadius(b.source_id,w,h)).toBeLessThan(Math.min(w,h)*.3)
})
it('composes source centers in the viewport without changing body positions or physical radii',()=>{
 expect(typeof presentation.cinematicOverviewPose).toBe('function');const original=JSON.stringify(bodies)
 for(const[w,h]of[[1440,900],[390,844],[844,390]]){
  const f=presentation.clearViewport(w,h,[{left:20,top:16,right:w-20,bottom:64},{left:20,top:h-80,right:w-20,bottom:h-16}])
  const pose=presentation.cinematicOverviewPose(radii,bodies,w/h,h,f),camera=new T.PerspectiveCamera(42,w/h,.001,500)
  camera.up.fromArray(presentation.overviewUp(w/h));camera.position.fromArray(pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld()
  const projected=bodies.map((b:any)=>new T.Vector3(...b.position_au).project(camera))
  for(const p of projected){expect(Math.abs(p.x)).toBeLessThan(.92);expect(Math.abs(p.y)).toBeLessThan(.92)}
  if(w>h)expect(projected[0].x).toBeLessThan(projected[3].x)
 }
 expect(JSON.stringify(bodies)).toBe(original)
})
