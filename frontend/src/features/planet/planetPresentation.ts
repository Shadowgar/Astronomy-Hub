import type {PlanetCamera,PlanetContract} from './planetContracts'

/** Initial UI camera intent only. The native frame retains all globe/science math. */
export function initialPlanetCamera(contract:PlanetContract,camera:PlanetCamera|undefined,width:number,height:number):PlanetCamera {
 // Deep links, retries and history own their camera. Never reframe them, or a
 // camera after initialization, to satisfy an overview presentation preference.
 if(camera)return camera
 const aspect=Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0?width/height:1
 // The installed Cesium Camera defaults to 60° on the larger frustum axis.
 // Fit the sphere's tangent cone to 88% of the smaller axis, with breathing
 // room inside the real iframe rather than the surrounding product viewport.
 const halfAngle=Math.atan(.88*Math.tan(Math.PI/6)/Math.max(aspect,1/aspect))
 const radius=Math.max(...contract.shape.radii_m)
 const heightM=Math.max(30000,Math.min(12000000,radius/Math.sin(halfAngle)-radius))
 const sun=contract.illumination.direction_body_fixed
 // Match the native default viewing direction exactly; only camera height is
 // a presentation choice. Illumination and native body orientation are intact.
 return {latitudeDeg:Math.asin(sun[2])*180/Math.PI,longitudeDeg:Math.atan2(sun[1],sun[0])*180/Math.PI,heightM}
}
