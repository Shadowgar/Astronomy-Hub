import * as T from 'three'
import {earthMaterial,cloudsMaterial,atmosphereMaterial,planetMaterial} from '../solar/solarMaterials'

/** Wrap the established Solar appearance; its original heliocentric shader is untouched. */
export function systemMaterial(kind:'earth'|'clouds'|'atmosphere'|'moon'|'planet',id:string){
 const material=kind==='earth'?earthMaterial():kind==='clouds'?cloudsMaterial():kind==='atmosphere'?atmosphereMaterial('#5cafff'):kind==='planet'?planetMaterial(id):new T.ShaderMaterial({
  uniforms:{map:{value:null},hasMap:{value:false}},
  vertexShader:`varying vec2 vUv;varying vec3 vNormal;varying vec3 vSun;
  void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vec3 center=(modelMatrix*vec4(0.,0.,0.,1.)).xyz;vSun=(viewMatrix*vec4(-center,0.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D map;uniform bool hasMap;varying vec2 vUv;varying vec3 vNormal;varying vec3 vSun;
  void main(){vec4 tex=hasMap?texture2D(map,vUv):vec4(.35,.35,.35,1.);vec3 albedo=mix(vec3(.35),tex.rgb,tex.a);
  float day=max(0.,dot(normalize(vNormal),normalize(vSun)));gl_FragColor=vec4(albedo*day*1.4,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`
 })
 material.uniforms.sourceSun={value:new T.Vector3(1,0,0)}
 material.vertexShader='uniform vec3 sourceSun;\n'+material.vertexShader.replace('vec4(-center,0.)','vec4(sourceSun-center,0.)')
 return material
}
