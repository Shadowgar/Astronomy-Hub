import {it,expect,vi} from 'vitest'
import * as T from 'three'
import {SolarCameraController} from '../src/features/solar/SolarCameraController'

it('releases the previous giant-planet minimum distance during an asteroid approach',()=>{
 const root=new EventTarget()
 class Canvas extends EventTarget{style={touchAction:''};getRootNode(){return root}ownerDocument=root;clientWidth=1440;clientHeight=900;focus(){} }
 vi.stubGlobal('window',new EventTarget())
 const camera=new T.PerspectiveCamera(42,1,.001,2000),controller=new SolarCameraController(camera,new Canvas() as unknown as HTMLCanvasElement,()=>[],()=>{},()=>{})
 controller.move({position:[0,0,.01],target:[0,0,0]},.000001,.001,true)
 controller.move({position:[0,0,.0000003],target:[0,0,0]},1e-9,6e-8)
 controller.tick(performance.now()+1900)
 expect(camera.position.length()).toBeCloseTo(.0000003,12)
 expect(controller.animating).toBe(false)
 controller.dispose();vi.unstubAllGlobals()
})

it('reports automatic mode changes when recenter leaves free flight',()=>{
 const root=new EventTarget()
 class Canvas extends EventTarget{style={touchAction:''};getRootNode(){return root}ownerDocument=root;clientWidth=1440;clientHeight=900}
 vi.stubGlobal('window',new EventTarget());const mode=vi.fn()
 const controller=new SolarCameraController(new T.PerspectiveCamera(),new Canvas() as unknown as HTMLCanvasElement,()=>[],()=>{},()=>{},mode)
 controller.setMode('free');controller.move({position:[0,0,1],target:[0,0,0]},.001,.01,true)
 expect(mode.mock.calls.map(args=>args[0])).toEqual(['free','orbit'])
 controller.dispose();vi.unstubAllGlobals()
})

it('guards the entire mouse/pan segment against an unselected opaque planet',()=>{
 const root=new EventTarget()
 class Canvas extends EventTarget{style={touchAction:''};getRootNode(){return root}ownerDocument=root;clientWidth=1440;clientHeight=900}
 vi.stubGlobal('window',new EventTarget())
 const camera=new T.PerspectiveCamera();camera.position.set(-5,0,0)
 const controller=new SolarCameraController(camera,new Canvas() as unknown as HTMLCanvasElement,()=>[{position:[0,0,0],radius:1}],()=>{},()=>{})
 controller.controls.target.set(0,10,0);controller.updateControls()
 camera.position.set(5,0,0);controller.controls.dispatchEvent({type:'change'})
 expect(camera.position.x).toBeCloseTo(-1.02,8)
 controller.dispose();vi.unstubAllGlobals()
})

it('stops real OrbitControls wheel input before an unselected opaque surface',()=>{
 const root=new EventTarget()
 class Canvas extends EventTarget{style={touchAction:''};getRootNode(){return root}ownerDocument=root;clientWidth=1440;clientHeight=900;getBoundingClientRect(){return{left:0,top:0,width:1440,height:900}}}
 vi.stubGlobal('window',new EventTarget());const canvas=new Canvas(),camera=new T.PerspectiveCamera(42,1,.001,2000);camera.position.set(0,0,3)
 const controller=new SolarCameraController(camera,canvas as unknown as HTMLCanvasElement,()=>[{position:[0,0,1.5],radius:.2}],()=>{},()=>{})
 const wheel=new Event('wheel',{cancelable:true});Object.assign(wheel,{deltaY:-1400,deltaMode:0,clientX:720,clientY:450,ctrlKey:false});canvas.dispatchEvent(wheel)
 expect(camera.position.z).toBeCloseTo(1.704,8)
 controller.dispose();vi.unstubAllGlobals()
})
