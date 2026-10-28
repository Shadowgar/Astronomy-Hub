import * as T from 'three'
import {ringUniforms,ringShadowGlsl,ownRingProfile} from './solarRings'
export {ringMaterial} from './solarRings'
export {atmosphereMaterial} from './solarAtmosphere'

const lightUniforms=()=>({sunDirection:{value:new T.Vector3(1,0,0)}})
/** Light is computed from authoritative double-precision positions BEFORE any
 * render-origin shift. This deliberately contains no ephemeris or clock. */
export function setSolarMaterialLight(material:any,bodyPosition:readonly number[],sunPosition:readonly number[]){
 if([...bodyPosition,...sunPosition].some(v=>!Number.isFinite(v)))throw Error('Non-finite solar lighting vector')
 if(material.uniforms?.sunDirection){
  const value=material.uniforms.sunDirection.value
  value.set(sunPosition[0]-bodyPosition[0],sunPosition[1]-bodyPosition[1],sunPosition[2]-bodyPosition[2])
  if(value.lengthSq()>0)value.normalize()
 }
}

// Optical styling only: no solar activity, weather, terrain or photometric model.
const noise=`
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.0,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec3(7.1,1.2,5.3);a*=.5;}return v;}`
const surfaceVertex=`
#include <common>
#include <logdepthbuf_pars_vertex>
uniform vec3 sunDirection;
varying vec2 vUv;varying vec3 vLocal,vNormal,vEye,vSun,vRadial;
void main(){vUv=uv;vLocal=normalize(position);vec4 mvPosition=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vEye=-mvPosition.xyz;vSun=mat3(viewMatrix)*sunDirection;vRadial=normalize(mat3(modelMatrix)*position);gl_Position=projectionMatrix*mvPosition;
#include <logdepthbuf_vertex>
}`
const surfaceFragmentHeader=`
#include <common>
#include <logdepthbuf_pars_fragment>
`
export function sunMaterial(){return new T.ShaderMaterial({vertexShader:surfaceVertex,
 fragmentShader:`${surfaceFragmentHeader}varying vec3 vLocal;varying vec3 vNormal;varying vec3 vEye;${noise}
 void main(){
 #include <logdepthbuf_fragment>
 vec3 p=normalize(vLocal);float mu=max(0.,dot(normalize(vNormal),normalize(vEye)));
 float cells=fbm(p*34.);float footprint=max(length(dFdx(p*130.)),length(dFdy(p*130.)));float grain=mix(noise(p*130.),.5,smoothstep(.4,1.3,footprint));float network=smoothstep(.22,.72,cells*.65+grain*.35);
 vec3 color=mix(vec3(.95,.18,.025),vec3(3.2,1.25,.22),network);
 color*=.4+.6*pow(mu,.4);gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
})}
export function coronaMaterial(){return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
 vertexShader:`
 #include <common>
 #include <logdepthbuf_pars_vertex>
 varying vec2 vUv;void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
 #include <logdepthbuf_vertex>
 }`,
 fragmentShader:`${surfaceFragmentHeader}varying vec2 vUv;${noise}void main(){
 #include <logdepthbuf_fragment>
 vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x),d=max(0.,r-.286);
 float stream=fbm(vec3(cos(a)*12.,sin(a)*12.,r*3.));float narrow=exp(-d*62.)*.65;
 float veil=exp(-d*(12.+stream*14.))*(.18+stream*.7);float outer=exp(-d*5.)*.12;
 float alpha=(narrow+veil+outer)*smoothstep(.275,.29,r)*(1.-smoothstep(.8,1.,r));gl_FragColor=vec4(mix(vec3(1.,.34,.065),vec3(1.,.7,.32),exp(-d*24.)),alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
})}
export function earthMaterial(){return new T.ShaderMaterial({uniforms:{...lightUniforms(),map:{value:null},hasMap:{value:false},cloudMap:{value:null},hasCloudMap:{value:false}},vertexShader:surfaceVertex,
 fragmentShader:`${surfaceFragmentHeader}uniform sampler2D map,cloudMap;uniform bool hasMap,hasCloudMap;varying vec2 vUv;varying vec3 vNormal;varying vec3 vEye;varying vec3 vSun;
 void main(){
 #include <logdepthbuf_fragment>
 vec3 n=normalize(vNormal),l=normalize(vSun),e=normalize(vEye),albedo=hasMap?texture2D(map,vUv).rgb:vec3(.02,.08,.16);
 float day=max(0.,dot(n,l)),rim=pow(1.-max(0.,dot(n,e)),3.);float ocean=smoothstep(.015,.12,albedo.b-max(albedo.r,albedo.g));
 float cloudShade=hasCloudMap?exp(-texture2D(cloudMap,vUv).r*.7):1.;
 vec3 color=albedo*(.008+1.65*pow(day,.8)*cloudShade);float spec=pow(max(0.,dot(n,normalize(l+e))),70.)*ocean*day;
 color+=vec3(.46,.65,.8)*spec*.38; color+=vec3(.045,.20,.48)*rim*smoothstep(-.15,.45,dot(n,l))*.65;
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
})}
export function cloudsMaterial(){return new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{...lightUniforms(),map:{value:null}},vertexShader:surfaceVertex,
 fragmentShader:`${surfaceFragmentHeader}uniform sampler2D map;varying vec2 vUv;varying vec3 vNormal;varying vec3 vSun;
 void main(){
 #include <logdepthbuf_fragment>
 float density=texture2D(map,vUv).r;float day=max(0.,dot(normalize(vNormal),normalize(vSun)));vec3 color=vec3(.9,.96,1.)*(.008+1.6*pow(day,.8));gl_FragColor=vec4(color,1.-exp(-pow(density,1.5)*2.2));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
})}
// A bounded, static procedural backdrop, disclosed as illustrative. Per-fragment
// sampling avoids visible triangles when a close-up changes the background view.
export function backgroundMaterial(){return new T.ShaderMaterial({side:T.BackSide,depthWrite:false,
 vertexShader:`
 #include <common>
 #include <logdepthbuf_pars_vertex>
 varying vec3 vDirection;void main(){vDirection=position;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
 #include <logdepthbuf_vertex>
 }`,
 fragmentShader:`${surfaceFragmentHeader}varying vec3 vDirection;${noise}void main(){
 #include <logdepthbuf_fragment>
 vec3 d=normalize(vDirection);
 float band=exp(-pow((d.z+.3*d.x-.1)*3.8,2.));float fog=fbm(d*11.);float dust=smoothstep(.36,.75,fbm(d*37.));
 float structure=band*smoothstep(.28,.7,fog)*(.18+dust*.82);
 vec3 color=vec3(.001,.002,.004)+mix(vec3(.024,.038,.072),vec3(.068,.039,.023),fog)*structure*.32;
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
})}
export function starsMaterial(pixelRatio:number){return new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,uniforms:{pixelRatio:{value:pixelRatio}},
 vertexShader:`
 #include <common>
 #include <logdepthbuf_pars_vertex>
 attribute float pointSize;uniform float pixelRatio;varying vec3 vColor;void main(){vColor=color;gl_PointSize=pointSize*pixelRatio;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
 #include <logdepthbuf_vertex>
 }`,
 fragmentShader:`${surfaceFragmentHeader}varying vec3 vColor;void main(){
 #include <logdepthbuf_fragment>
 float r=length(gl_PointCoord-.5)*2.;float a=1.-smoothstep(.1,1.,r);gl_FragColor=vec4(vColor,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
})}
/** Source UV textures when available, bounded procedural fallback otherwise.
 * Orientation, optical coefficients and missing-data detail remain illustrative. */
export function planetMaterial(id:string){
 const palettes:Record<string,[string,string,number]>={mercury:['#756b60','#bbb4a5',0],venus:['#a97c45','#f3d7a0',1],jupiter:['#81563d','#ead4af',2],saturn:['#9b8155','#e9d6a3',3],uranus:['#53aeb8','#b5e1df',4],neptune:['#183f9a','#4b7cca',5]}
 const [dark,light,kind]=palettes[id]||palettes.mercury
 const material=new T.ShaderMaterial({name:`SolarPlanet:${id}`,defines:id==='saturn'?{SATURN_RINGS:1}:{},uniforms:{...lightUniforms(),...(id==='saturn'?ringUniforms():{}),ringNormal:{value:new T.Vector3(0,-Math.sin(.48),Math.cos(.48))},map:{value:null},hasMap:{value:false},dark:{value:new T.Color(dark)},light:{value:new T.Color(light)},kind:{value:kind}},vertexShader:surfaceVertex,
 fragmentShader:`${surfaceFragmentHeader}uniform sampler2D map;uniform bool hasMap;uniform vec3 dark,light,sunDirection,ringNormal;uniform float kind;varying vec2 vUv;varying vec3 vLocal,vNormal,vEye,vSun,vRadial;${noise}
 #ifdef SATURN_RINGS
 ${ringShadowGlsl}
 #endif
 void main(){
 #include <logdepthbuf_fragment>
 vec3 p=normalize(vLocal);float rough=fbm(p*22.);float latitude=p.y;
 float bands=.5+.5*sin(latitude*65.+fbm(p*5.)*2.);float value=rough;
 if(kind>1.5&&kind<3.5)value=mix(rough,bands,.7);
 if(kind>.5&&kind<1.5)value=.55+fbm(p*7.)*.35;
 if(kind>3.5)value=.65+sin(latitude*25.)*.035+rough*.06;
 vec3 albedo=hasMap?texture2D(map,vUv).rgb:mix(dark,light,value);
 vec3 n=normalize(vNormal),l=normalize(vSun),eye=normalize(vEye);float day=max(0.,dot(n,l)),mu=max(.001,dot(n,eye)),shadow=1.;
 #ifdef SATURN_RINGS
 shadow=ringShadow(normalize(vRadial),normalize(sunDirection),normalize(ringNormal));
 #endif
 // Mixed Lambert / Lommel-Seeliger disk response, not calibrated photometry.
 float diffuse=kind<.5?mix(day,day/max(.001,day+mu),.35):pow(day,.9)*(.65+.35*sqrt(mu));
 vec3 color=albedo*(.008+1.85*diffuse*shadow);gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`})
 return id==='saturn'?ownRingProfile(material):material
}
