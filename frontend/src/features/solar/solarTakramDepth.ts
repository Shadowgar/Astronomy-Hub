import {AerialPerspectiveEffect,type AerialPerspectiveEffectOptions} from '@takram/three-atmosphere'

// Exact reconstruction block in pinned @takram/three-atmosphere 0.19.1.
// Keep this adapter exception local; never edit the installed/vendor package.
const upstreamReconstruction=`  depth = reverseLogDepth(depth, cameraNear, cameraFar);

  // Reconstruct position and normal in world space.
  vec3 viewPosition = screenToView(
    uv,
    depth,
    getViewZ(depth),
    projectionMatrix,
    inverseProjectionMatrix
  );`

export function solarDepthReconstruction(source:string):string{
 if(source.split(upstreamReconstruction).length!==2)throw Error('Unsupported Takram depth reconstruction; use the custom atmosphere fallback.')
 return source.replace(upstreamReconstruction,`  vec3 viewPosition;
  #if defined(PERSPECTIVE_CAMERA) && (defined(USE_LOGDEPTHBUF) || defined(USE_LOGARITHMIC_DEPTH_BUFFER))
  // Decode metres directly. Converting log depth to perspective depth near 1
  // first loses hundreds of kilometres at the Solar camera's 100 m near plane.
  float viewZ = -(exp2(depth * log2(cameraFar + 1.0)) - 1.0);
  vec3 viewRay = (inverseProjectionMatrix * vec4(uv * 2.0 - 1.0, 1.0, 1.0)).xyz;
  // Ratios cancel the homogeneous scale; never divide by far-plane w (may be 0).
  viewPosition = viewRay * (viewZ / viewRay.z);
  #else
  depth = reverseLogDepth(depth, cameraNear, cameraFar);
  viewPosition = screenToView(uv, depth, getViewZ(depth), projectionMatrix, inverseProjectionMatrix);
  #endif`)
}

/** Actual upstream effect/scattering with one precision-only integration patch.
 * The protected shader hook is provided by postprocessing.Effect. LUTs, Earth
 * frame, lighting, transmittance and radiance functions remain upstream-owned. */
export class SolarAerialPerspectiveEffect extends AerialPerspectiveEffect{
 constructor(camera:any,options:AerialPerspectiveEffectOptions){
  super(camera,options)
  try{this.setFragmentShader(solarDepthReconstruction(this.getFragmentShader()))}
  catch(error){this.dispose();throw error}
 }
}
