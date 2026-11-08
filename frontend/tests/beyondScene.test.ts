import {beforeEach,it,expect,vi} from 'vitest'
import type {BeyondContext} from '../src/features/beyond/beyondContracts'
import type {SolarSnapshot} from '../src/features/solar/solarContracts'
import {BeyondScene} from '../src/features/beyond/BeyondScene'

const mocks=vi.hoisted(()=>({prepare:vi.fn(),render:vi.fn(),release:vi.fn(),renderers:0,disposeRenderer:vi.fn(),pan:null as null|((delta:number[])=>void)}))
vi.mock('three',async original=>{
 const actual=await original<typeof import('three')>()
 return{...actual,WebGLRenderer:class{
  domElement={tabIndex:0,setAttribute:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn(),remove:vi.fn()}
  info={programs:[],render:{calls:0},memory:{geometries:0,textures:0}}
  constructor(){mocks.renderers++}
  setPixelRatio(){} setClearColor(){} setSize(){} getContext(){return{}}
  dispose(){mocks.disposeRenderer()} forceContextLoss(){}
 }}
})
vi.mock('../src/features/solar/SolarCameraController',async()=>{
 const {Vector3}=await import('three')
 return{SolarCameraController:class{
  controls={target:new Vector3(),enablePan:true};mode='orbit';animating=false
  constructor(private camera:any,_canvas:unknown,_bodies:unknown,_request:unknown,changed:()=>void){mocks.pan=delta=>{const shift=new Vector3(...delta);this.camera.position.add(shift);this.controls.target.add(shift);changed()}}
  setReduced(){} move(pose:any){this.camera.position.fromArray(pose.position);this.controls.target.fromArray(pose.target)}tick(){return false}dispose(){}setMode(){}zoom(){}orbit(){}updateControls(){}
 }}
})
vi.mock('../src/features/solar/solarRenderPipeline',()=>({createSolarRenderPipeline:()=>({prepare:mocks.prepare,render:mocks.render,dispose:mocks.release,setSceneUnitsPerAU:vi.fn(),resize:vi.fn(),setQuality:vi.fn(),diagnostics:()=>({})})}))
vi.mock('../src/features/solar/solarGpuTiming',()=>({gpuTiming:()=>({begin:vi.fn(),end:vi.fn(),dispose:vi.fn(),read:()=>({samples:0}),reset:vi.fn()})}))

const context={crossings:[],oort:{inner_extent_au:[2000,5000],outer_extent_au:[10000,100000]}} as unknown as BeyondContext
const host=()=>({append:vi.fn(),getBoundingClientRect:()=>({width:1440,height:900,left:0,top:0}),closest:()=>null}) as unknown as HTMLElement
beforeEach(()=>{
 vi.clearAllMocks();mocks.renderers=0
 vi.stubGlobal('devicePixelRatio',1)
 vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn())
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}})
 vi.stubGlobal('MutationObserver',class{observe(){}disconnect(){}})
})
it('does not allocate a renderer for an already aborted scene lifetime',async()=>{
 const scene=new BeyondScene(host()),controller=new AbortController();controller.abort()
 await expect(scene.initialize(context,null,controller.signal)).rejects.toThrow()
 expect(mocks.renderers).toBe(0);expect(scene.diagnostics().ready).toBe(false)
})
it('never revives a disposed scene when pending shader preparation completes',async()=>{
 let complete!:(value:unknown)=>void;mocks.prepare.mockImplementation(()=>new Promise(resolve=>{complete=resolve}))
 const scene=new BeyondScene(host()),ready=scene.initialize(context,null)
 scene.dispose();complete({state:'ready',supported:true,materials:1,milliseconds:1});await ready
 expect(scene.diagnostics().disposed).toBe(true);expect(scene.diagnostics().ready).toBe(false)
 expect(scene.diagnostics().ownedResources).toBe(0);expect(mocks.render).not.toHaveBeenCalled();expect(mocks.disposeRenderer).toHaveBeenCalledTimes(1)
 scene.dispose();expect(mocks.disposeRenderer).toHaveBeenCalledTimes(1)
})
it('aborts preparation and releases the renderer when the owner signal is cancelled',async()=>{
 let complete!:(value:unknown)=>void;mocks.prepare.mockImplementation(()=>new Promise(resolve=>{complete=resolve}))
 const scene=new BeyondScene(host()),controller=new AbortController(),ready=scene.initialize(context,null,controller.signal)
 controller.abort();complete({state:'aborted'});await ready
 expect(scene.diagnostics().disposed).toBe(true);expect(scene.diagnostics().independentAnimationLoops).toBe(0)
 expect(mocks.release).toHaveBeenCalledTimes(1);expect(mocks.render).not.toHaveBeenCalled()
})
it('hides planets for independent historical comparison and mismatched event epochs',async()=>{
 mocks.prepare.mockResolvedValue({state:'ready'})
 const source={...context,crossings:[{id:'voyager1-heliopause',mission_id:'voyager1',observed:{date:'2012-08-25'},geometry:{epoch:'2012-08-25T12:00:00.000Z',position:[-20,113,48],quality:'predicted',source_manifest_sha256:'a'.repeat(64)}}]} as unknown as BeyondContext
 const snapshot={epoch:'2012-08-25T12:00:00.000Z',bodies:[],source:{id:'fixture'}} as unknown as SolarSnapshot
 const scene=new BeyondScene(host());await scene.initialize(source,snapshot)
 scene.setView('voyager1');expect(scene.diagnostics().planetsVisible).toBe(true)
 scene.setView('comparison');expect(scene.diagnostics().planetsVisible).toBe(false)
 scene.setView('voyager1');scene.setSnapshot({...snapshot,epoch:'2018-11-05T12:00:00.000Z'});expect(scene.diagnostics().planetsVisible).toBe(false)
 expect(scene.diagnostics().crossings[0].position).toEqual([-20,113,48]);expect(source.crossings[0].geometry!.position).toEqual([-20,113,48])
 scene.dispose()
})
it('keeps a panned camera inside the serializable domain without changing its view offset',async()=>{
 mocks.prepare.mockResolvedValue({state:'ready'})
 const scene=new BeyondScene(host());await scene.initialize(context,null)
 const pose={position:[900000,-800000,100000],target:[100000,-800000,100000],up:[0,0,1],radius:100000} as const
 expect(scene.restoreCamera(JSON.parse(JSON.stringify(pose)))).toBe(true)
 mocks.pan!([250000,-400000,1200000])
 const camera=scene.getCamera()
 for(const [i,value] of [1000000-1e-6,-1000000+1e-6,1000000-1e-6].entries())expect(camera.position[i]).toBeCloseTo(value,7)
 expect(camera.target[0]).toBeCloseTo(200000-1e-6,7)
 expect(camera.position.map((v,i)=>v-camera.target[i])).toEqual([800000,0,0]);expect(scene.diagnostics().domainClamps).toBe(1)
 expect(scene.restoreCamera(camera)).toBe(true);expect(scene.getCamera()).toEqual(camera)
 scene.dispose()
})
