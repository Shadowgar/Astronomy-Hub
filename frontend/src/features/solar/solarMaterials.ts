import * as T from 'three'

// Optical styling only: no measured solar surface, plasma flow or activity model.
const noise=`
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.0,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec3(7.1,1.2,5.3);a*=.5;}return v;}`
export function sunMaterial(){return new T.ShaderMaterial({
 vertexShader:`varying vec3 vLocal;varying vec3 vNormal;varying vec3 vEye;void main(){vLocal=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vEye=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
 fragmentShader:`varying vec3 vLocal;varying vec3 vNormal;varying vec3 vEye;${noise}
 void main(){float n=fbm(vLocal*19.0);float granules=noise(vLocal*125.0);float bright=smoothstep(.29,.7,n+.13*granules);vec3 color=mix(vec3(.6,.055,.004),vec3(2.4,.9,.13),bright);float rim=pow(1.0-max(0.,dot(vNormal,vEye)),3.);color+=vec3(1.8,.6,.09)*rim;gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
})}
export function coronaMaterial(){return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;${noise}void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float angle=atan(p.y,p.x);float rays=fbm(vec3(cos(angle)*7.,sin(angle)*7.,1.));float edge=.37+rays*.07;float glow=exp(-max(0.,r-edge)*10.)*.45;float fine=pow(max(0.,1.-abs(r-edge)/.08),2.);float a=(glow+fine*.4)*smoothstep(.32,.43,r)*(1.-smoothstep(.85,1.,r));gl_FragColor=vec4(vec3(1.,.37,.07),a);}`
})}
export function atmosphereMaterial(color:string){return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.BackSide,uniforms:{tint:{value:new T.Color(color)}},
 vertexShader:`varying vec3 vNormal;varying vec3 vEye;varying vec3 vSun;void main(){vec4 world=modelMatrix*vec4(position,1.);vec4 p=viewMatrix*world;vNormal=normalize(normalMatrix*normal);vEye=normalize(-p.xyz);vSun=normalize((viewMatrix*vec4(-world.xyz,0.)).xyz);gl_Position=projectionMatrix*p;}`,
 fragmentShader:`uniform vec3 tint;varying vec3 vNormal;varying vec3 vEye;varying vec3 vSun;void main(){float rim=pow(max(0.,1.-abs(dot(normalize(vNormal),normalize(vEye)))),3.5);float lit=.08+.92*max(0.,dot(normalize(vNormal),normalize(vSun)));gl_FragColor=vec4(tint,rim*lit*.8);}`
})}
export function starsMaterial(pixelRatio:number){return new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,uniforms:{pixelRatio:{value:pixelRatio}},
 vertexShader:`attribute float pointSize;uniform float pixelRatio;varying vec3 vColor;void main(){vColor=color;gl_PointSize=pointSize*pixelRatio;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5)*2.;float a=1.-smoothstep(.1,1.,r);gl_FragColor=vec4(vColor,a);
 #include <colorspace_fragment>
 }`
})}
