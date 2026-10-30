import {radii} from './fixtures/solarRadii'
import {expect,it} from 'vitest'
import * as T from 'three'
import * as presentation from '../src/features/solar/solarPresentation'

it('fits Saturn rings and selected globes in the measured space between HUD controls',()=>{
 const obstacles=[{left:14,top:88,right:314,bottom:164},{left:14,top:175,right:72,bottom:274},{left:328,top:94,right:376,bottom:378},{left:14,top:443,right:376,bottom:772},{left:14,top:826,right:376,bottom:880}]
 const frame=presentation.clearViewport(390,900,obstacles)
 const pose=presentation.focusPose(radii,'saturn',[9,1,.1],390/900,true,900,frame)
 const distance=Math.hypot(...pose.position.map((v,i)=>v-[9,1,.1][i]))
 const radius=900*(radii.saturn*2.27)/(2*Math.tan(21*Math.PI/180)*Math.sqrt(distance*distance-(radii.saturn*2.27)**2))
 const x=195-frame.offsetX,y=450-frame.offsetY
 expect(radius).toBeGreaterThan(30)
 expect(x-radius).toBeGreaterThanOrEqual(14)
 expect(x+radius).toBeLessThanOrEqual(376)
 for(const r of obstacles)expect(x+radius<=r.left||x-radius>=r.right||y+radius<=r.top||y-radius>=r.bottom).toBe(true)
 expect(pose.target).toEqual([9,1,.1])
})

it('fits the full-system overview including Saturn rings without compressing anchors',()=>{
 const anchors=[{source_id:'sun' as const,position_au:[0,0,0] as [number,number,number]},{source_id:'saturn' as const,position_au:[9,0,0] as [number,number,number]},{source_id:'neptune' as const,position_au:[-27,11,4] as [number,number,number]}]
 const pose=presentation.overviewPose(radii,anchors,390/900),camera=new T.PerspectiveCamera(42,390/900,.001,500)
 camera.up.fromArray(presentation.overviewUp(390/900));camera.position.fromArray(pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld()
 for(const anchor of anchors){const center=new T.Vector3(...anchor.position_au).project(camera);expect(Math.abs(center.x)).toBeLessThan(.82);expect(Math.abs(center.y)).toBeLessThan(.7)}
 expect(anchors[1].position_au).toEqual([9,0,0])
})

it('keeps overview anchors in the clear optical frame below the portrait camera HUD',()=>{
 const frame=presentation.clearViewport(390,900,[{left:14,top:88,right:314,bottom:164},{left:14,top:175,right:72,bottom:274},{left:328,top:94,right:376,bottom:378},{left:14,top:826,right:376,bottom:880}])
 const anchors=[{source_id:'sun' as const,position_au:[0,0,0] as [number,number,number]},{source_id:'saturn' as const,position_au:[9,0,0] as [number,number,number]},{source_id:'neptune' as const,position_au:[-27,11,4] as [number,number,number]}]
 const pose=presentation.overviewPose(radii,anchors,390/900,900,frame),camera=new T.PerspectiveCamera(42,390/900,.001,500)
 camera.up.fromArray(presentation.overviewUp(390/900));camera.position.fromArray(pose.position);camera.lookAt(...pose.target);camera.setViewOffset(390,900,frame.offsetX,frame.offsetY,390,900);camera.updateMatrixWorld()
 for(const anchor of anchors){const p=new T.Vector3(...anchor.position_au).project(camera),x=(p.x+1)*195,y=(1-p.y)*450;expect(x).toBeGreaterThan(14);expect(x).toBeLessThan(376);expect(y).toBeGreaterThan(388);expect(y).toBeLessThan(816)}
})
