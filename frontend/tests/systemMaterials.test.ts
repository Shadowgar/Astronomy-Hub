import {describe,it,expect} from 'vitest'
import * as T from 'three'
import {readFileSync} from 'node:fs'
import {installMarsModel,systemMaterial} from '../src/features/systems/systemMaterials'

function originalMars(){
 const bytes=readFileSync(new URL('../src/features/solar/assets/mars-nasa.glb',import.meta.url)),jsonLength=bytes.readUInt32LE(12),data=JSON.parse(bytes.subarray(20,20+jsonLength).toString()),binary=bytes.subarray(28+jsonLength)
 const values=(index:number)=>{const a=data.accessors[index],view=data.bufferViews[a.bufferView],start=(view.byteOffset||0)+(a.byteOffset||0),length=a.count*({SCALAR:1,VEC2:2,VEC3:3}[a.type]||0),buffer=binary.subarray(start,start+length*(a.componentType===5126?4:2));return a.componentType===5126?new Float32Array(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.length)):new Uint16Array(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.length))}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(values(0),3));geometry.setAttribute('normal',new T.BufferAttribute(values(1),3));geometry.setAttribute('uv',new T.BufferAttribute(values(2),2));geometry.setIndex(new T.BufferAttribute(values(3),1))
 const map=new T.Texture(),normalMap=new T.Texture(),material=new T.MeshStandardMaterial({map,normalMap}),scene=new T.Group();scene.add(new T.Mesh(geometry,material))
 return{scene,geometry,map,normalMap,material}
}
describe('original Mars asset adoption',()=>{
 it('reuses the actual original atlas UV/index buffers and normalizes only model radius',()=>{
  const source=originalMars(),uv=Array.from(source.geometry.attributes.uv.array),indices=Array.from(source.geometry.index!.array),target=new T.Mesh(new T.SphereGeometry(1),systemMaterial('planet','mars')),position=target.position.set(100,200,300).clone(),resources=new Set<any>()
  expect(installMarsModel(source,target,3.3895,r=>{resources.add(r);return r},false)).toBe(true)
  expect(target.geometry).toBe(source.geometry);expect(Array.from(target.geometry.attributes.uv.array)).toEqual(uv);expect(Array.from(target.geometry.index!.array)).toEqual(indices)
  expect(target.geometry.attributes.position.count).toBe(2034);expect(target.material.map).toBe(source.map);expect(target.material.normalMap).toBeNull()
  target.geometry.computeBoundingSphere();expect(target.geometry.boundingSphere!.radius).toBeCloseTo(3.3895,5);expect(target.position.equals(position)).toBe(true)
  expect(resources.has(source.normalMap)).toBe(true)
 })
 it('releases a late model after disposal without replacing the target or retaining assets',()=>{
  const source=originalMars(),target=new T.Mesh(new T.SphereGeometry(1),systemMaterial('moon','mars')),old=target.geometry;let released=0,retained=0
  for(const resource of [source.geometry,source.material,source.map,source.normalMap])resource.addEventListener('dispose',()=>released++)
  expect(installMarsModel(source,target,3.3895,r=>{retained++;return r},true)).toBe(false)
  expect(target.geometry).toBe(old);expect(retained).toBe(0);expect(released).toBe(4)
 })
 it('rejects missing atlas and extra meshes instead of silently choosing a false appearance',()=>{
  for(const invalid of ['map','mesh']){const source=originalMars(),target=new T.Mesh(new T.SphereGeometry(1),systemMaterial('moon','mars')),old=target.geometry
   if(invalid==='map')source.material.map=null;else source.scene.add(new T.Mesh(new T.SphereGeometry(1),new T.MeshStandardMaterial()))
   expect(()=>installMarsModel(source,target,3.3895,r=>r,false)).toThrow('Invalid Mars model');expect(target.geometry).toBe(old)
  }
 })
 it('uses neutral loading/failure material for Mars without Mercury bands or a false map',()=>{
  const material=systemMaterial('planet','mars')
  expect(material.uniforms.hasMap.value).toBe(false);expect(material.uniforms.map.value).toBeNull();expect(material.uniforms.dark).toBeUndefined()
 })
})
