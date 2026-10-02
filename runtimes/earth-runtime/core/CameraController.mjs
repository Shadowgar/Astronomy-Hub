import {Cartesian3,Math as CesiumMath} from 'cesium';
export class CameraController {
  constructor(viewer){this.viewer=viewer;}
  home(site){this.stopTracking();this.viewer.camera.setView({destination:Cartesian3.fromDegrees(site.lon,site.lat,2_000_000),orientation:{heading:0,pitch:CesiumMath.toRadians(-90),roll:0}});this.viewer.scene.requestRender();}
  track(entity){this.viewer.trackedEntity=entity;this.viewer.scene.requestRender();}
  stopTracking(){this.viewer.trackedEntity=undefined;}
  focus(entity){this.stopTracking();void this.viewer.flyTo(entity,{duration:.5});}
  destroy(){this.viewer.camera.cancelFlight();this.stopTracking();}
}
