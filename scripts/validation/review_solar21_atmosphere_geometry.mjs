/** Independent arithmetic reproduction of the installed Takram shader option.
 * Run from repository root. No renderer, network, fixture assets or mutations.
 */
import {PerspectiveCamera,Vector3} from '../../frontend/graphics/node_modules/three/build/three.module.js'
import {AerialPerspectiveEffect} from '../../frontend/graphics/node_modules/@takram/three-atmosphere/build/index.js'
import {Ellipsoid} from '../../frontend/graphics/node_modules/@takram/three-geospatial/build/index.js'
const camera=new PerspectiveCamera(42,1,100,3e14)
camera.position.set(0,0,0)
camera.updateMatrixWorld()
const results=[]
for(const enabled of [true,false]){
 const effect=new AerialPerspectiveEffect(camera,{ellipsoid:new Ellipsoid(6371000,6371000,6371000),correctAltitude:true,correctGeometricError:enabled,sky:false,sun:false,moon:false,sunLight:false,skyLight:false})
 effect.worldToECEFMatrix.makeTranslation(0,0,26371000)
 effect.update({}, {})
 const amount=enabled?effect.uniforms.get('geometricErrorCorrectionAmount').value:0
 const eye=new Vector3(0,0,26371000).add(effect.uniforms.get('altitudeCorrection').value)
 const sine=6390000/eye.z,direction=new Vector3(sine,0,-Math.sqrt(1-sine*sine))
 const point=eye.clone().addScaledVector(direction,130000000000)
 const bottom=effect.uniforms.get('bottomRadius').value
 // Exact shader correction: mix(position, bottom_radius * sphereNormal, amount).
 // All metres here; shader uses kilometres, an equivalent homogeneous scaling.
 const warped=point.clone().lerp(point.clone().normalize().multiplyScalar(bottom),amount)
 const impact=p=>eye.clone().cross(p.clone().sub(eye).normalize()).length()
 results.push({correctGeometricError:enabled,correctionAmount:amount,cameraAfterAltitudeCorrectionM:eye.toArray(),rayOffAxisDegrees:Math.asin(sine)*180/Math.PI,cameraHalfFovDegrees:21,opaquePointECEFM:point.toArray(),correctedOpaquePointECEFM:warped.toArray(),physicalRayImpactRadiusM:impact(point),atmosphericEvaluationRayImpactRadiusM:impact(warped),bottomRadiusM:bottom,topRadiusM:effect.uniforms.get('ATMOSPHERE').value.top_radius*1000})
 effect.dispose()
}
if(!(results[0].atmosphericEvaluationRayImpactRadiusM<results[0].bottomRadiusM&&results[0].physicalRayImpactRadiusM>results[0].bottomRadiusM&&Math.abs(results[1].atmosphericEvaluationRayImpactRadiusM-results[1].physicalRayImpactRadiusM)<1e-6))throw Error('Review reproduction changed')
console.log(JSON.stringify({status:'REPRODUCED',scope:'Installed library + exact shader arithmetic, not browser pixel proof',results},null,2))
