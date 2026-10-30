/** Static near-side context only, not a NAC-to-native frame registration. */
export function lunarLocator(latitude:number,longitude:number){
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw Error('Invalid lunar context coordinate')
 const lat=latitude*Math.PI/180,lon=longitude*Math.PI/180
 return{x:Math.cos(lat)*Math.sin(lon),y:-Math.sin(lat)||0,visible:Math.cos(lat)*Math.cos(lon)>=0}
}

export function regionalCameraEnvelope(extent:readonly number[],aspect:number){
 const span=Math.max(...extent),fit=Math.max(1,1/Math.max(aspect,.35))
 // Fit a sphere enclosing the measured rectangle in the limiting 45-degree
 // camera frustum; reserve 3% for the region's measured relief and stage border.
 const halfFov=Math.atan(Math.tan(Math.PI/8)*Math.min(1,Math.max(aspect,.35)))
 const overviewDistance=Math.hypot(...extent)/2/Math.sin(halfFov)*1.03
 return{overviewDistance,detailDistance:span*.24*fit,maximumDistance:Math.max(span*2.6*fit,overviewDistance)}
}
