import React,{useEffect,useRef} from 'react'
import {IconButton} from './primitives'
const source='https://github.com/Shadowgar/Astronomy-Hub/tree/n1-sky-earth-navigation-1'
const upstream='https://github.com/Stellarium/stellarium-web-engine/tree/023e3b26babf7ffddf45f39293230b14cfe96993'
export default function AboutLicenses({open,onClose}:{open:boolean;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),returnTo=useRef<HTMLElement|null>(null),latestClose=useRef(onClose);latestClose.current=onClose
 useEffect(()=>{
  const node=dialog.current;if(!node)return
  const closed=()=>{latestClose.current();const target=returnTo.current;returnTo.current=null;requestAnimationFrame(()=>{if(target?.isConnected)target.focus()})}
  node.addEventListener('close',closed);return ()=>node.removeEventListener('close',closed)
 },[])
 useEffect(()=>{const node=dialog.current;if(!node)return;if(open&&!node.open){returnTo.current=node.closest('.ws-shell')?.querySelector<HTMLElement>('[data-ws-trigger="menu"]')||null;node.showModal()}else if(!open&&node.open)node.close()},[open])
 return <dialog ref={dialog} className="ws-about ws-panel" aria-labelledby="ws-about-title" onKeyDown={event=>{if(event.key==='Escape')event.stopPropagation()}}>
  <div className="ws-panel-heading"><div><small className="ws-eyebrow">Astronomy Hub</small><h2 id="ws-about-title">About &amp; Licenses</h2></div><IconButton icon="x" label="Close About & Licenses" onClick={()=>dialog.current?.close()}/></div>
  <p>Astronomy Hub brings Sky observing and Earth exploration into one workspace.</p>
  <h3>Sky rendering</h3>
  <p>Stellarium Web Engine and its contained web frontend. Copyright © 2022 Stellarium Labs SRL and the contributors identified in the source notices. Distributed here with the GNU Affero General Public License, version 3.</p>
  <ul><li><a href="/licenses/stellarium-web-engine-AGPL-3.0.txt" target="_blank" rel="noreferrer">AGPLv3 license text</a></li><li><a href={source} target="_blank" rel="noreferrer">Modified source and build instructions</a> · <a href="https://github.com/Shadowgar/Astronomy-Hub/archive/refs/heads/n1-sky-earth-navigation-1.zip" target="_blank" rel="noreferrer">Download modified source</a></li><li><a href={upstream} target="_blank" rel="noreferrer">Pinned upstream source and original notices</a></li></ul>
  <h3>Earth rendering</h3><p>CesiumJS, an open-source geospatial rendering library. Copyright and third-party notices are retained with its distribution.</p><p><a href="/licenses/cesium-license.txt" target="_blank" rel="noreferrer">Cesium license and notices</a></p>
  <p>Earth coordinate search reuses pinned God’s Eye code, © 2026 Bilawal Sidhu. <a href="/licenses/gods-eye-search-MIT.txt" target="_blank" rel="noreferrer">MIT license and notices</a>. Place results use Photon and <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.</p>
  <h3>Data and imagery credits</h3>
  <p><a href="/licenses/sky-data-credits.html" target="_blank" rel="noreferrer">Sky catalog, survey and image acknowledgments</a>. The native Sky credits control also retains the original acknowledgments. Earth imagery and provider credits remain visible on the map.</p>
  <p>Additional Astronomy Hub sources include OpenNGC, NASA/JPL and the mounted CelesTrak Active GP/TLE catalog. Satellite positions are modeled; stale elements do not establish current visibility or catalog completeness.</p>
  <p>The Pennsylvania woodland panorama is original illustrative artwork, not surveyed ORAS terrain. Its ridge heights are never scientific horizon measurements.</p>
 </dialog>
}
