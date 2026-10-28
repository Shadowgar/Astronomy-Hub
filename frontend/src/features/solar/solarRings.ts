import * as T from 'three'

// NASA NSSDCA Saturnian Rings Fact Sheet, updated 2022-04-19:
// https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html
// Broad edges / optical-depth ranges are source-backed. Fine radial structure,
// colors and phase function are a visualization, not a measured occultation.
export const SATURN_MEAN_RADIUS_KM=58232
export const SATURN_RING_INNER_KM=74658
export const SATURN_RING_OUTER_KM=140180
export const SATURN_RING_INNER_RATIO=SATURN_RING_INNER_KM/SATURN_MEAN_RADIUS_KM
export const SATURN_RING_OUTER_RATIO=SATURN_RING_OUTER_KM/SATURN_MEAN_RADIUS_KM

export function saturnRingProfile(radiusKm:number){
 let opticalDepth=0,brightness=.4
 const detail=.5+.24*Math.sin(radiusKm*.019)+.16*Math.sin(radiusKm*.047)+.1*Math.sin(radiusKm*.113)
 if(radiusKm>=74658&&radiusKm<91975){opticalDepth=.08+.18*detail;brightness=.38+.13*detail}
 else if(radiusKm>=91975&&radiusKm<117507){opticalDepth=.65+1.65*detail;brightness=.7+.23*detail}
 else if(radiusKm>=117507&&radiusKm<122340){opticalDepth=.018+.045*detail;brightness=.4}
 else if(radiusKm>=122340&&radiusKm<=136780){opticalDepth=.45+.5*detail;brightness=.61+.24*detail}
 // Published gap inner edges; widths are schematic at this display resolution.
 if((radiusKm>=133410&&radiusKm<133735)||(radiusKm>=136487&&radiusKm<136529))opticalDepth*=.04
 if(radiusKm>=139826&&radiusKm<=140080){opticalDepth=.1*Math.sin((radiusKm-139826)/254*Math.PI);brightness=.83}
 return{opticalDepth,color:[brightness,brightness*.91,brightness*.76] as [number,number,number]}
}
export const ringTransmission=(opticalDepth:number,incidenceCosine:number)=>Math.exp(-Math.max(0,opticalDepth)/Math.max(.025,Math.abs(incidenceCosine)))

/** RGB is illustrative sRGB albedo; alpha encodes tau/3, not transparency. */
export function createSaturnRingProfile(){
 const width=4096,data=new Uint8Array(width*4)
 for(let i=0;i<width;i++){
  const sample=saturnRingProfile(SATURN_RING_INNER_KM+i/(width-1)*(SATURN_RING_OUTER_KM-SATURN_RING_INNER_KM))
  for(let c=0;c<3;c++)data[4*i+c]=Math.round(sample.color[c]*255)
  data[4*i+3]=Math.round(sample.opticalDepth/3*255)
 }
 const texture=new T.DataTexture(data,width,1,T.RGBAFormat)
 // Rings span only tens of radial pixels at overview distance. A 4096-sample
 // unmipmapped strip aliases into moving concentric moire; trilinear mip levels
 // integrate the subpixel radial structure while retaining broad ring/gap edges.
 texture.colorSpace=T.SRGBColorSpace;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true
 return texture
}

export function ringUniforms(){return{ringProfile:{value:createSaturnRingProfile()},ringInner:{value:SATURN_RING_INNER_RATIO},ringOuter:{value:SATURN_RING_OUTER_RATIO}}}
export function ownRingProfile(material:any){material.addEventListener('dispose',()=>material.uniforms.ringProfile.value.dispose());return material}

// The ray-plane optical-depth calculation is shared by the Saturn surface and
// ring shaders; source body-center vectors never enter GPU precision arithmetic.
export const ringShadowGlsl=`
 uniform sampler2D ringProfile;
 uniform float ringInner,ringOuter;
 float radialDepth(float radius){
  float u=(radius-ringInner)/(ringOuter-ringInner);
  float tau=texture2D(ringProfile,vec2(clamp(u,0.,1.),.5)).a*3.0;
  return tau*step(0.,u)*step(u,1.);
 }
 float ringShadow(vec3 position,vec3 toSun,vec3 ringNormal){
  float incidence=dot(toSun,ringNormal);
  if(abs(incidence)<.0001)return 1.0;
  float distance=-dot(position,ringNormal)/incidence;
  vec3 hit=position+distance*toSun;
  // Sample before masking the night-side intersection so texture derivatives
  // remain defined for mip selection across the illuminated shadow boundary.
  float transmission=exp(-radialDepth(length(hit))/max(.025,abs(incidence)));
  return distance>0.?transmission:1.;
 }`

/** RingGeometry lies in local XY and uses radii in body-mean-radius units.
 * Adapted conceptually from MIT Solar Wanderer's particle-layer scattering and
 * sphere occlusion. See docs/validation/solar-system-2/GRAPHICS.md and the retained
 * frontend/public/licenses/solar-wanderer-MIT.txt license. */
export function ringMaterial(){
 return ownRingProfile(new T.ShaderMaterial({name:'SolarSaturnRadialRings',transparent:true,side:T.DoubleSide,forceSinglePass:true,depthWrite:false,
  uniforms:{...ringUniforms(),sunDirection:{value:new T.Vector3(1,0,0)},radialMap:{value:null},hasRadialMap:{value:false},mapInner:{value:SATURN_RING_INNER_RATIO},mapOuter:{value:SATURN_RING_OUTER_RATIO}},
  vertexShader:`
   #include <common>
   #include <logdepthbuf_pars_vertex>
   varying vec3 vRelative,vRingNormal,vEye;varying float vRadius;
   void main(){
    float scale=length(modelMatrix[0].xyz);
    vRelative=mat3(modelMatrix)*position/max(scale,1e-20);
    vRingNormal=normalize(mat3(modelMatrix)*vec3(0.,0.,1.));vRadius=length(position.xy);
    vec4 world=modelMatrix*vec4(position,1.);vEye=cameraPosition-world.xyz;
    vec4 mvPosition=modelViewMatrix*vec4(position,1.);
    gl_Position=projectionMatrix*mvPosition;
    #include <logdepthbuf_vertex>
   }`,
  fragmentShader:`
   #include <common>
   #include <logdepthbuf_pars_fragment>
   uniform vec3 sunDirection;uniform sampler2D radialMap;uniform bool hasRadialMap;uniform float mapInner,mapOuter;
   varying vec3 vRelative,vRingNormal,vEye;varying float vRadius;
   ${ringShadowGlsl}
   void main(){
    #include <logdepthbuf_fragment>
    float u=(vRadius-ringInner)/(ringOuter-ringInner);
    vec4 profile=texture2D(ringProfile,vec2(u,.5));float tau=profile.a*3.;
    if(tau<.001)discard;
    vec3 normal=normalize(vRingNormal),light=normalize(sunDirection),eye=normalize(vEye);
    float mu=max(.025,abs(dot(normal,eye))),mu0=max(.025,abs(dot(normal,light)));
    float phaseCos=clamp(dot(eye,light),-1.,1.);
    bool sameSide=dot(normal,eye)*dot(normal,light)>0.;
    float reflected=mu0/(mu+mu0)*(1.-exp(-tau*(1./mu+1./mu0)));
    // Transmission through a particle layer, evaluated stably when mu≈mu0.
    float a=1./mu,b=1./mu0;
    float transmitted=abs(a-b)<.01?tau*a*exp(-tau*a):abs((exp(-tau*a)-exp(-tau*b))/(a-b))*b;
    float backscatter=.65+.35*phaseCos;
    float opposition=1.+.3*exp(-36.*(1.-phaseCos));
    float forward=.18+.85*pow(max(0.,-phaseCos),5.);
    float scatter=sameSide?reflected*backscatter*opposition:transmitted*forward;
    float behind=dot(vRelative,light),separation=length(vRelative-light*behind);
    float shadow=behind<0.?smoothstep(.985,1.015,separation):1.;
    vec3 albedo=profile.rgb;
    if(hasRadialMap)albedo=texture2D(radialMap,vec2(clamp((vRadius-mapInner)/(mapOuter-mapInner),0.,1.),.5)).rgb;
    // A small disclosed ambient term preserves silhouettes; no second light.
    gl_FragColor=vec4(albedo*(.006+2.8*scatter*shadow),1.-exp(-tau/mu));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 }))
}
