import React,{useEffect,useRef,useState} from 'react'
import {useLocation,useNavigate,useParams} from 'react-router-dom'
import {parseSceneDate,useRuntimeProductState} from '../runtime/productState'
import {waitForRuntimeDisposal} from '../sky-engine/RuntimeHost'
import {CinematicBrand} from '../workspace/cinematic'
import {safeSolarReturn} from '../planet/planetContracts'
import {terrainNativeExit} from './terrainNavigation'
import {loadTerrainManifest,terrainMoonReturn,type TerrainManifest,type TerrainQuality} from './terrainContracts'
import {mountTerrainScene,type TerrainPose,type TerrainScene,type TerrainStatus} from './TerrainScene'
import '../workspace/workspace.css'
import '../solar/solar.css'
import './terrain.css'

declare global{interface Window{orasTerrainDiagnostics?:()=>unknown;orasTerrainDisposed?:unknown[]}}
function savedPose(value:any,region:string,epoch:string):TerrainPose|undefined{const v=value?.terrainView;if(v?.schema!=='oras.terrain-view.v1'||v.region!==region||v.epoch!==epoch)return;const valid=(p:unknown)=>Array.isArray(p)&&p.length===3&&p.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<1e6);if(valid(v.pose?.camera)&&valid(v.pose?.target)&&Math.hypot(...v.pose.camera.map((n:number,i:number)=>n-v.pose.target[i]))>1)return v.pose}

export default function TerrainWorkspace(){
 const location=useLocation(),navigate=useNavigate(),{region='apollo17-nac-v1'}=useParams(),search=new URLSearchParams(location.search)
 const epoch=parseSceneDate(search.get('date')||useRuntimeProductState.getState().requestedTime)
 const locationRef=useRef(location);locationRef.current=location
 const host=useRef<HTMLDivElement>(null),engine=useRef<TerrainScene|null>(null),restore=useRef<TerrainPose|undefined>(undefined)
 const [manifest,setManifest]=useState<TerrainManifest|null>(null),[status,setStatus]=useState<TerrainStatus|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[sources,setSources]=useState(false)
 const [quality,setQuality]=useState<TerrainQuality>('balanced'),[relief,setRelief]=useState(false),[reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)
 const settings=useRef({quality,relief,reduced});settings.current={quality,relief,reduced}
 function persist(){if(!engine.current||!epoch)return;const now=locationRef.current,view={schema:'oras.terrain-view.v1',region,epoch,pose:engine.current.pose()};navigate(now.pathname+now.search,{replace:true,state:{...now.state,terrainView:view}})}
 function dispose(){const current=engine.current;if(!current)return;engine.current=null;current.dispose();window.orasTerrainDisposed=[...(window.orasTerrainDisposed||[]).slice(-7),current.diagnostics()];delete window.orasTerrainDiagnostics}
 useEffect(()=>{const previous=document.title;document.title='Apollo 17 terrain · Astronomy Hub';const media=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(media.matches);media.addEventListener('change',change);return()=>{document.title=previous;media.removeEventListener('change',change)}},[])
 useEffect(()=>{
  const abort=new AbortController();setError('');setStatus(null);setManifest(null)
  useRuntimeProductState.getState().ingestSearch(locationRef.current.search)
  if(!epoch){setError('Choose a valid UTC time in Solar before opening terrain.');return()=>abort.abort()}
  void(async()=>{try{
   const source=await loadTerrainManifest(region,abort.signal);await waitForRuntimeDisposal();if(abort.signal.aborted||!host.current)return
   const initial=restore.current||savedPose(locationRef.current.state,region,epoch);restore.current=undefined
   const next=mountTerrainScene(host.current,source,{quality:settings.current.quality,reduced:settings.current.reduced,initial,onStatus:value=>{if(abort.signal.aborted)return;setStatus(value);persist()},onRestore:pose=>{if(abort.signal.aborted)return;restore.current=pose;setRetry(n=>n+1)}})
   engine.current=next;next.setRelief(settings.current.relief);window.orasTerrainDiagnostics=()=>({...next.diagnostics(),epoch});setManifest(source);useRuntimeProductState.setState({requestedTime:epoch})
  }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Lunar terrain could not initialize.')}})()
  return()=>{abort.abort();dispose()}
 },[region,epoch,retry])
 useEffect(()=>engine.current?.setQuality(quality),[quality])
 useEffect(()=>engine.current?.setRelief(relief),[relief])
 useEffect(()=>engine.current?.setReducedMotion(reduced),[reduced])
 function retryView(){restore.current=engine.current?.pose();setRetry(n=>n+1)}
 function leave(mode?:'solar'|'earth'|'sky'){
  const utc=epoch||parseSceneDate(useRuntimeProductState.getState().requestedTime)||new Date().toISOString(),now=locationRef.current
  persist();dispose()
  const native=terrainMoonReturn(now.state?.terrainReturn,utc,manifest||undefined,now.search)
  if(!mode){navigate(native.path,{state:native.state});return}
  const returned=(native.state as any)?.planetReturn||now.state?.planetReturn
  if(mode==='solar'){const solar=returned?.path?.startsWith('/planetary-system/')?returned.state?.systemReturn:returned;navigate(safeSolarReturn(solar?.path,utc),{state:solar?.state});return}
  const nativeDestination=terrainNativeExit(returned,mode,utc,now.search,window.innerWidth<700)
  navigate(nativeDestination.path,{state:nativeDestination.state})
 }
 return <div className="ws-shell solar-shell terrain-shell" data-workspace-mode="terrain" data-terrain-status={error?'error':status?.lost?'context-lost':status?.ready?'ready':'loading'}>
  <main ref={host} className="terrain-stage" aria-label="Measured lunar regional terrain"/>
  <header className="solar-header"><CinematicBrand mode="solar" onMode={leave} allowCurrentMode/><button className="solar-return" onClick={()=>leave()}>Return to Moon</button></header>
  <section className="terrain-heading"><small>MOON · REGIONAL EXPLORATION</small><h1>{manifest?.name||'Apollo 17'}</h1><p>Measured terrain · 5 m source sampling</p></section>
  {error?<section className="solar-message solar-glass" role="alert"><p>{error}</p><button onClick={retryView}>Retry terrain</button><button onClick={()=>leave()}>Return to Moon</button></section>:!status?.ready&&!status?.lost?<p className="solar-loading solar-glass" role="status">{status?.failed?'Some terrain tiles could not load. Use Retry tiles.':'Loading local lunar terrain…'}</p>:null}
  {status?.lost?<section className="solar-message solar-glass" role="alert"><p>The graphics context stopped. Retry restores your regional camera and UTC.</p><button onClick={retryView}>Restore terrain</button><button onClick={()=>leave()}>Return to Moon</button></section>:null}
  <nav className="terrain-tools solar-glass" aria-label="Lunar terrain controls">
   <button aria-label="Zoom terrain in" onClick={()=>engine.current?.zoom(.7)}>+</button><button aria-label="Zoom terrain out" onClick={()=>engine.current?.zoom(1.43)}>−</button>
   <button aria-label="Orbit terrain left" onClick={()=>engine.current?.orbit(-.22)}>↶</button><button aria-label="Orbit terrain right" onClick={()=>engine.current?.orbit(.22)}>↷</button>
   <button onClick={()=>engine.current?.view('overview')}>Overview</button><button onClick={()=>engine.current?.view('detail')}>Approach</button><button onClick={()=>engine.current?.view('top')}>Overhead</button>
   <button onClick={()=>setSources(value=>!value)} aria-expanded={sources} aria-controls="terrain-sources">Sources &amp; view</button>
  </nav>
  <div className="terrain-caption">5 m source · {manifest&&status?.levels.length?status.levels.map(level=>manifest.elevationResolutionM*2**(manifest.tiles.levels-1-level)).join(' / ')+' m tiles · ':''}true height scale · regional coverage</div>
  {status?.notice&&!status.lost?<section className="terrain-notice solar-glass" role="status"><p>{status.notice}</p><button onClick={()=>engine.current?.retry()}>Retry tiles</button><button onClick={retryView}>Reload region</button></section>:null}
  {sources?<section id="terrain-sources" className="terrain-sources solar-glass" aria-label="Terrain source and view settings"><div className="terrain-panel-heading"><h2>Terrain &amp; source</h2><button onClick={()=>setSources(false)} aria-label="Close terrain sources">×</button></div>
   <label>Graphics<select value={quality} onChange={event=>setQuality(event.target.value as TerrainQuality)}><option value="balanced">Balanced</option><option value="efficient">Efficient</option></select></label>
   <label className="terrain-relief"><input type="checkbox" checked={relief} onChange={event=>setRelief(event.target.checked)}/>Relief inspection</label>
   <p>{relief?'Gray measured geometry with fixed illustrative lighting; this is not sunlight at the selected epoch.':'Original orthomosaic on measured geometry. Historical image shadows remain; this is not illumination at the selected epoch.'}</p>
   <p>{epoch} · UTC retained for your return</p>
   {manifest?<><p>{manifest.elevationResolutionM} m elevation posts · {manifest.imageryResolutionM} m imagery pixels. {(manifest.extentM[0]/1000).toFixed(2)} × {(manifest.extentM[1]/1000).toFixed(2)} km coverage.</p><p>Planetocentric, east-positive · {manifest.radiusM.toLocaleString()} m lunar sphere.</p><p>{manifest.frame} · {manifest.heightDatum}</p><p>Levels refine with camera distance. Zooming past source sampling adds no measured detail.</p>{manifest.limitations.map((limit,index)=><p key={index}>{limit}</p>)}{manifest.sources.map(source=><p key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.id}</a> · {source.license}</p>)}</>:null}
   <p><a href="https://github.com/NASA-AMMOS/3DTilesRendererJS/tree/v0.5.3" target="_blank" rel="noreferrer">NASA AMMOS 3D Tiles Renderer 0.5.3</a> · Apache-2.0</p><p>Drag to orbit; two fingers or right-drag to pan; pinch or scroll to zoom. Focus the scene for arrow keys, + / − and Home. Reduced motion removes camera damping.</p>
  </section>:null}
 </div>
}
