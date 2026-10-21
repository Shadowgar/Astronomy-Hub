import React,{useEffect,useRef,useState}from'react'
import{useLocation,useNavigate}from'react-router-dom'
import{waitForRuntimeDisposal}from'../sky-engine/RuntimeHost'
import{parseSceneDate,useRuntimeProductState}from'../runtime/productState'
import{loadSolarSnapshot,planetIntent,negotiatePlanet,solarReturnPath,type SolarSnapshot,type BodyId}from'./solarContracts'
import{mountSolarScene,type SolarScene}from'./SolarScene'
import'../workspace/workspace.css'
import'./solar.css'
declare global{interface Window{orasSolarDiagnostics?:()=>unknown}}
export default function SolarWorkspace(){
 const location=useLocation(),navigate=useNavigate(),host=useRef<HTMLDivElement>(null),engine=useRef<SolarScene|null>(null),heading=useRef<HTMLHeadingElement>(null)
 const params=new URLSearchParams(location.search),epoch=parseSceneDate(params.get('date'))||parseSceneDate(useRuntimeProductState.getState().requestedTime)!,bodyId=(['sun','earth','mars'].includes(params.get('solarBody')||'')?params.get('solarBody'):null)as BodyId|null
 const [snapshot,setSnapshot]=useState<SolarSnapshot|null>(null),[status,setStatus]=useState('Preparing Solar System…'),[error,setError]=useState(''),[retry,setRetry]=useState(0),[draft,setDraft]=useState(epoch.slice(0,16)),[notice,setNotice]=useState(''),[reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)
 const returnContext=location.state?.solarReturn,returnPath=typeof returnContext?.path==='string'?returnContext.path:(params.get('solarFrom')==='earth'?'/earth':'/sky-engine')+location.search,selected=snapshot?.bodies.find(b=>b.source_id===bodyId)
 const latestBody=useRef(bodyId),latestPick=useRef(selectBody);latestBody.current=bodyId;latestPick.current=selectBody
 const approvedEpoch=useRef(parseSceneDate(returnContext?.state?.n1View?.utc)||useRuntimeProductState.getState().requestedTime)
 useEffect(()=>{heading.current?.focus();const old=document.title;document.title='Solar System · Astronomy Hub';const media=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(media.matches);media.addEventListener('change',change);return()=>{media.removeEventListener('change',change);document.title=old}},[])
 useEffect(()=>{setDraft(epoch.slice(0,16));setSnapshot(null);setError('');setStatus('Preparing Solar System…');const abort=new AbortController();let scene:SolarScene|null=null
  const failure=()=>{scene?.dispose();engine.current=null;setError('The Solar renderer stopped. Retry or return to your previous view.');setStatus('')}
  host.current?.addEventListener('solar-render-error',failure)
  void(async()=>{try{const [data]=await Promise.all([loadSolarSnapshot(epoch,abort.signal),waitForRuntimeDisposal()]);if(abort.signal.aborted||!host.current)return
   scene=mountSolarScene(host.current,data,reduced,id=>latestPick.current(id));engine.current=scene;window.orasSolarDiagnostics=scene.diagnostics;approvedEpoch.current=data.epoch;setSnapshot(data);setStatus('Solar System ready');useRuntimeProductState.setState({requestedTime:data.epoch});scene.focus(latestBody.current)
  }catch(cause){if(!abort.signal.aborted){setError(cause instanceof Error?cause.message:'Solar System is unavailable.');setStatus('')}}})()
  const element=host.current;return()=>{abort.abort();element?.removeEventListener('solar-render-error',failure);scene?.dispose();if(engine.current===scene)engine.current=null;if(window.orasSolarDiagnostics===scene?.diagnostics)delete window.orasSolarDiagnostics}
 },[epoch,retry,reduced])
 useEffect(()=>{engine.current?.focus(bodyId);setNotice('')},[bodyId])
 function selectBody(id:BodyId|null){const p=new URLSearchParams(location.search);p.set('date',epoch);if(id)p.set('solarBody',id);else p.delete('solarBody');navigate('/solar-system?'+p,{state:location.state})}
 function setTime(value:string){const utc=parseSceneDate(value);if(!utc){setNotice('Enter a valid UTC date and time.');return}const p=new URLSearchParams(location.search);p.set('date',utc);navigate('/solar-system?'+p,{state:location.state})}
 function leave(path=returnPath){navigate(solarReturnPath(path,approvedEpoch.current),{state:returnContext?.state})}
 return <div className="ws-shell solar-shell" data-workspace-mode="solar" data-solar-status={error?'error':snapshot?'ready':'loading'}>
  <a className="ws-skip" href="#solar-controls">Skip to Solar controls</a>
  <header className="solar-header ws-panel"><div><small className="ws-eyebrow">ASTRONOMY HUB</small><h1 ref={heading} tabIndex={-1}>Solar System</h1></div><button onClick={()=>leave()}>Return to {returnPath.startsWith('/earth')?'Earth':'Sky'}</button></header>
  <main className="solar-stage" aria-label="Solar System workspace"><div ref={host} className="solar-canvas"/>{!snapshot&&!error?<p className="solar-loading ws-panel" role="status">{status}</p>:null}</main>
  <section id="solar-controls" className="solar-context ws-panel" aria-label="Solar exploration controls">
   <small className="ws-eyebrow">SUN · EARTH · MARS</small><h2>{selected?selected.name:'Our planetary neighborhood'}</h2>
   <p className="solar-intro">Explore three bodies at a controlled astronomical epoch. Distances follow JPL; body sizes and colors are illustrative, enlarged for visibility.</p>
   <nav className="solar-bodies" aria-label="Select a celestial body">{(['sun','earth','mars']as const).map(id=><button key={id} aria-pressed={bodyId===id} disabled={!snapshot} onClick={()=>selectBody(id)}>{id[0].toUpperCase()+id.slice(1)}</button>)}</nav>
   <div className="solar-camera" role="group" aria-label="Solar camera"><button disabled={!snapshot} onClick={()=>selectBody(null)}>Overview</button><button disabled={!snapshot||!bodyId} onClick={()=>engine.current?.focus(bodyId)}>Focus selected</button><button aria-label="Zoom Solar view in" onClick={()=>engine.current?.zoom(.8)}>+</button><button aria-label="Zoom Solar view out" onClick={()=>engine.current?.zoom(1.25)}>−</button><button aria-label="Orbit camera left" onClick={()=>engine.current?.orbit(-Math.PI/12)}>↶</button><button aria-label="Orbit camera right" onClick={()=>engine.current?.orbit(Math.PI/12)}>↷</button></div>
   {selected?<div className="solar-details" aria-label="Selected body details"><p>{selected.position_reference} · target {selected.ephemeris_target}</p><dl><div><dt>Distance from Sun</dt><dd>{Math.hypot(...selected.position_au).toFixed(6)} AU</dd></div><div><dt>Reference radius</dt><dd>{selected.shape.mean_radius_km.toLocaleString()} km</dd></div></dl><p>Rotation and surface coordinates are not qualified in this view.</p><button onClick={()=>{const intent=planetIntent(snapshot!,selected,returnPath,crypto.randomUUID());const result=negotiatePlanet(intent,{bodyIds:[],frames:[]},false);setNotice(result.status==='unavailable'?result.reason:'Visit cancelled.')}}>Planet View availability</button></div>:null}
   <form className="solar-time" onSubmit={e=>{e.preventDefault();setTime(draft+':00.000Z')}}><label>Epoch (UTC)<input aria-label="Epoch (UTC)" type="datetime-local" value={draft} onChange={e=>setDraft(e.target.value)} required/></label><button type="submit">Apply epoch</button></form>
   <div className="solar-time-steps"><button onClick={()=>setTime(new Date(Date.parse(epoch)-86400000).toISOString())}>−1 day</button><button onClick={()=>setTime(new Date(Date.parse(epoch)+86400000).toISOString())}>+1 day</button></div>
   <p className="solar-epoch"><time dateTime={epoch}>{epoch.replace('T',' ').replace('Z',' UTC')}</time></p>
   {error?<div role="alert"><p>{error}</p><button onClick={()=>setRetry(n=>n+1)}>Retry Solar System</button></div>:<p className="ws-sr-only" role="status">{status}. {selected?selected.name+' selected.':''}</p>}
   {notice?<p role="status">{notice}</p>:null}
   <details className="solar-science"><summary>Science, scale &amp; sources</summary><p>Sun-centered ICRF vectors, AU; geometric positions without light-time correction. UTC input is converted to kernel dynamical time. Open lines sample previous source positions: Earth365.25 days and Mars687 days; they are not exact closed ellipses.</p><p>Mars is anchored to its system barycenter. No planetary surface, surveyed texture or measured orientation is shown. Lighting is illustrative. Other planets and moons are outside this first slice.</p><p>Positions: NASA/JPL {snapshot?.source.release||'DE442s'}. Physical radius context: NASA/NSSDC and IAU2015. Procedural glyphs; no external imagery assets. Earth imagery/source availability stays in Earth.</p><p>Solar rendering uses Three.js. <a href="/licenses/three-MIT.txt" target="_blank" rel="noreferrer">MIT license and copyright notice</a>.</p><a href="https://ssd.jpl.nasa.gov/planets/eph_export.html" target="_blank" rel="noreferrer">JPL ephemeris information</a></details>
  </section>
  <footer className="solar-guide ws-panel">Drag to orbit · scroll / pinch to zoom · explicit camera buttons support keyboard navigation{reduced?' · Reduced motion':''}</footer>
 </div>
}
