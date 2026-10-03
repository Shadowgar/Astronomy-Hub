// Qualified SWE extension hook. All scientific/scene work remains inside this frame.
import swh from '@/assets/sw_helpers.js'
export default {
 guiComponents:[{name:'oras-workspace-source',computed:{embedded(){return this.$store.state.orasEmbeddedPresentation}},render(h){return this.embedded?h('button',{class:'oras-workspace-source',attrs:{'aria-label':'Sky sources and survey credits'},on:{click:()=>this.$store.commit('setValue',{varName:'showDataCreditsDialog',newValue:true})}},['ORAS Sky Engine · Stellarium · survey credits']):null}}],
 onEngineReady(app) {
  let disposed=false,selectionGeneration=0
  const set=(key,value)=>app.$store.commit('setValue',{varName:key,newValue:value})
  const presentation=(embedded,creditsAtTop=false)=>{
   document.documentElement.classList.toggle('oras-workspace-embedded',embedded)
   document.documentElement.classList.toggle('oras-credits-top',creditsAtTop)
   set('orasEmbeddedPresentation',embedded)
   for(const key of ['showMainToolBar','showLocationButton','showTimeButtons','showObservingPanelTabsButtons','showSelectedInfoButtons'])set(key,!embedded)
   if(embedded){set('showSidePanel',false);set('showNavigationDrawer',false)}
  }
  const style=document.createElement('style')
  style.textContent='.oras-workspace-embedded #toolbar-image,.oras-workspace-embedded #time-controls,.oras-workspace-embedded #location-button,.oras-workspace-embedded #selected-object-info,.oras-workspace-embedded .bottom-toolbar{display:none!important}.oras-workspace-embedded #stel{width:100%!important}.oras-workspace-embedded .v-main{padding:0!important}.oras-workspace-source{position:absolute;bottom:4px;left:16px;z-index:4;min-height:44px;background:transparent;color:#B9C7D7;border:0;font:10px/14px sans-serif;pointer-events:auto;cursor:pointer}.oras-credits-top .oras-workspace-source{top:68px;bottom:auto}.oras-workspace-source:focus-visible{outline:2px solid #9BE4F2}'
  document.head.appendChild(style)
  presentation(new URLSearchParams(location.search).get('orasEmbedded')==='1')
  window.orasSkyAdapter={
   observer:app.$stel.core.observer,
   tools(){set('showViewSettingsDialog',true);return {ok:true}},
   panelOpen(){return !!(app.$store.state.showViewSettingsDialog||app.$store.state.showDataCreditsDialog)},
   stop(){disposed=true;++selectionGeneration;app.$stel.core.time_speed=0},
   setLive(live){app.$stel.core.time_speed=live?1:0},presentation,
   async select(entity){
    const generation=++selectionGeneration
    const identity={catalog:entity.catalog,sourceId:entity.source_id,model:entity.model,ra:entity.ra,dec:entity.dec,time:new Date(Math.round((app.$stel.core.observer.utc-40587)*86400000)).toISOString(),lat:app.$stel.core.observer.latitude*180/Math.PI,lng:app.$stel.core.observer.longitude*180/Math.PI,elev:app.$stel.core.observer.elevation}
    const source=await swh.fetchOrasSkySourceByIdentity(identity)
    if(disposed||generation!==selectionGeneration)return {ok:false,error:'Selection superseded'}
    if(!source||source.status==='not_indexed'||!swh.skySourceMatchesIdentity(source,identity))return {ok:false,error:'Object unavailable in this catalog'}
    let obj=entity.model==='star'?await swh.resolveCanonicalStar(source):swh.skySource2SweObj(source)
    if(disposed||generation!==selectionGeneration){if(obj&&obj.__orasOwnedLookup)obj.destroy();return {ok:false,error:'Selection superseded'}}
    if(!obj){obj=app.$stel.createObj(source.model,source);if(obj)app.$selectionLayer.add(obj)}
    if(!obj)return {ok:false,error:'Object could not be materialized'}
    obj.__orasSkySourceData=source;swh.exactSkySourceSelection=source;app.$stel.core.selection=obj;app.$store.commit('setSelectedObject',source)
    if(obj.__orasOwnedLookup){obj.__orasOwnedLookup=false;obj.destroy()}
    return {ok:true}
   },
   clear(){++selectionGeneration;app.$stel.core.selection=0;swh.exactSkySourceSelection=undefined;app.$store.commit('setSelectedObject',0);return {ok:true}},
   focus(){const obj=app.$stel.core.selection;if(!obj)return {ok:false,error:'No available selection'};app.$stel.pointAndLock(obj,matchMedia('(prefers-reduced-motion: reduce)').matches?0:1);return {ok:true}},
   snapshot(){
    const ss=app.$store.state.selectedObject
    let selection=null
    if(ss&&ss.catalog&&ss.source_id!=null&&ss.model){
     const facts=[];for(const [label,value] of [['Catalog',ss.catalog],['Source ID',ss.source_id],['Type',ss.object_type],['Magnitude',ss.magnitude],['Spectral type',ss.model_data&&ss.model_data.spect_t]])if(value!=null)facts.push({label,value:String(value).slice(0,256)})
     const query=new URLSearchParams({catalog:ss.catalog,source_id:String(ss.source_id),model:ss.model,date:new Date(Math.round((app.$stel.core.observer.utc-40587)*86400000)).toISOString(),lat:String(app.$stel.core.observer.latitude*180/Math.PI),lng:String(app.$stel.core.observer.longitude*180/Math.PI),elev:String(app.$stel.core.observer.elevation)})
     const coords={};for(const key of ['ra','dec'])if(Number.isFinite(ss[key])){coords[key]=ss[key];query.set(key,String(ss[key]))}
     selection={id:[ss.catalog,ss.source_id,ss.model].join(':').slice(0,256),name:String(ss.display_name||ss.names&&ss.names[0]||ss.source_id).slice(0,256),...(typeof ss.description==='string'?{detail:ss.description.slice(0,1500)}:{}),kind:ss.model==='tle_satellite'?'satellite':['dso','star','planet','moon'].includes(ss.model)?ss.model:'object',catalog:ss.catalog,source_id:String(ss.source_id),model:ss.model,...coords,facts,available:true,focusable:true,trackable:false,link:'/oras-sky-engine/skysource/'+encodeURIComponent(ss.display_name||ss.source_id)+'?'+query}
    }
    return {selection,layers:[],tracking:false}
   }
  }
  window.dispatchEvent(new Event('oras-sky-ready'))
 }
}
