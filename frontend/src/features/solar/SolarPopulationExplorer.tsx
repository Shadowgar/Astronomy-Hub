import {useEffect,useRef,useState} from 'react'
import type {PopulationKind,PopulationSummary,PopulationSearchRow} from './solarPopulations'
import type {SolarPopulationStatus} from './SolarPopulationLayer'
import './SolarPopulationExplorer.css'

export type SolarPopulationExplorerProps={summary:PopulationSummary|null;status?:SolarPopulationStatus|null;population:'asteroid-belt'|'trans-neptunian'|null;onPopulation:(population:'asteroid-belt'|'trans-neptunian'|null)=>void;query:(query:string,population?:PopulationKind)=>Promise<PopulationSearchRow[]>;detail:(sourceIndex:number)=>Promise<PopulationSearchRow>;selected?:PopulationSearchRow|null;onSelect?:(row:PopulationSearchRow)=>void;destinationSourceIds?:readonly string[];onFocusDestination?:(sourceId:string)=>void}
const labels:Record<PopulationKind,string>={'asteroid-belt':'Asteroid belt','trans-neptunian':'Trans-Neptunian objects',comets:'Comets'}
const number=(value:number|null,digits=3)=>value===null?'Unavailable':value.toLocaleString(undefined,{maximumFractionDigits:digits})

/** Catalog metadata is text. A focus action exists only for an explicit qualified
 * destination join provided by the owner, never an invented orbit or nucleus. */
export function SolarPopulationExplorer(props:SolarPopulationExplorerProps){
 const [search,setSearch]=useState(''),[category,setCategory]=useState<PopulationKind|'all'>('all'),[rows,setRows]=useState<PopulationSearchRow[]>([]),[selected,setSelected]=useState<PopulationSearchRow|null>(props.selected??null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null)
 const actions=useRef(props);actions.current=props
 const selectionGeneration=useRef(0),mounted=useRef(true)
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;selectionGeneration.current++}},[])
 useEffect(()=>{if(props.selected!==undefined){selectionGeneration.current++;setSelected(props.selected)}},[props.selected])
 useEffect(()=>{
  let current=true;setRows([]);setError(null)
  if(!props.summary){setBusy(false);return()=>{current=false}}
  setBusy(true)
  const timer=setTimeout(()=>{void actions.current.query(search,category==='all'?undefined:category).then(results=>{if(current){setRows(results.slice(0,40));setBusy(false)}}).catch(()=>{if(current){setError('Catalog search is unavailable.');setBusy(false)}})},150)
  return()=>{current=false;clearTimeout(timer)}
 },[search,category,props.summary?.packSha256])
 async function choose(row:PopulationSearchRow){
  const generation=++selectionGeneration.current;setError(null)
  try{const value=await actions.current.detail(row.sourceIndex);if(!mounted.current||generation!==selectionGeneration.current)return
   if(value.sourceIndex!==row.sourceIndex||value.body.source_id!==row.body.source_id)throw Error('Source identity mismatch')
   setSelected(value);actions.current.onSelect?.(value)
  }catch{if(mounted.current&&generation===selectionGeneration.current)setError('Selected source details are unavailable.')}
 }
 const body=selected?.body,canFocus=!!body&&!!props.onFocusDestination&&!!props.destinationSourceIds?.includes(body.source_id),clock=props.status?.requestedJdTdb
 const withinPolicy=body?.coverage&&clock!==null&&clock!==undefined&&clock>=body.coverage.start_jd_tdb&&clock<=body.coverage.end_jd_tdb
 return <details className="solar-population-explorer solar-glass">
  <summary>Discover small bodies {props.summary?<span>{props.summary.bodyCount.toLocaleString()} records</span>:null}</summary>
  <div className="solar-population-content">
   <p>Source-backed catalog discovery. Symbols show bounded orbit approximations; they are not physical-size rocks.</p>
   <label>Population symbols<select aria-label="Population symbols" value={props.population??'off'} onChange={event=>props.onPopulation(event.target.value==='off'?null:event.target.value as 'asteroid-belt'|'trans-neptunian')}><option value="off">Hidden</option><option value="asteroid-belt">Asteroid belt</option><option value="trans-neptunian">Trans-Neptunian objects</option></select></label>
   <p role="status">{props.status?.message??(props.summary?'Catalog ready.':'Loading source catalog…')}{props.status?.drawnCount?` ${props.status.drawnCount.toLocaleString()} symbols drawn.`:''}</p>
   {props.population&&props.status?.displayedJdTdb!==null&&props.status?.displayedJdTdb!==undefined?<p className="solar-population-source-time">Symbol epoch JD{props.status.displayedJdTdb.toFixed(6)} TDB{props.status.lagSeconds!==null&&Math.abs(props.status.lagSeconds)>1?` · sampled ${number(Math.abs(props.status.lagSeconds),0)} simulation seconds ${props.status.lagSeconds>=0?'behind':'ahead of'} the clock`:''}. No extrapolation.</p>:null}
   <label>Find a catalog object<input aria-label="Find a catalog object" type="search" maxLength={120} placeholder="Name, designation or SPK ID" value={search} onChange={event=>setSearch(event.target.value)} disabled={!props.summary}/></label>
   <label>Catalog category<select aria-label="Catalog category" value={category} onChange={event=>setCategory(event.target.value as PopulationKind|'all')} disabled={!props.summary}><option value="all">All catalog records</option>{(['asteroid-belt','trans-neptunian','comets'] as PopulationKind[]).map(population=><option key={population} value={population}>{labels[population]}{props.summary?` · ${props.summary.counts[population].catalog.toLocaleString()}`:''}</option>)}</select></label>
   {busy?<p role="status">Searching source catalog…</p>:null}{error?<p role="status">{error}</p>:null}
   {!busy&&props.summary&&!rows.length&&!error?<p>No matching records in this bounded source subset.</p>:null}
   <ol className="solar-population-results" aria-label="Catalog search results">{rows.map(row=><li key={row.body.source_id}><button type="button" aria-pressed={selected?.body.source_id===row.body.source_id} onClick={()=>void choose(row)}><span>{row.body.name}</span><small>{row.body.orbit_class} · SPK {row.body.source_id}{row.body.representation==='catalog-only'?' · catalog only':''}</small></button></li>)}</ol>
   {rows.length===40?<p>First 40 matches in source order. Narrow the search to find more.</p>:null}
   {body?<section className="solar-population-details" aria-label="Selected catalog object"><h3>{body.name}</h3><dl>
    <dt>Identity</dt><dd>{body.catalog} · {body.source_id}</dd><dt>Source designation</dt><dd>{body.designation}</dd><dt>Source orbit class</dt><dd>{body.orbit_class} · {body.orbit_domain}</dd>
    <dt>Element epoch</dt><dd>JD{body.elements.epoch_jd_tdb} TDB</dd><dt>Diameter</dt><dd>{body.diameter_km===null?'Unavailable':`${number(body.diameter_km)} km`}</dd><dt>Absolute magnitude H</dt><dd>{number(body.absolute_magnitude)}</dd>
    <dt>Orbit condition code</dt><dd>{body.uncertainty.condition_code??'Unavailable'}</dd><dt>Observation arc</dt><dd>{body.uncertainty.data_arc_days===null?'Unavailable':`${number(body.uncertainty.data_arc_days,0)} days`}</dd><dt>Observations</dt><dd>{number(body.uncertainty.observations_used,0)}</dd>
   </dl>
    {body.population==='trans-neptunian'?<p>TNO is the source's coarse orbit class. No classical, resonant or scattered subclass is assigned here.</p>:null}
    {body.coverage?<p>Approximation policy: JD{body.coverage.start_jd_tdb}–{body.coverage.end_jd_tdb} TDB. {withinPolicy?'The current clock is within that interval.':'No population position is qualified at the current clock.'} This interval is not a JPL accuracy guarantee; perturbations are omitted.</p>:<p>{body.unavailable_reason}</p>}
    {canFocus?<button type="button" onClick={()=>props.onFocusDestination?.(body.source_id)}>Visit qualified destination</button>:<p>Discovery record only; a precise destination has not been qualified for this object.</p>}
   </section>:null}
   <p className="solar-population-source-note">Magnitude-ranked belt and TNO subsets, plus bounded comet discovery. Missing records are not evidence that an object does not exist. Comets have no position in this approximate symbol layer. Quality changes the number of symbols, preserving source identity.</p>
   {props.summary?<p>Source snapshot {props.summary.acquiredUtc.slice(0,10)} · {props.summary.qualification.sampleCount} representative Horizons comparisons. Maximum sampled difference {number(props.summary.qualification.maxComparisonErrorKm,0)} km; no population-wide accuracy claim.</p>:null}
  </div>
 </details>
}
