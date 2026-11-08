import * as T from 'three'
import type {SolarQuality} from './solarPresentation'

type AtmosphereProfile={outer:number;rayleigh:[number,number,number];mie:[number,number,number];heights:[number,number];intensity:number}
// Authored optical visualization profiles in normalized body-radius units.
// The giant-planet/Venus values are deliberately distinct from Mars dust. Their
// colors, density and shell extents are not measured weather, chemistry or a
// qualified atmosphere model; only the solar lighting direction is scientific.
const profiles:Record<string,AtmosphereProfile>={
 earth:{outer:1.018,rayleigh:[36.95,86.5,211.7],mie:[24,24,24],heights:[.001256,.000188],intensity:13},
 mars:{outer:1.01,rayleigh:[.2,.5,1.4],mie:[3.8,2.4,1.3],heights:[.0032,.0032],intensity:9},
 venus:{outer:1.035,rayleigh:[3,5,9],mie:[17,14,9],heights:[.003,.0022],intensity:10},
 jupiter:{outer:1.006,rayleigh:[13,21,34],mie:[21,18,14],heights:[.0007,.00045],intensity:12},
 saturn:{outer:1.01,rayleigh:[10,18,32],mie:[16,13,8],heights:[.0011,.0007],intensity:12},
 uranus:{outer:1.014,rayleigh:[9,30,39],mie:[4,13,16],heights:[.0017,.0009],intensity:12},
 neptune:{outer:1.012,rayleigh:[8,22,49],mie:[3,7,18],heights:[.0013,.0007],intensity:12},
}
const profileFor=(body:string)=>Object.hasOwn(profiles,body)?profiles[body]:null
export const atmosphereShellRatio=(body:string):number|null=>profileFor(body)?.outer??null
export const atmosphereForBody=(body:string)=>{const profile=profileFor(body);return profile?createAtmosphere(body,profile):null}

/** Bounded spherical single-scattering approximation. The density profile and
 * Earth Rayleigh coefficients are conventional visual-model inputs, not current
 * weather or a validated atmospheric science output. Mars dust is illustrative.
 * Uses the same source-derived Sun direction as the surface; no ephemeris model.
 * Inspired by Solar Wanderer's MIT Nishita implementation; see source receipt. */
export function atmosphereMaterial(_color:string,earth=true){
 return createAtmosphere(earth?'earth':'mars',profiles[earth?'earth':'mars'])
}
function createAtmosphere(body:string,profile:AtmosphereProfile){
 const material=new T.ShaderMaterial({name:`SolarScattering:${body}`,transparent:true,depthWrite:false,side:T.FrontSide,
  uniforms:{sunDirection:{value:new T.Vector3(1,0,0)},outerRadius:{value:profile.outer},betaR:{value:new T.Vector3(...profile.rayleigh)},betaM:{value:new T.Vector3(...profile.mie)},scaleHeight:{value:new T.Vector2(...profile.heights)},viewSamples:{value:10},lightSamples:{value:4},sunIntensity:{value:profile.intensity}},
  vertexShader:`
   #include <common>
   #include <logdepthbuf_pars_vertex>
   uniform float outerRadius;uniform vec3 sunDirection;
   varying vec3 vCamera,vShell,vLight;
   void main(){
    vec3 relative=mat3(modelViewMatrix)*position;
    float bodyRadius=length(relative)/outerRadius;
    vCamera=-(modelViewMatrix*vec4(0.,0.,0.,1.)).xyz/max(bodyRadius,1e-20);
    vShell=normalize(relative)*outerRadius;vLight=mat3(viewMatrix)*sunDirection;
    vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
    #include <logdepthbuf_vertex>
   }`,
  fragmentShader:`
   #include <common>
   #include <logdepthbuf_pars_fragment>
   uniform float outerRadius,sunIntensity;uniform vec3 betaR,betaM;uniform vec2 scaleHeight;uniform int viewSamples,lightSamples;
   varying vec3 vCamera,vShell,vLight;
   vec2 sphereHit(vec3 origin,vec3 ray,float radius){
    float b=dot(origin,ray),d=b*b-dot(origin,origin)+radius*radius;
    if(d<0.)return vec2(1e10,-1e10);
    float root=sqrt(d);return vec2(-b-root,-b+root);
   }
   vec2 density(vec3 position){return exp(-max(0.,length(position)-1.)/scaleHeight);}
   void main(){
    #include <logdepthbuf_fragment>
    vec3 ray=normalize(vShell-vCamera),sun=normalize(vLight);
    vec2 shell=sphereHit(vCamera,ray,outerRadius),ground=sphereHit(vCamera,ray,1.);
    float entry=max(0.,shell.x),exitDistance=shell.y;
    if(ground.x>0.)exitDistance=min(exitDistance,ground.x);
    if(exitDistance<=entry)discard;
    float stepLength=(exitDistance-entry)/float(viewSamples);
    vec2 opticalDepth=vec2(0.);vec3 sumR=vec3(0.),sumM=vec3(0.);
    for(int i=0;i<16;i++){
     if(i>=viewSamples)break;
     vec3 point=vCamera+ray*(entry+(float(i)+.5)*stepLength);
     vec2 rho=density(point);opticalDepth+=rho*stepLength;
     vec2 shadow=sphereHit(point,sun,1.);
     if(shadow.x>0.&&shadow.x<shadow.y)continue;
     float lightStep=max(0.,sphereHit(point,sun,outerRadius).y)/float(lightSamples);
     vec2 sunDepth=vec2(0.);
     for(int j=0;j<6;j++){
      if(j>=lightSamples)break;
      sunDepth+=density(point+sun*(float(j)+.5)*lightStep)*lightStep;
     }
     vec2 total=opticalDepth+sunDepth;
     vec3 transmittance=exp(-(betaR*total.x+betaM*total.y));
     sumR+=transmittance*rho.x*stepLength;sumM+=transmittance*rho.y*stepLength;
    }
    float cosine=dot(ray,sun),phaseR=3./(16.*PI)*(1.+cosine*cosine),g=.76;
    float phaseM=(1.-g*g)/(4.*PI*pow(max(.001,1.+g*g-2.*g*cosine),1.5));
    vec3 scattering=sunIntensity*(betaR*sumR*phaseR+betaM*sumM*phaseM);
    vec3 trans=exp(-(betaR*opticalDepth.x+betaM*opticalDepth.y));
    float alpha=clamp(1.-(trans.r+trans.g+trans.b)/3.,0.,1.);
    gl_FragColor=vec4(scattering/max(alpha,.0001),alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 })
 material.userData.body=body;material.userData.calibration='illustrative; not measured atmospheric conditions'
 return material
}

export function setAtmosphereQuality(material:any,quality:SolarQuality){
 if(!material.uniforms?.viewSamples)return
 material.uniforms.viewSamples.value=quality==='detailed'?16:quality==='balanced'?10:6
 material.uniforms.lightSamples.value=quality==='detailed'?6:quality==='balanced'?4:2
}
