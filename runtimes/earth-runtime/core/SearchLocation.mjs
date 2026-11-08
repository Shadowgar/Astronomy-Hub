import {Cartesian3,Cartesian2,Color,HeightReference} from 'cesium';
// Geographic search context only. Zero is the ellipsoid anchor, not an elevation
// measurement; native terrain clamping is used if qualified terrain is available.
export class SearchLocation {
 constructor(viewer){this.viewer=viewer;this.entity=null;}
 set(location){
  if(this.entity)this.viewer.entities.remove(this.entity);this.entity=null;
  if(location)this.entity=this.viewer.entities.add({id:'hub-search-location',name:'Selected location',position:Cartesian3.fromDegrees(location.lon,location.lat,0),point:{pixelSize:12,color:Color.fromCssColorString('#b9dfff'),outlineColor:Color.fromCssColorString('#163f65'),outlineWidth:3,heightReference:HeightReference.CLAMP_TO_GROUND},label:{text:'Selected location',font:'13px sans-serif',fillColor:Color.fromCssColorString('#edf5ff'),outlineColor:Color.fromCssColorString('#07111f'),outlineWidth:4,style:2,pixelOffset:new Cartesian2(0,-24),heightReference:HeightReference.CLAMP_TO_GROUND}});
  this.viewer.scene.requestRender();
 }
 destroy(){this.set(null);}
}
