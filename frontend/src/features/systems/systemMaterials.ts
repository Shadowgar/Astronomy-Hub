import * as T from 'three'
import {earthMaterial,cloudsMaterial,atmosphereMaterial,planetMaterial,setSolarMaterialLight} from '../solar/solarMaterials'

/** Reuse appearance through explicit lighting uniforms, never shader text patches. */
export function systemMaterial(kind:'earth'|'clouds'|'atmosphere'|'moon'|'planet',id:string){
 const material=kind==='earth'?earthMaterial():kind==='clouds'?cloudsMaterial():kind==='atmosphere'?atmosphereMaterial('#5cafff'):kind==='planet'&&id!=='mars'?planetMaterial(id):new T.ShaderMaterial({
  uniforms:{map:{value:null},hasMap:{value:false},sunDirection:{value:new T.Vector3(1,0,0)}},
  vertexShader:`uniform vec3 sunDirection;varying vec2 vUv;varying vec3 vNormal;varying vec3 vSun;
  void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vSun=mat3(viewMatrix)*sunDirection;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D map;uniform bool hasMap;varying vec2 vUv;varying vec3 vNormal;varying vec3 vSun;
  void main(){vec4 tex=hasMap?texture2D(map,vUv):vec4(.35,.35,.35,1.);vec3 albedo=mix(vec3(.35),tex.rgb,tex.a);
  float day=max(0.,dot(normalize(vNormal),normalize(vSun)));gl_FragColor=vec4(albedo*day*1.4,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`
 })
 // The local-system renderer has no Saturn ring geometry. Shared Solar shadow
 // features must not cast an invisible ring's shadow in this separate runtime.
 if(kind==='planet'&&id==='saturn')delete material.defines.SATURN_RINGS
 return material
}

/** Both vectors use the scientific parent-centered ICRF kilometre frame.
 * Subtract before normalization; display enlargement and scene-unit conversion
 * never alter the illumination direction of a parent or an individual moon. */
export function updateSystemMaterialLight(material:any,bodyPositionKm:readonly number[],sunPositionKm:readonly number[]){
 setSolarMaterialLight(material,bodyPositionKm,sunPositionKm)
}

/** Adopt the pinned model's original atlas and matching UV geometry, never its normal map as terrain. */
export function installMarsModel(gltf:any,target:any,radius:number,keep:(resource:any)=>any,disposed:boolean):boolean{
 const meshes:any[]=[],resources=new Set<any>()
 gltf.scene.traverse((node:any)=>{if(!node.isMesh)return;meshes.push(node);resources.add(node.geometry)
  for(const material of Array.isArray(node.material)?node.material:[node.material]){resources.add(material);for(const value of Object.values(material))if((value as any)?.isTexture)resources.add(value)}
 })
 const release=()=>{for(const resource of resources)resource.dispose()}
 if(disposed){release();return false}
 const node=meshes[0],geometry=node?.geometry,map=node?.material?.map
 geometry?.computeBoundingSphere()
 if(meshes.length!==1||!map?.isTexture||!geometry?.attributes.position||!geometry.attributes.uv||geometry.attributes.position.count!==geometry.attributes.uv.count||!Number.isFinite(radius)||radius<=0||!Number.isFinite(geometry.boundingSphere?.radius)||geometry.boundingSphere.radius<=0){release();throw Error('Invalid Mars model')}
 const scale=radius/geometry.boundingSphere.radius
 geometry.scale(scale,scale,scale)
 const material=new T.MeshStandardMaterial({map,roughness:.95,metalness:0})
 for(const resource of resources)keep(resource)
 target.geometry=geometry;target.material=keep(material)
 return true
}
