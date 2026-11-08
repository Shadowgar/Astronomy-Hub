import {Viewer,Globe,Ellipsoid,GeographicProjection,EllipsoidTerrainProvider,SingleTileImageryProvider,Rectangle,Cartesian3,DirectionalLight,Color,Math as CMath,ScreenSpaceEventType,SceneMode,JulianDate,Material} from 'cesium';
import {MOON_RADIUS_M,SOURCE,validateMoonContract,validateCamera,lightEmissionDirection} from './contracts.mjs';

/** Native renderer owner. All Cartesian coordinates are Moon ME body-fixed meters. */
export class PlanetRuntime {
 constructor(container,{contract,onNavigation=()=>{},onError=()=>{}}){
  this.contract=structuredClone(validateMoonContract(contract));this.disposed=false;this.sourceStatus='loading';this.onNavigation=onNavigation;this.onError=onError;
  this.ellipsoid=new Ellipsoid(MOON_RADIUS_M,MOON_RADIUS_M,MOON_RADIUS_M);
  const globe=new Globe(this.ellipsoid);globe.show=false;globe.baseColor=Color.fromCssColorString('#393b40');
  this.viewer=new Viewer(container,{ellipsoid:this.ellipsoid,globe,mapProjection:new GeographicProjection(this.ellipsoid),terrainProvider:new EllipsoidTerrainProvider({ellipsoid:this.ellipsoid}),baseLayer:false,skyBox:false,skyAtmosphere:false,animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,infoBox:false,selectionIndicator:false,requestRenderMode:true,maximumRenderTimeChange:Infinity,shouldAnimate:false,useBrowserRecommendedResolution:false,sceneMode:SceneMode.SCENE3D,scene3DOnly:true});
  const {viewer}=this,{scene}=viewer;
  scene.backgroundColor=Color.fromCssColorString('#03070b');scene.fog.enabled=false;scene.globe.showGroundAtmosphere=false;scene.globe.enableLighting=false;
  // Supported Globe material extension: attenuate the untouched mosaic by
  // Lambert sphere illumination. Native ellipsoid shading otherwise adds a
  // hard-coded Earth-oriented 0.3 floor and 5x diffuse boost (GlobeFS).
  this.illuminationMaterial=new Material({fabric:{type:'OrasLunarSphereIllumination',uniforms:{sunDirectionMC:Cartesian3.fromArray(this.contract.illumination.direction_body_fixed)},source:`
   czm_material czm_getMaterial(czm_materialInput materialInput) {
    czm_material material=czm_getDefaultMaterial(materialInput);
    // EllipsoidTerrainProvider has no encoded terrain vertex normals.
    // Recover the actual Moon-centered surface point from native eye space.
    vec3 pointMC=(czm_inverseView*vec4(-materialInput.positionToEyeEC,1.0)).xyz;
    float sunlight=max(dot(normalize(pointMC),normalize(sunDirectionMC)),0.0);
    material.diffuse=vec3(0.0);
    material.alpha=1.0-sunlight;
    return material;
   }`},translucent:false});scene.globe.material=this.illuminationMaterial;scene.globe.dynamicAtmosphereLighting=false;scene.globe.dynamicAtmosphereLightingFromSun=false;
  // Cesium DirectionalLight stores the emitted ray direction, opposite Moon→Sun.
  scene.light=new DirectionalLight({direction:Cartesian3.fromArray(lightEmissionDirection(this.contract.illumination.direction_body_fixed)),intensity:1});
  scene.globe.nightFadeOutDistance=0;scene.globe.nightFadeInDistance=1;
  viewer.clock.shouldAnimate=false;viewer.clock.currentTime=JulianDate.fromIso8601(this.contract.epoch);viewer.resolutionScale=Math.min(devicePixelRatio||1,1.5)/(devicePixelRatio||1);
  const controls=scene.screenSpaceCameraController;controls.minimumZoomDistance=30_000;controls.maximumZoomDistance=12_000_000;controls.enableTilt=false;controls.enableLook=false;controls.inertiaSpin=.2;controls.inertiaZoom=.2;
  viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  viewer.canvas.tabIndex=0;viewer.canvas.setAttribute('aria-label','Moon globe. Drag to rotate, pinch or wheel to zoom. Arrow keys pan, plus and minus zoom. Heights are above the lunar reference sphere.');
  this.keyHandler=event=>{if(event.ctrlKey||event.altKey||event.metaKey)return;const c=this.camera();let next;switch(event.key){case'ArrowLeft':next={...c,longitudeDeg:this.wrap(c.longitudeDeg-5)};break;case'ArrowRight':next={...c,longitudeDeg:this.wrap(c.longitudeDeg+5)};break;case'ArrowUp':next={...c,latitudeDeg:Math.min(89.9,c.latitudeDeg+5)};break;case'ArrowDown':next={...c,latitudeDeg:Math.max(-89.9,c.latitudeDeg-5)};break;case'+':case'=':this.zoom(0.8);break;case'-':this.zoom(1.25);break;default:return;}event.preventDefault();if(next)this.navigate(next);};
  viewer.canvas.addEventListener('keydown',this.keyHandler);
  this.renderedFrames=0;this.offPostRender=scene.postRender.addEventListener(()=>{this.renderedFrames++});
  this.offMove=viewer.camera.moveEnd.addEventListener(()=>this.onNavigation(this.diagnostics()));
  this.offRenderError=scene.renderError.addEventListener(()=>{if(!this.disposed){this.sourceStatus='error';scene.globe.show=false;this.onError('Lunar renderer stopped; return to Solar or retry.');}});
  this.offContextLost=event=>{event.preventDefault();if(!this.disposed)this.onError('Graphics context lost; return to Solar or retry.');};viewer.canvas.addEventListener('webglcontextlost',this.offContextLost);
 }
 async initialize(camera){
  try{
   const provider=await SingleTileImageryProvider.fromUrl(SOURCE.url,{ellipsoid:this.ellipsoid,rectangle:Rectangle.fromDegrees(-180,-90,180,90),credit:'NASA / GSFC / Arizona State University · LROC WAC morphology v1.3 · 8 pixels/degree'});
   if(this.disposed)return;
   if(provider.tileWidth!==2880||provider.tileHeight!==1440)throw Error('Unqualified lunar imagery dimensions');
   this.viewer.imageryLayers.addImageryProvider(provider);this.sourceStatus='ready';this.viewer.scene.globe.show=true;
   const s=this.contract.illumination.direction_body_fixed;
   this.navigate(camera??{longitudeDeg:CMath.toDegrees(Math.atan2(s[1],s[0])),latitudeDeg:CMath.toDegrees(Math.asin(s[2])),heightM:MOON_RADIUS_M*2.5*(this.viewer.canvas.clientWidth<this.viewer.canvas.clientHeight?1.5:1)});
   this.viewer.scene.requestRender();
   await new Promise((resolve,reject)=>{
    let finished=false;const finish=error=>{if(finished)return;finished=true;clearTimeout(timer);off();this.cancelInitialRender=null;error?reject(error):resolve();};
    const off=this.viewer.scene.postRender.addEventListener(()=>{if(this.viewer.scene.globe.tilesLoaded)finish();else this.viewer.scene.requestRender()});
    const timer=setTimeout(()=>finish(Error('Lunar globe did not complete its first rendered frame.')),15000);
    this.cancelInitialRender=()=>finish(Error('Lunar initialization cancelled.'));this.viewer.scene.requestRender();
   });
  }catch(error){if(!this.disposed){this.sourceStatus='unavailable';this.viewer.scene.globe.show=false;throw error;}}
 }
 wrap(degrees){return ((degrees+180)%360+360)%360-180;}
 camera(){const c=this.viewer.camera.positionCartographic;return {latitudeDeg:CMath.toDegrees(c.latitude),longitudeDeg:this.wrap(CMath.toDegrees(c.longitude)),heightM:c.height,headingRad:this.viewer.camera.heading,pitchRad:this.viewer.camera.pitch,rollRad:this.viewer.camera.roll};}
 navigate(value){this.ensureActive();const c=validateCamera(value);this.viewer.camera.cancelFlight();this.viewer.camera.setView({destination:Cartesian3.fromDegrees(c.longitudeDeg,c.latitudeDeg,c.heightM,this.ellipsoid),orientation:{heading:c.headingRad??0,pitch:c.pitchRad??-CMath.PI_OVER_TWO,roll:c.rollRad??0}});this.viewer.scene.requestRender();return this.diagnostics();}
 zoom(factor){this.ensureActive();if(typeof factor!=='number'||!Number.isFinite(factor)||factor<.1||factor>10)throw Error('Invalid zoom factor');const c=this.camera();return this.navigate({...c,heightM:Math.max(30_000,Math.min(12_000_000,c.heightM*factor))});}
 orbit(radians){this.ensureActive();if(typeof radians!=='number'||!Number.isFinite(radians)||Math.abs(radians)>Math.PI*2)throw Error('Invalid orbit angle');const c=this.camera();return this.navigate({...c,longitudeDeg:this.wrap(c.longitudeDeg+CMath.toDegrees(radians))});}
 ensureActive(){if(this.disposed||this.viewer.isDestroyed())throw Error('Lunar renderer has been disposed');}
 diagnostics(){const destroyed=this.viewer.isDestroyed();return {bodyId:'moon',centerNaifId:'301',frame:this.contract.frame.body_fixed,epoch:this.contract.epoch,camera:destroyed?this.lastCamera:this.camera(),radiiM:[MOON_RADIUS_M,MOON_RADIUS_M,MOON_RADIUS_M],source:{...SOURCE,status:this.sourceStatus},sceneEpoch:destroyed?this.contract.epoch:JulianDate.toIso8601(this.viewer.clock.currentTime),terrain:false,renderedFrames:this.renderedFrames,disposed:this.disposed,viewerDestroyed:destroyed,earthEffectsDisabled:destroyed?true:!this.viewer.scene.sun&&!this.viewer.scene.moon&&!this.viewer.scene.skyAtmosphere&&!this.viewer.scene.skyBox&&!this.viewer.scene.fog.enabled&&!this.viewer.scene.globe.showGroundAtmosphere,globeRadiiM:destroyed?null:[this.viewer.scene.globe.ellipsoid.radii.x,this.viewer.scene.globe.ellipsoid.radii.y,this.viewer.scene.globe.ellipsoid.radii.z],sceneRadiiM:destroyed?null:[this.viewer.scene.ellipsoid.radii.x,this.viewer.scene.ellipsoid.radii.y,this.viewer.scene.ellipsoid.radii.z],projectionRadiiM:destroyed?null:[this.viewer.scene.mapProjection.ellipsoid.radii.x,this.viewer.scene.mapProjection.ellipsoid.radii.y,this.viewer.scene.mapProjection.ellipsoid.radii.z],globeTilesLoaded:destroyed?null:this.viewer.scene.globe.tilesLoaded,terrainRadiiM:destroyed?null:[this.viewer.terrainProvider.tilingScheme.ellipsoid.radii.x,this.viewer.terrainProvider.tilingScheme.ellipsoid.radii.y,this.viewer.terrainProvider.tilingScheme.ellipsoid.radii.z],imageryRadiiM:destroyed||!this.viewer.imageryLayers.length?null:Object.values(this.viewer.imageryLayers.get(0).imageryProvider.tilingScheme.ellipsoid.radii),illuminationModel:'Lambert sphere; no ambient Earth shading or Earthshine; historic mosaic is not reflectance',lightEmissionDirection:lightEmissionDirection(this.contract.illumination.direction_body_fixed)};}
 dispose(){if(this.disposed)return this.diagnostics();this.lastCamera=this.camera();this.disposed=true;this.cancelInitialRender?.();this.offPostRender?.();this.offMove?.();this.offRenderError?.();this.viewer.canvas.removeEventListener('keydown',this.keyHandler);this.viewer.canvas.removeEventListener('webglcontextlost',this.offContextLost);this.viewer.camera.cancelFlight();this.viewer.destroy();if(!this.illuminationMaterial.isDestroyed())this.illuminationMaterial.destroy();return this.diagnostics();}
}
