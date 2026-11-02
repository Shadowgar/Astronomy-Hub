import {expect,it,vi} from 'vitest'
import * as T from 'three'
import {adoptCelestialGeometry,createCelestialBody,setCelestialRingFrame} from '../src/features/celestial/CelestialBody'

const defer=()=>{let resolve!:(x:any)=>void;const promise=new Promise<any>(r=>{resolve=r});return{promise,resolve}}
function original(){const geometry=new T.SphereGeometry(3,12,8),map=new T.Texture(),node=new T.Mesh(geometry,new T.MeshStandardMaterial({map})),scene=new T.Group();node.position.set(2,0,0);scene.add(node);scene.updateMatrixWorld(true);return{node,map,scene}}
it('retains source UV/index and original geometry while normalizing a visualization sphere',()=>{
 const {node}=original(),uv=Array.from(node.geometry.attributes.uv.array),indices=Array.from(node.geometry.index!.array),positions=Array.from(node.geometry.attributes.position.array)
 const geometry=adoptCelestialGeometry(node,1,'visualization-sphere')
 expect(Array.from(geometry.attributes.uv.array)).toEqual(uv);expect(Array.from(geometry.index!.array)).toEqual(indices)
 expect(Array.from(node.geometry.attributes.position.array)).toEqual(positions)
 for(let i=0;i<geometry.attributes.position.count;i++)expect(new T.Vector3().fromBufferAttribute(geometry.attributes.position,i).length()).toBeCloseTo(1,6)
})
it('preserves measured shape COM offsets and physical kilometre dimensions rather than spherical normalization',()=>{
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([14,0,0,-8,0,0,0,5,0,0,0,3],3));geometry.setIndex([0,2,3,0,3,1,0,1,2,1,3,2]);geometry.computeVertexNormals()
 const node=new T.Mesh(geometry,new T.MeshStandardMaterial());node.updateMatrixWorld(true)
 const adopted=adoptCelestialGeometry(node,1,'measured-shape-km',100)
 expect(Array.from(adopted.attributes.position.array)).toEqual(Array.from(new Float32Array([.14,0,0,-.08,0,0,0,.05,0,0,0,.03])))
 expect(adopted.userData.physicalEnvelopeAU).toBeCloseTo(.14,7)
})
function fixture(){
 const model=defer(),abort=new AbortController(),resources=new Set<any>(),request=vi.fn()
 const assets={signal:abort.signal,model:vi.fn(()=>model.promise),texture:vi.fn(()=>new Promise(()=>{}))}
 const body=createCelestialBody({id:'jupiter',radiusAU:1,assets:assets as any,keep:(r:any)=>{resources.add(r);return r},request,sourceIdentity:{target:'599',origin:'599',frame:'ICRF'}})
 return{model,abort,resources,request,body}
}
it('holds detail until matching model UVs arrive and restores overview before detail ownership retires',async()=>{
 const f=fixture(),detail=new T.Texture(),source=original();f.body.setDetailMap(detail)
 expect(f.body.mesh.material.uniforms.map.value).toBeNull()
 f.model.resolve({scene:source.scene});await vi.waitFor(()=>expect(f.body.overviewReady).toBe(true))
 expect(f.body.mesh.material.uniforms.map.value).toBe(detail)
 const disposed=vi.fn();detail.addEventListener('dispose',disposed);f.body.setDetailMap(null)
 expect(f.body.mesh.material.uniforms.map.value).toBe(source.map);expect(disposed).not.toHaveBeenCalled()
 expect(f.body.sourceIdentity).toEqual({target:'599',origin:'599',frame:'ICRF'})
})
it('does not mutate meshes or request a frame after its owner is aborted',async()=>{
 const f=fixture(),old=f.body.mesh.geometry;f.abort.abort();f.model.resolve({scene:original().scene})
 await Promise.resolve();await Promise.resolve();expect(f.body.mesh.geometry).toBe(old);expect(f.request).not.toHaveBeenCalled();expect(f.body.overviewReady).toBe(false)
})
it('keeps a qualified ring pole independent of surface registration and synchronizes the shadow normal',()=>{
 const abort=new AbortController(),body=createCelestialBody({id:'saturn',radiusAU:1,assets:{signal:abort.signal,model:()=>new Promise(()=>{}),texture:()=>new Promise(()=>{})} as any,keep:(r:any)=>r,request:()=>{},sourceIdentity:{target:'699',origin:'699',frame:'ICRF'}})
 const surface=body.mesh.quaternion.clone(),ring=body.extras.find((m:any)=>m.userData.rings)!,q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),1.2)
 setCelestialRingFrame(body,q)
 expect(ring.quaternion.toArray()).toEqual(q.toArray());expect(body.mesh.quaternion.toArray()).toEqual(surface.toArray())
 expect(body.mesh.material.uniforms.ringNormal.value.distanceTo(new T.Vector3(0,0,1).applyQuaternion(q))).toBeLessThan(1e-12)
})
it('keeps Titan homogeneous before its visible haze source arrives or when it fails',async()=>{
 const failed=defer(),abort=new AbortController(),body=createCelestialBody({id:'titan',radiusAU:1,assets:{signal:abort.signal,model:()=>failed.promise,texture:()=>new Promise(()=>{})} as any,keep:(r:any)=>r,request:()=>{},sourceIdentity:{target:'606',origin:'699',frame:'ICRF'}})
 expect(body.mesh.material.uniforms.dark.value.toArray()).toEqual(body.mesh.material.uniforms.light.value.toArray())
 expect(body.mesh.material.userData.calibration).toMatch(/haze/)
 failed.resolve({scene:{updateMatrixWorld(){},traverse(){}}});await vi.waitFor(()=>expect((body.diagnostics() as any).errors).toHaveLength(1))
 expect(body.overviewReady).toBe(false);expect(body.mesh.material.uniforms.hasMap.value).toBe(false)
})
it.each(['Saturn.001','Saturn001'])('selects pinned Saturn globe %s while retaining separate source ring meshes under asset ownership',async name=>{
 const pending=defer(),abort=new AbortController(),source=original();source.node.name=name
 for(const name of ['RingsTop','RingsBottom']){const ring=new T.Mesh(new T.RingGeometry(4,8),new T.MeshStandardMaterial({map:new T.Texture()}));ring.name=name;source.scene.add(ring)}
 const body=createCelestialBody({id:'saturn',radiusAU:1,assets:{signal:abort.signal,model:()=>pending.promise,texture:()=>new Promise(()=>{})} as any,keep:(r:any)=>r,request:()=>{},sourceIdentity:{target:'699',origin:'699',frame:'ICRF'}})
 pending.resolve({scene:source.scene});await vi.waitFor(()=>expect(body.overviewReady).toBe(true),{timeout:100})
 expect(body.mesh.material.uniforms.map.value).toBe(source.map);expect((body.diagnostics() as any).errors).toEqual([])
})

it.each(['missing','duplicate'])('rejects a %s pinned Saturn globe instead of treating source rings as a planet',async variant=>{
 const pending=defer(),abort=new AbortController(),source=original();source.node.name=variant==='missing'?'RingsTop':'Saturn001'
 if(variant==='duplicate'){const second=source.node.clone();second.name='Saturn.001';source.scene.add(second)}
 const body=createCelestialBody({id:'saturn',radiusAU:1,assets:{signal:abort.signal,model:()=>pending.promise,texture:()=>new Promise(()=>{})} as any,keep:(r:any)=>r,request:()=>{},sourceIdentity:{target:'699',origin:'699',frame:'ICRF'}})
 pending.resolve({scene:source.scene});await vi.waitFor(()=>expect((body.diagnostics() as any).errors).toHaveLength(1));expect(body.overviewReady).toBe(false)
})
