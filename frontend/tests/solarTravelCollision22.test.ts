import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import * as T from 'three'
import {SolarCameraController} from '../src/features/solar/SolarCameraController'
import {focusPose,physicalRadii,visualRadius} from '../src/features/solar/solarPresentation'
import {validateSnapshot} from '../src/features/solar/solarContracts'
import fixture from './fixtures/solarTravel22-source.json'

// Real fixed-epoch Docker API vectors, not invented production positions.
// Trajectories are omitted because this regression exercises paused-time travel.
const snapshot=validateSnapshot(fixture.snapshot)
const sourceBefore=JSON.stringify(snapshot),radii=physicalRadii(snapshot)
const bodies=snapshot.bodies.map(body=>({
 position:body.position_au,radius:radii[body.source_id],
 clearanceAU:body.source_id==='earth'?1000/(snapshot.km_per_au*1000):undefined,
}))
const journeys=snapshot.bodies.flatMap(from=>snapshot.bodies.filter(to=>to!==from).map(to=>({from,to})))
function freeze(value:unknown){if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child)}}
freeze(snapshot)

class Canvas extends EventTarget{
 style={touchAction:''}
 ownerDocument=new EventTarget()
 clientWidth=1440
 clientHeight=900
 getRootNode(){return this.ownerDocument}
}

beforeEach(()=>{vi.stubGlobal('window',new EventTarget());vi.spyOn(performance,'now').mockReturnValue(1000)})
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()})

describe('source-backed physical close-up travel at 60 Hz',()=>{
 it('retains the qualified epoch/frame/source and all 72 ordered journeys',()=>{
  expect(snapshot.epoch).toBe('2026-10-27T04:00:00Z')
  expect(snapshot.frame).toBe('ICRF')
  expect(snapshot.origin).toBe('Sun center (10)')
  expect(snapshot.source.sha256).toBe('54d97562a5b094d298b1b8eafa5a2e17e3e010ce85e1a366d07f003ad159323c')
  expect(journeys).toHaveLength(72)
 })
 it.each(journeys)('$from.source_id to $to.source_id arrives without bypassing physical collisions',({from,to})=>{
  const source=focusPose(radii,from.source_id,from.position_au,1.6,true)
  const destination=focusPose(radii,to.source_id,to.position_au,1.6,true)
  const camera=new T.PerspectiveCamera(42,1.6,.001,2000)
  camera.up.set(.15,0,1)
  const controller=new SolarCameraController(camera,new Canvas() as unknown as HTMLCanvasElement,()=>bodies,()=>{},()=>{})
  const minimum=(id:string)=>id==='earth'?radii.earth+1000/(snapshot.km_per_au*1000):visualRadius(radii,id)*1.1
  const near=(id:string)=>id==='earth'?100/(snapshot.km_per_au*1000):radii[id]*.02
  try{
   controller.move(source,near(from.source_id),minimum(from.source_id),true)
   controller.move(destination,near(to.source_id),minimum(to.source_id))
   // Exercise the real controller, OrbitControls and swept-sphere guard. Do not
   // replace collision handling or snap to the requested endpoint in the test.
   for(let frame=1;frame<=300;frame++){
    controller.tick(1000+frame*1000/60)
    for(const body of bodies){
     const safeRadius=body.radius+(body.clearanceAU??body.radius*.02)
     expect(camera.position.distanceTo(new T.Vector3(...body.position))).toBeGreaterThanOrEqual(safeRadius-body.radius*1e-8)
    }
   }
   expect(controller.animating).toBe(false)
   expect(camera.position.distanceTo(new T.Vector3(...destination.position))).toBeLessThan(radii[to.source_id]*1e-5)
   expect(controller.controls.target.distanceTo(new T.Vector3(...to.position_au))).toBeLessThan(radii[to.source_id]*1e-5)
   expect(JSON.stringify(snapshot)).toBe(sourceBefore)
  }finally{controller.dispose()}
 })
})
