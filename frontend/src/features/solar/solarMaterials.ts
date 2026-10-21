import * as T from 'three'

// Optical styling only: no solar activity, weather, terrain or photometric model.
const noise=`
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.0,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec3(7.1,1.2,5.3);a*=.5;}return v;}`
const surfaceVertex=`varying vec2 vUv;varying vec3 vLocal;varying vec3 vNormal;varying vec3 vEye;varying vec3 vSun;
void main(){vUv=uv;vLocal=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vEye=-p.xyz;vec3 center=(modelMatrix*vec4(0.,0.,0.,1.)).xyz;vSun=(viewMatrix*vec4(-center,0.)).xyz;gl_Position=projectionMatrix*p;}`
export function sunMaterial(){return new T.ShaderMaterial({vertexShader:surfaceVertex,
 fragmentShader:`varying vec3 vLocal;varying vec3 vNormal;varying vec3 vEye;${noise}
 void main(){vec3 p=normalize(vLocal);float mu=max(0.,dot(normalize(vNormal),normalize(vEye)));
 float cells=fbm(p*34.);float footprint=max(length(dFdx(p*130.)),length(dFdy(p*130.)));float grain=mix(noise(p*130.),.5,smoothstep(.4,1.3,footprint));float network=smoothstep(.22,.72,cells*.65+grain*.35);
 vec3 color=mix(vec3(.72,.12,.008),vec3(1.65,.56,.08),network);
 color*=.25+.75*pow(mu,.4);gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
})}
export function coronaMaterial(){return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;${noise}void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x),d=max(0.,r-.286);
 float stream=fbm(vec3(cos(a)*12.,sin(a)*12.,r*3.));float narrow=exp(-d*62.)*.65;
 float veil=exp(-d*(12.+stream*14.))*(.12+stream*.5);float outer=exp(-d*7.)*.07;
 float alpha=(narrow+veil+outer)*smoothstep(.275,.29,r)*(1.-smoothstep(.8,1.,r));gl_FragColor=vec4(mix(vec3(1.,.34,.065),vec3(1.,.7,.32),exp(-d*24.)),alpha);}`
})}
export function earthMaterial(){return new T.ShaderMaterial({uniforms:{map:{value:null},hasMap:{value:false}},vertexShader:surfaceVertex,
 fragmentShader:`uniform sampler2D map;uniform bool hasMap;varying vec2 vUv;varying vec3 vNormal;varying vec3 vEye;varying vec3 vSun;
 void main(){vec3 n=normalize(vNormal),l=normalize(vSun),e=normalize(vEye),albedo=hasMap?texture2D(map,vUv).rgb:vec3(.02,.08,.16);
 float day=max(0.,dot(n,l)),rim=pow(1.-max(0.,dot(n,e)),3.);float ocean=smoothstep(.015,.12,albedo.b-max(albedo.r,albedo.g));
 vec3 color=albedo*(.018+1.65*pow(day,.8));float spec=pow(max(0.,dot(n,normalize(l+e))),70.)*ocean*day;
 color+=vec3(.46,.65,.8)*spec*.38; color+=vec3(.045,.20,.48)*rim*smoothstep(-.15,.45,dot(n,l))*.65;
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
})}
export function cloudsMaterial(){return new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:null}},vertexShader:surfaceVertex,
 fragmentShader:`uniform sampler2D map;varying vec2 vUv;varying vec3 vNormal;varying vec3 vSun;
 void main(){float density=texture2D(map,vUv).r;float day=max(0.,dot(normalize(vNormal),normalize(vSun)));vec3 color=vec3(.9,.96,1.)*(.022+1.6*pow(day,.8));gl_FragColor=vec4(color,smoothstep(.10,.8,density)*.94);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
})}
export function atmosphereMaterial(color:string,earth=true){return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.BackSide,uniforms:{tint:{value:new T.Color(color)},strength:{value:earth?1.25:.25}},vertexShader:surfaceVertex,
 fragmentShader:`uniform vec3 tint;uniform float strength;varying vec3 vNormal;varying vec3 vEye;varying vec3 vSun;void main(){vec3 n=normalize(vNormal);float edge=abs(dot(n,normalize(vEye)));float rim=pow(max(0.,1.-edge),4.);float lit=smoothstep(-.2,.5,dot(n,normalize(vSun)));gl_FragColor=vec4(tint,rim*lit*strength);}`
})}
// Broad optical haze is evaluated on a bounded background mesh, not every screen pixel.
export function backgroundMaterial(){return new T.ShaderMaterial({side:T.BackSide,depthWrite:false,
 vertexShader:`varying vec3 vHaze;${noise}void main(){vec3 d=normalize(position);float belt=exp(-pow((d.z+.3*d.x-.1)*3.8,2.));float dust=smoothstep(.32,.72,fbm(d*18.));vHaze=vec3(.001,.002,.004)+vec3(.009,.014,.026)*belt*dust;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec3 vHaze;void main(){gl_FragColor=vec4(vHaze,1.);
 #include <colorspace_fragment>
 }`
})}
export function starsMaterial(pixelRatio:number){return new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,uniforms:{pixelRatio:{value:pixelRatio}},
 vertexShader:`attribute float pointSize;uniform float pixelRatio;varying vec3 vColor;void main(){vColor=color;gl_PointSize=pointSize*pixelRatio;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5)*2.;float a=1.-smoothstep(.1,1.,r);gl_FragColor=vec4(vColor,a);
 #include <colorspace_fragment>
 }`
})}
