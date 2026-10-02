export class SelectionStore {
  constructor(viewer,camera,changed){this.viewer=viewer;this.camera=camera;this.changed=changed;this.value=null;this.unsubscribe=viewer.selectedEntityChanged.addEventListener(entity=>this.set(entity));}
  set(entity){this.value=entity??null;this.changed(entity?.orasMetadata??null);}
  clearLayer(id){if(this.value?.orasMetadata?.layerId===id){this.camera.stopTracking();this.viewer.selectedEntity=undefined;this.set(null);}}
  destroy(){this.unsubscribe();this.camera.stopTracking();this.viewer.selectedEntity=undefined;this.value=null;}
}
