import React,{useState} from 'react'
import {lunarLocator} from './terrainContext'
import type {TerrainManifest} from './terrainContracts'

const moonImage=new URL('./assets/moon-context.png',import.meta.url).href

export function TerrainContext({manifest,onOverview}:{manifest:TerrainManifest|null;onOverview:()=>void}){
 const [imageReady,setImageReady]=useState(false),[imageFailed,setImageFailed]=useState(false)
 const marker=manifest?lunarLocator(manifest.latitudeDeg,manifest.longitudeDeg):null
 return <aside className="terrain-context" aria-label="Moon global context">
  <div className="terrain-locator">
   <img src={moonImage} width="384" height="384" alt="LROC WAC near-side Moon map, north up" hidden={imageFailed} onLoad={()=>{setImageReady(true);setImageFailed(false)}} onError={()=>{setImageReady(false);setImageFailed(true)}}/>
   {imageReady?<svg viewBox="0 0 200 200" aria-label="Approximate Apollo 17 region; marker enlarged" role="img">
    <text x="100" y="12" textAnchor="middle">N</text>
    {marker?.visible?<g transform={`translate(${100+marker.x*100} ${100+marker.y*100})`}><circle r="7"/><circle r="2" className="terrain-locator-dot"/></g>:null}
   </svg>:null}
   {imageFailed?<p className="terrain-context-unavailable" role="status">Moon context unavailable</p>:null}
  </div>
  <div className="terrain-context-copy"><small>MOON · NEAR SIDE</small><h2>Taurus–Littrow</h2>
   <p>{manifest?`${manifest.latitudeDeg.toFixed(2)}° N · ${manifest.longitudeDeg.toFixed(2)}° E`:'Apollo 17 region'}</p>
   <p className="terrain-context-note">Approximate location · marker enlarged</p>
   <p className="terrain-context-resolution">Globe context · ≈3.79 km/pixel</p>
   <button onClick={onOverview}>Open Moon overview ↗</button>
  </div>
  <div className="terrain-coverage"><span>Measured region</span><strong>{manifest?manifest.extentM.map(n=>(n/1000).toFixed(2)).join(' × ')+' km':'Loading source extent'}</strong><p>{manifest?.elevationResolutionM??'—'} m elevation &amp; imagery<br/>True height scale</p></div>
  <p className="terrain-context-source">Globe context: LROC WAC, ≈3.79 km/pixel at equator. Historical imagery; no current illumination.</p>
 </aside>
}
