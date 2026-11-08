import {it,expect,vi} from 'vitest'
import * as T from 'three'
import {SolarCameraController} from '../src/features/solar/SolarCameraController'
import {BeyondScene} from '../src/features/beyond/BeyondScene'
import {validBeyondCamera} from '../src/features/beyond/beyondMath'

it('admits and restores 100 real OrbitControls boundary pans without floating overshoot',()=>{
 const root=new EventTarget()
 class Canvas extends EventTarget{style={touchAction:''};getRootNode(){return root}ownerDocument=root;clientWidth=1440;clientHeight=900}
 vi.stubGlobal('window',new EventTarget());vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{})
 // This harness exercises actual camera/controller math. WebGL is deliberately
 // not initialized; rendering qualification is a separate Windows GPU receipt.
 const scene=new BeyondScene({} as HTMLElement) as any,camera=new T.PerspectiveCamera(42,1,.001,4000000);camera.up.set(0,0,1)
 const controller=new SolarCameraController(camera,new Canvas() as unknown as HTMLCanvasElement,()=>[],()=>{},()=>scene.constrainCamera(),()=>{},{maxDistanceAU:1e6,maxFlightSpeedAU:10000})
 scene.camera=camera;scene.navigator=controller
 try{
  for(let i=0;i<100;i++){
   controller.move({position:[300000,600000,700000],target:[0,0,0]},.001,.1,true)
   camera.updateMatrixWorld();controller.controls._pan(3000+i*11,i*123);controller.controls.update()
   const saved=scene.getCamera();expect(validBeyondCamera(saved),`Boundary pan ${i}`).toBe(true)
   expect(scene.restoreCamera(saved)).toBe(true)
   const restored=scene.getCamera(),before=[...saved.position,...saved.target],after=[...restored.position,...restored.target]
   expect(Math.max(...after.map((value,index)=>Math.abs(value-before[index])))).toBeLessThan(1e-8)
  }
 }finally{controller.dispose();vi.unstubAllGlobals()}
})
