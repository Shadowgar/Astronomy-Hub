import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ORAS_SITE } from '../../config/orasSite'
import { useObserveSkyQuery } from '../observe/queries'
import { getObserveContext, skyEngineUrlForObject, type ObservePayload, type ObservabilityContext } from '../observe/model'
import { useTonightQuery } from '../tonight/queries'
import { duration, formatNightTime, identityKey, type TonightPayload } from '../tonight/model'

const HOME_CONTEXT = getObserveContext('')
function compass(az: number) { return ['N','NE','E','SE','S','SW','W','NW'][Math.round(((az%360)+360)%360/45)%8] }
function timeLabel(value: string) { return formatNightTime(value) }

export function TonightSummary({payload}: {payload: TonightPayload}) {
  const {night, targets, forecast} = payload.data
  // The backend chooses both identities and ordering; Home only bounds presentation.
  const top = payload.data.top_opportunities.flatMap(id => targets.filter(t => identityKey(t)===identityKey(id))).slice(0,3)
  const clouds = ['available','partial'].includes(forecast.status)
    ? forecast.hours.flatMap(h => typeof h.cloud_cover_pct==='number' && Number.isFinite(h.cloud_cover_pct) ? [h.cloud_cover_pct] : []) : []
  const forecastLabel = clouds.length ? `${Math.min(...clouds)}–${Math.max(...clouds)}% clouds` : `Forecast ${forecast.status==='stale' ? 'stale' : 'unavailable'}`
  return <>
    <p className="oras-caption">Observing evening {night.night_date} · ORAS local time</p>
    <dl className="oras-fact-grid">
      <div><dt>Astronomical darkness</dt><dd>{night.status==='available' ? duration(night.dark_duration_minutes) : night.status==='no_astronomical_darkness' ? 'No astronomical darkness' : 'Unavailable'}</dd></div>
      <div><dt>Moon at night midpoint</dt><dd>{night.moon ? `${Math.round(night.moon.illumination_fraction*100)}% illuminated` : 'Unavailable'}</dd></div>
      <div><dt>Hourly forecast</dt><dd>{forecastLabel}</dd></div>
    </dl>
    {night.astronomical_darkness.map(window => <p className="oras-caption" key={window.start}>{timeLabel(window.start)} – {timeLabel(window.end)}</p>)}
    {forecast.status==='partial' ? <p className="oras-caption">Partial forecast · some hours or fields unavailable.</p> : null}
    {payload.status==='partial' ? <p className="oras-status">Some astronomy data could not be evaluated.</p> : null}
    {top.length ? <div className="home-opportunities">{top.map(target => <article className="oras-target" key={identityKey(target)}>
      <span className="oras-eyebrow">{target.type.replace(/_/g,' ')}</span>
      <h3>{target.name}</h3>
      <p><strong>{target.opportunity.peak_altitude_deg.toFixed(0)}° at peak</strong></p>
      <p className="oras-caption">{timeLabel(target.opportunity.peak_time)}</p>
      <a href={target.sky_engine_url}>Open in Sky <span aria-hidden="true">↗</span></a>
    </article>)}</div> : <p className="oras-status">{night.status==='ephemeris_unavailable' ? 'Night astronomy unavailable.' : 'No supported opportunities during astronomical darkness.'}</p>}
  </>
}

export function ObserveSummary({payload}: {payload: ObservePayload}) {
  return <>
    <p className="oras-caption">Sky positions at {timeLabel(payload.time)} · Geometric horizon</p>
    {payload.objects.length ? <div className="home-observe-list">{payload.objects.slice(0,4).map(object => {
      const url=skyEngineUrlForObject(object)
      return <article className="home-observe-row" key={identityKey(object)}>
        <div><span className="oras-eyebrow">{object.object_type_label || object.type.replace(/_/g,' ')}</span><h3>{object.name}</h3></div>
        <div className="home-position"><strong>{object.alt.toFixed(0)}° up</strong><span>{compass(object.az)}</span></div>
        {url ? <a href={url} aria-label={`Open ${object.name} in Sky`}>Sky <span aria-hidden="true">↗</span></a> : <span className="oras-caption">Sky link unavailable</span>}
      </article>
    })}</div> : <p className="oras-status">No supported objects are above the geometric horizon right now.</p>}
  </>
}

export function ConditionsSummary({weather}: {weather?: ObservabilityContext['weather']}) {
  const fresh=weather?.status==='current_fresh'
  if(!fresh) return <p className="oras-status">{weather?.status==='stale' ? 'Current conditions are stale. Fresh weather facts are unavailable.' : 'Current conditions unavailable.'}</p>
  const facts: [string,number | undefined,string][] = [
    ['Clouds',weather.cloud_cover_pct,'%'],['Temperature',weather.temperature_c,'°C'],
    ['Humidity',weather.humidity_pct,'%'],['Wind',weather.wind_mph,' mph'],['Dew point',weather.dew_point_c,'°C'],
  ]
  return <>
    <dl className="oras-fact-grid home-weather-facts">{facts.map(([label,value,unit]) => <div key={label}><dt>{label}</dt><dd>{typeof value==='number' && Number.isFinite(value) ? `${value}${unit}` : 'Unavailable'}</dd></div>)}</dl>
    <p className="oras-caption">Open-Meteo · Current weather{weather.last_updated ? ` · Updated ${timeLabel(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(weather.last_updated) ? weather.last_updated : `${weather.last_updated}Z`)}` : ' · Observation time unavailable'}</p>
    <p className="oras-caption">Weather facts describe current conditions. They do not predict target detectability.</p>
  </>
}

function TonightModule() {
  const query=useTonightQuery()
  return <section className="oras-panel home-tonight" aria-labelledby="home-tonight-title">
    <div className="oras-section-heading"><div><p className="oras-eyebrow">Plan your evening</p><h2 id="home-tonight-title">Tonight at ORAS</h2></div><Link className="oras-text-link" to="/tonight">View tonight’s plan →</Link></div>
    {query.isPending ? <p className="oras-status" role="status">Planning tonight at ORAS…</p> : query.isError ? <div className="oras-status" role="status"><p>Tonight’s plan could not be loaded.</p><button className="oras-button oras-button--quiet" onClick={()=>void query.refetch()}>Retry night plan</button></div> : query.data ? <TonightSummary payload={query.data}/> : <p className="oras-status">Night plan unavailable.</p>}
  </section>
}
function ObserveModule() {
  const query=useObserveSkyQuery(HOME_CONTEXT)
  return <section className="oras-panel" aria-labelledby="home-observe-title">
    <div className="oras-section-heading"><div><p className="oras-eyebrow">Look up</p><h2 id="home-observe-title">Observe now</h2></div></div>
    {query.isPending ? <p className="oras-status" role="status">Checking the sky above ORAS…</p> : query.isError ? <div className="oras-status" role="status"><p>The current sky could not be loaded.</p><button className="oras-button oras-button--quiet" onClick={()=>void query.refetch()}>Retry current sky</button></div> : query.data ? <ObserveSummary payload={query.data}/> : <p className="oras-status">Current sky unavailable.</p>}
    <Link className="oras-text-link home-module-link" to="/observe">See everything above ORAS →</Link>
  </section>
}
function ConditionsModule() {
  // Same query key as Observe: one request and the qualified current-fact contract.
  const query=useObserveSkyQuery(HOME_CONTEXT)
  return <section className="oras-panel" aria-labelledby="home-conditions-title">
    <div className="oras-section-heading"><div><p className="oras-eyebrow">At the observatory</p><h2 id="home-conditions-title">Current conditions</h2></div></div>
    {query.isPending ? <p className="oras-status" role="status">Checking current conditions…</p> : query.isError ? <p className="oras-status" role="status">Current conditions unavailable.</p> : <ConditionsSummary weather={query.data?.observabilityContext?.weather}/>}
  </section>
}
function SiteContext() {
  const [now,setNow]=useState(()=>new Date())
  useEffect(()=> {const timer=setInterval(()=>setNow(new Date()),60_000);return ()=>clearInterval(timer)},[])
  return <div className="home-site-context"><span>{ORAS_SITE.label}</span><span>{ORAS_SITE.latitude.toFixed(4)}° N · {Math.abs(ORAS_SITE.longitude).toFixed(4)}° W</span><time dateTime={now.toISOString()}>{timeLabel(now.toISOString())}</time></div>
}
export default function HomePage() {
  useEffect(()=>{const old=document.title;document.title='Astronomy Hub · ORAS';return ()=>{document.title=old}},[])
  return <div className="oras-container home-page">
    <section className="home-hero" aria-labelledby="home-title">
      <p className="oras-eyebrow">ORAS Astronomy Hub</p>
      <h1 id="home-title">The sky over the<br className="home-title-break"/> ORAS observatory</h1>
      <p className="home-hero-copy">Find what’s above you. Make a plan for the night. Explore the sky, one object at a time.</p>
      <div className="oras-actions"><Link className="oras-button" to="/observe">Observe now</Link><Link className="oras-button oras-button--quiet" to="/tonight">Plan tonight</Link><Link className="oras-text-link" to="/sky-engine">Open interactive sky →</Link></div>
      <SiteContext/>
    </section>
    <TonightModule/>
    <div className="home-context-grid"><ObserveModule/><ConditionsModule/></div>
    <section className="oras-panel home-sky" aria-labelledby="home-sky-title"><div><p className="oras-eyebrow">A different perspective</p><h2 id="home-sky-title">Interactive sky</h2><p>Explore the sky over ORAS in the interactive planetarium. Move from a target’s facts to its place among the stars.</p></div><Link className="oras-button oras-button--quiet" to="/sky-engine">Open Sky →</Link></section>
    <p className="oras-caption home-footnote">Astronomy and weather are separate facts. Geometric positions do not account for terrain, trees, buildings, or equipment.</p>
  </div>
}
