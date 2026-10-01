import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ORAS_SITE } from '../../config/orasSite'
import { useTonightQuery } from './queries'
import { identityKey, nightPath, shiftNightDate, formatNightTime, duration, forecastAtPeak, type Target, type TonightPayload, type ForecastHour } from './model'
import '../observe/observe.css'
import './tonight.css'

const CATEGORY_LABELS = { 'solar-system':'Solar System','deep-sky':'Deep Sky',stars:'Stars' }
function direction(az: number) { return ['N','NE','E','SE','S','SW','W','NW'][Math.round(az/45)%8] }

function TargetCard({target,hours}: {target: Target; hours: ForecastHour[]}) {
 const o=target.opportunity
 const forecast=forecastAtPeak(target,hours)
 return <article className="observe-card tonight-card">
  <div className="observe-card-head"><span className="observe-card-type">{target.type.replace(/_/g,' ')}</span><span className="observe-card-alt">{o.peak_altitude_deg.toFixed(0)}° at peak</span></div>
  <h3>{target.name}</h3>
  <p className="tonight-peak"><time dateTime={o.peak_time}>{formatNightTime(o.peak_time)}</time></p>
  <dl className="tonight-facts">
   <div><dt>Direction at peak</dt><dd>{direction(o.peak_azimuth_deg)} · {o.peak_azimuth_deg.toFixed(0)}°</dd></div>
   <div><dt>Above horizon in darkness</dt><dd>{duration(o.dark_duration_minutes)}</dd></div>
   <div><dt>Above 20° in darkness</dt><dd>{duration(o.planning_altitude_duration_minutes)}</dd></div>
   {o.moon_separation_at_peak_deg != null ? <div><dt>Moon separation</dt><dd>{o.moon_separation_at_peak_deg.toFixed(0)}°</dd></div> : null}
   {o.moon_altitude_at_peak_deg != null ? <div><dt>Moon altitude at peak</dt><dd>{o.moon_altitude_at_peak_deg.toFixed(0)}°</dd></div> : null}
  </dl>
  {forecast?.cloud_cover_pct != null ? <p className="tonight-cloud">Clouds near peak: {forecast.cloud_cover_pct}% <span>forecast</span></p> : null}
  <p className="tonight-reason">{target.ranking.rank_reason}</p>
  <div className="observe-card-actions"><a href={target.sky_engine_url}>Open in Sky <span aria-hidden="true">↗</span></a></div>
 </article>
}

function TargetGroup({title,targets,hours}: {title:string;targets:Target[];hours:ForecastHour[]}) {
 const [count,setCount]=useState(9)
 if (!targets.length) return null
 return <section className="tonight-target-group" aria-label={title}>
  <div className="observe-intro"><div><h2>{title}</h2></div><span className="observe-count">{targets.length} opportunities</span></div>
  <div className="tonight-card-grid">{targets.slice(0,count).map(t=><TargetCard key={identityKey(t)} target={t} hours={hours}/>)}</div>
  {targets.length>count ? <button className="observe-more" onClick={()=>setCount(c=>c+9)}>Show more {title.toLowerCase()}</button> : null}
 </section>
}

export function TonightView({payload}: {payload:TonightPayload}) {
 const {night,targets,forecast}=payload.data
 const top=payload.data.top_opportunities.flatMap(identity=>targets.filter(t=>identityKey(t)===identityKey(identity)))
 const hours=forecast.status==='stale' ? [] : forecast.hours
 return <>
  <nav className="tonight-date-nav" aria-label="Night date navigation">
   <Link to={nightPath(shiftNightDate(night.night_date,-1))}>← Previous night</Link>
   <Link to={nightPath()}>Current observing night</Link>
   <Link to={nightPath(shiftNightDate(night.night_date,1))}>Next night →</Link>
  </nav>
  <section className="tonight-timeline-section" aria-labelledby="timeline-heading">
   <div className="observe-intro"><div><p className="observe-eyebrow">Evening into morning</p><h2 id="timeline-heading">Your night, at a glance</h2><p>{night.night_date} · America/New_York · All times include the local date.</p></div>
    {night.status==='available' ? <span className="observe-count">{duration(night.dark_duration_minutes)} astronomical darkness</span> : null}</div>
   {night.status==='ephemeris_unavailable' ? <p className="observe-message" role="status">Night astronomy unavailable. The local ephemeris does not cover this night or could not be loaded.</p> :
    night.status==='no_astronomical_darkness' ? <p className="observe-message">No astronomical darkness during this observing night.</p> :
    <ol className="tonight-timeline">
     {[
      ['Civil dusk',night.twilight.civil?.dusk,'civil'],['Nautical dusk',night.twilight.nautical?.dusk,'nautical'],
      ['Astronomical darkness',night.astronomical_darkness[0]?.start,'dark'],
      ['Astronomical dawn',night.twilight.astronomical?.dawn,'dark'],['Nautical dawn',night.twilight.nautical?.dawn,'nautical'],['Civil dawn',night.twilight.civil?.dawn,'civil'],
     ].map(([label,time,kind])=><li className={`tonight-timeline-${kind}`} key={label as string}><strong>{label}</strong><time dateTime={time || undefined}>{formatNightTime(time)}</time></li>)}
    </ol>}
   <p className="tonight-caption">Twilight boundaries use Sun altitude −6°, −12°, and −18°. Astronomical night begins at −18°.</p>
  </section>
  <div className="tonight-context-grid">
   <section className="tonight-context" aria-labelledby="moon-heading"><p className="observe-eyebrow">Local ephemeris</p><h2 id="moon-heading">Moon tonight</h2>
    {night.moon ? <><div className="tonight-moon-value">{Math.round(night.moon.illumination_fraction*100)}% <span>illuminated</span></div>
     <p>{night.moon.altitude_deg.toFixed(0)}° altitude at {formatNightTime(night.moon.time)}.</p><p className="tonight-caption">At the midpoint of astronomical darkness. Each target also shows Moon geometry at its own peak.</p></> : <p>Moon geometry unavailable.</p>}
   </section>
   <section className="tonight-context" aria-labelledby="forecast-heading"><p className="observe-eyebrow">Open-Meteo · hourly facts</p><h2 id="forecast-heading">Forecast tonight</h2>
    {forecast.status==='unavailable' ? <p role="status">Forecast unavailable for this night. Your astronomy plan is still available when the local ephemeris covers it.</p> : forecast.status==='stale' ? <p role="status">Forecast stale. Fresh hourly facts are unavailable.</p> : <>
     {forecast.status==='partial' ? <p role="status">Partial forecast — some hours or fields are unavailable.</p> : null}
     <p className="tonight-caption">Coverage: {formatNightTime(forecast.coverage_start)} – {formatNightTime(forecast.coverage_end)}.<br/>Fetched: {formatNightTime(forecast.fetched_at)}. Model generation time unavailable.</p>
     <div className="tonight-forecast-scroll" tabIndex={0} role="region" aria-label="Hourly forecast">
      <table><thead><tr><th>Local time</th><th>Clouds</th><th>Temperature</th><th>Rain probability</th><th>Wind</th></tr></thead><tbody>
       {hours.map(h=><tr key={h.time}><th scope="row">{formatNightTime(h.time)}</th><td>{h.cloud_cover_pct != null ? `${h.cloud_cover_pct}%`:'—'}</td><td>{h.temperature_c != null ? `${h.temperature_c}°C`:'—'}</td><td>{h.precipitation_probability_pct != null ? `${h.precipitation_probability_pct}%`:'—'}</td><td>{h.wind_kmh != null ? `${h.wind_kmh} km/h`:'—'}</td></tr>)}
      </tbody></table>
     </div>
    </>}
   </section>
  </div>
  {payload.status==='partial' ? <p className="observe-message" role="status">Some astronomy data could not be evaluated. This plan includes the targets with supported calculations.</p> : null}
  {night.status==='available' && targets.length===0 ? <p className="observe-message">No supported targets above the geometric horizon during astronomical darkness.</p> : null}
  <TargetGroup title="Top opportunities tonight" targets={top} hours={hours}/>
  {(Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).map(category=><TargetGroup key={`${night.night_date}:${category}`} title={CATEGORY_LABELS[category]} targets={targets.filter(t=>t.category===category)} hours={hours}/>)}
  <p className="observe-science-note">Opportunities are ordered by geometry during astronomical darkness. The 20° planning altitude is a heuristic, not a visibility threshold. Actual terrain, trees, buildings, and equipment suitability are not modeled. Forecast does not change the ordering.</p>
 </>
}

export default function TonightPage() {
 const location=useLocation()
 const date=new URLSearchParams(location.search).get('date') || undefined
 const query=useTonightQuery(date)
 useEffect(()=>{const old=document.title;document.title='Tonight at ORAS · Astronomy Hub';return ()=>{document.title=old}},[])
 const night=query.data?.data.night
 return <div className="observe-page tonight-page">
  <header className="observe-header"><Link to="/" className="observe-brand">ORAS <span>ASTRONOMY HUB</span></Link><nav aria-label="Tonight navigation"><Link to="/">Hub</Link><Link to="/observe">Observe</Link><span aria-current="page">Tonight</span></nav></header>
  <main>
   <section className="observe-hero"><div className="observe-hero-inner"><div><p className="observe-eyebrow">Plan an evening under the stars</p><h1>Tonight <em>at ORAS</em></h1><p className="observe-hero-copy">Find when a target reaches its highest point in astronomical darkness, then open that exact moment in Sky Engine.</p></div>
    <div className="observe-context-card"><span>Observing evening</span><strong>{night?.night_date || date || 'Current observing night'}</strong><p>{ORAS_SITE.label}</p><p>{ORAS_SITE.latitude}° N · {Math.abs(ORAS_SITE.longitude)}° W</p><p>{ORAS_SITE.elevationMeters.toFixed(1)} m elevation</p><span className="observe-context-time">Evening date · {ORAS_SITE.timezone}</span></div>
   </div></section>
   <div className="observe-body">
    {query.isPending ? <p className="observe-message" role="status">Planning the full observing night at ORAS…</p> : null}
    {query.isError ? <div className="observe-message" role="alert"><p>The night plan could not be loaded. Use a valid evening date or try again.</p><Link to="/tonight">Current observing night</Link><button onClick={()=>{void query.refetch()}}>Retry</button></div> : null}
    {query.data ? <TonightView key={night?.night_date} payload={query.data}/> : null}
   </div>
  </main><footer className="observe-footer">ORAS Astronomy Hub · Plan by the night, explore by the moment</footer>
 </div>
}
