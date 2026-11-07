import React from 'react'
import {celestialAppearance} from '../celestial/celestialAssets'
import type {SolarDestination} from './solarDestinations'
import type {Vector} from './solarContracts'

export function SolarDestinationCard({body,position,expanded,onExpand,onFocus,onSystem,onTrajectory}:{body:SolarDestination;position?:Vector;expanded:boolean;onExpand:()=>void;onFocus:()=>void;onSystem:()=>void;onTrajectory:()=>void}){
 const appearance=celestialAppearance(body.id),available=!!position&&body.status==='qualified'
 return <section className="solar-context solar-glass" aria-label="Selected destination details" data-expanded={expanded}>
  <div className="solar-object-heading"><span className={'solar-mini-body solar-mini-'+body.id} aria-hidden="true"/><div><small>{body.classification.replaceAll('-',' ').toUpperCase()}</small><h2>{body.name}</h2></div><button className="solar-icon-button" aria-label={expanded?'Collapse body details':'Expand body details'} aria-expanded={expanded} onClick={onExpand}>⌄</button></div>
  <p className="solar-object-intro">{appearance?.disclosure??(body.id==='eris'?'A distant dwarf planet. Its surface remains unresolved; the reference globe has no invented terrain.':'Source trajectory available. A physical nucleus size is not qualified.')}</p>
  <p className="solar-destination-status">{body.id==='pluto'?'New Horizons mosaic · black areas are unobserved':body.classification==='comet'?'Nucleus and trajectory · activity unqualified':appearance?'Mission source model':'Unresolved reference body'}</p>
  {available?<dl className="solar-distance"><dt>Distance from Sun</dt><dd>{Math.hypot(...position!).toFixed(4)} <span>AU</span></dd></dl>:<p role="status">{body.reason??'Position window loading. Choose a supported time to continue.'}</p>}
  {expanded?<div className="solar-details"><p>Displayed trajectory: {body.sampled_coverage?.start.slice(0,16)} – {body.sampled_coverage?.end.slice(0,16)} UTC. Open sampled path, not a complete orbit.</p><dl><dt>Reference radius</dt><dd>{body.radius_km===null?'Unqualified':body.radius_km.toLocaleString()+' km'}</dd><dt>Source identity</dt><dd>{body.identity.catalog} · {body.identity.source_id}</dd><dt>Coverage</dt><dd>{body.coverage.start.slice(0,10)} – {body.coverage.end.slice(0,10)}</dd></dl><p>{body.identity.reference}</p><p>{body.surface_orientation_status}</p><p>{body.source.uncertainty}</p>{body.eccentricity!==null?<p>Orbital eccentricity {body.eccentricity.toFixed(5)} · source vectors, including open trajectories.</p>:null}<a href={body.source.url} target="_blank" rel="noreferrer">Scientific source ↗</a></div>:null}
  {body.id==='pluto'?<button className="solar-system-entry" disabled={!available} onClick={onSystem}>Explore Pluto &amp; Charon →</button>:null}
  <button className="solar-system-entry" disabled={!available} onClick={onTrajectory}>View source trajectory →</button>
  <div className="solar-object-actions"><button disabled={!available||body.radius_km===null} onClick={onFocus}>{body.classification==='comet'?'Approach nucleus':'Approach '+body.name}<span aria-hidden="true">↗</span></button></div>
 </section>
}
