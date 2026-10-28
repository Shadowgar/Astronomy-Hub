import * as T from 'three'
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js'
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js'
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js'
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js'
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js'
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js'
import type {SolarQuality} from './solarPresentation'

export function solarPipelinePolicy(quality:SolarQuality,hdrSupported:boolean,effects:boolean){
 return{mode:hdrSupported&&quality!=='efficient'?'linear-hdr':'direct',bloom:hdrSupported&&quality!=='efficient'&&effects,threshold:1.25,strength:quality==='detailed'?.24:.17,radius:.45} as const
}

/** One scene, one renderer, one output transform. Three r180 disables material
 * tone mapping while rendering into non-XR targets; OutputPass is therefore the
 * sole tone/color transform in HDR mode. Direct mode maps in the materials.
 * No offscreen scene copy, selection render pass or independent animation loop. */
export function createSolarRenderPipeline(renderer:any,scene:any,camera:any){
 const hdrSupported=renderer.extensions.has('EXT_color_buffer_float')
 const previous={toneMapping:renderer.toneMapping,exposure:renderer.toneMappingExposure,output:renderer.outputColorSpace,autoReset:renderer.info.autoReset}
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.outputColorSpace=T.SRGBColorSpace
 renderer.info.autoReset=false
 let quality:SolarQuality='balanced',effects=true,disposed=false,composer:any=null,bloom:any=null,output:any=null,antialias:any=null,renderPass:any=null
 let width=1,height=1,pixelRatio=1
 const policy=()=>solarPipelinePolicy(quality,hdrSupported,effects)
 const release=()=>{
  if(!composer)return
  renderPass.dispose();bloom.dispose();output.dispose();antialias.dispose();composer.dispose()
  composer=null;bloom=null;output=null;antialias=null;renderPass=null
 }
 const ensure=()=>{
  if(policy().mode==='direct'){release();return}
  if(!composer){
   // Composer owns the supplied target and its clone, both disposed by release.
   const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true,stencilBuffer:false})
   composer=new EffectComposer(renderer,target)
   renderPass=new RenderPass(scene,camera);bloom=new UnrealBloomPass(new T.Vector2(1,1),.17,.45,1.25);output=new OutputPass();antialias=new ShaderPass(FXAAShader)
   composer.addPass(renderPass);composer.addPass(bloom);composer.addPass(output);composer.addPass(antialias)
  }
  const settings=policy();bloom.enabled=settings.bloom;bloom.strength=settings.strength;bloom.threshold=settings.threshold;bloom.radius=settings.radius
  composer.setPixelRatio(pixelRatio);composer.setSize(width,height)
  antialias.uniforms.resolution.value.set(1/Math.max(1,width*pixelRatio),1/Math.max(1,height*pixelRatio))
 }
 ensure()
 return{
  render(){if(disposed)return;renderer.info.reset();if(composer)composer.render();else renderer.render(scene,camera)},
  resize(w:number,h:number,dpr:number){if(disposed)return;width=Math.max(1,w);height=Math.max(1,h);pixelRatio=Math.max(.5,dpr);ensure()},
  setQuality(value:SolarQuality){if(disposed)return;quality=value;ensure()},
  setEffects(value:boolean){if(disposed)return;effects=value;if(bloom)bloom.enabled=policy().bloom},
  diagnostics(){return{...policy(),hdrSupported,toneMapping:'ACESFilmic',toneMappingStages:1,outputColorSpace:'srgb',antialias:composer?'FXAA':'context',width,height,pixelRatio,disposed}},
  dispose(){if(disposed)return;disposed=true;release();renderer.toneMapping=previous.toneMapping;renderer.toneMappingExposure=previous.exposure;renderer.outputColorSpace=previous.output;renderer.info.autoReset=previous.autoReset}
 }
}
