import SkyWorkspaceLink from '../workspace/SkyWorkspaceLink'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { ORAS_SITE } from '../../config/orasSite'
import {
  categoriesForObjects,
  categoryForObject,
  getObserveContext,
  skyEngineUrlForObject,
  type ObserveCategory,
  type ObserveObject,
  type ObservePayload,
} from './model'
import { useObserveSkyQuery } from './queries'
import './observe.css'

const CATEGORY_LABELS: Record<ObserveCategory, string> = {
  all: 'All objects',
  'solar-system': 'Solar System',
  'deep-sky': 'Deep Sky',
  stars: 'Stars',
  satellites: 'Satellites',
}
const INITIAL_VISIBLE_COUNT = 18

function readableType(object: ObserveObject): string {
  return object.object_type_label || object.type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function degrees(value: number): string {
  return `${value.toFixed(1)}°`
}

function signedDegrees(value: number): string {
  return `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}°`
}

function skyStateLabel(state: string): string {
  return state === 'unknown' ? 'Sky state unavailable' : state.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase())
}

function weatherLabel(status: string, cloudCover?: number): string {
  if (status === 'not_evaluated_for_selected_time') return 'Weather not evaluated for selected time'
  if (status === 'current_fresh' && typeof cloudCover === 'number') return `Clouds ${cloudCover}%`
  return status === 'stale' ? 'Weather observation stale' : 'Weather unavailable'
}

function compass(azimuth: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return directions[Math.round(((azimuth % 360) + 360) % 360 / 45) % 8]
}

export function formatObserveTime(value: string, isOras: boolean): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time unavailable'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: isOras ? 'America/New_York' : 'UTC', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(date)
}

function coordinate(value: number, axis: 'latitude' | 'longitude'): string {
  const direction = axis === 'latitude' ? (value < 0 ? 'S' : 'N') : (value < 0 ? 'W' : 'E')
  return `${Math.abs(value).toFixed(6)}° ${direction}`
}

function objectKey(object: ObserveObject): string {
  return `${object.catalog}\0${object.source_id}\0${object.model}`
}

interface ObserveViewProps {
  payload?: ObservePayload
  loading?: boolean
  error?: boolean
  category: ObserveCategory
  selectedKey: string | null
  visibleCount: number
  isOras: boolean
  timeOverride?: boolean
  onCategoryChange: (category: ObserveCategory) => void
  onSelect: (key: string) => void
  onShowMore: () => void
  onRetry: () => void
}

export function ObserveView({
  payload, loading = false, error = false, category, selectedKey, visibleCount, isOras, timeOverride = false,
  onCategoryChange, onSelect, onShowMore, onRetry,
}: ObserveViewProps) {
  const allObjects = payload?.objects || []
  const categories = categoriesForObjects(allObjects)
  const activeCategory = categories.includes(category) ? category : 'all'
  const filtered = activeCategory === 'all'
    ? allObjects
    : allObjects.filter((object) => categoryForObject(object) === activeCategory)
  const visible = filtered.slice(0, visibleCount)
  const selected = filtered.find((object) => objectKey(object) === selectedKey) || filtered[0] || null
  const selectedUrl = selected ? skyEngineUrlForObject(selected) : null

  return (
    <>
      <section className="observe-intro" aria-labelledby="observe-list-heading">
        <div>
          <p className="observe-eyebrow">{timeOverride ? 'Selected sky inventory' : 'Live sky inventory'}</p>
          <h2 id="observe-list-heading">{timeOverride ? 'Above the Horizon at Selected Time' : 'Above the Horizon Now'}</h2>
          <p>Source-backed objects above the horizon {isOras ? 'at ORAS' : 'at this location'}.</p>
        </div>
        {payload ? <span className="observe-count">{allObjects.length} objects in view</span> : null}
      </section>

      {payload?.observabilityContext ? (
        <section className="observe-observing-summary" aria-label="Observing context summary">
          <div><span>Sky</span><strong>{skyStateLabel(payload.observabilityContext.sky_darkness.state)}</strong></div>
          <div><span>Sun</span><strong>{payload.observabilityContext.sky_darkness.sun_altitude_deg === null ? 'Unavailable' : signedDegrees(payload.observabilityContext.sky_darkness.sun_altitude_deg)}</strong></div>
          <div><span>Moon</span><strong>{payload.observabilityContext.moon.above_geometric_horizon === false ? 'Below horizon' : payload.observabilityContext.moon.altitude_deg === null ? 'Unavailable' : `${signedDegrees(payload.observabilityContext.moon.altitude_deg)} altitude`}</strong></div>
          <div><span>Weather</span><strong>{weatherLabel(payload.observabilityContext.weather.status, payload.observabilityContext.weather.cloud_cover_pct)}</strong></div>
        </section>
      ) : null}

      {loading ? <div className="observe-message" role="status">{isOras ? 'Loading the sky above ORAS…' : 'Loading the sky above this location…'}</div> : null}
      {error ? (
        <div className="observe-message observe-message--error" role="alert">
          <strong>{timeOverride ? 'Observing data for the selected time could not be loaded.' : 'Current observing data could not be loaded.'}</strong>
          <span>Check the connection and try again.</span>
          <button type="button" onClick={onRetry}>Retry</button>
        </div>
      ) : null}

      {!loading && !error && payload ? (
        <>
          {allObjects.length > 0 ? (
            <div className="observe-filters" aria-label="Object categories">
              {categories.map((item) => {
                const count = item === 'all' ? allObjects.length
                  : allObjects.filter((object) => categoryForObject(object) === item).length
                return (
                  <button
                    key={item} type="button" aria-pressed={activeCategory === item}
                    onClick={() => onCategoryChange(item)}
                  >
                    {CATEGORY_LABELS[item]} <span>{count}</span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <div className="observe-message">{timeOverride ? 'No matching objects are above the horizon at the selected time.' : 'No matching objects are currently above the horizon.'}</div>
          ) : (
            <div className="observe-content">
              <div className="observe-results">
                <div className="observe-results-heading">
                  <h3>{CATEGORY_LABELS[activeCategory]}</h3>
                  <span>{timeOverride ? 'Altitude · azimuth at selected time' : 'Current altitude · azimuth'}</span>
                </div>
                <div className="observe-card-grid">
                  {visible.map((object) => {
                    const key = objectKey(object)
                    const skyUrl = skyEngineUrlForObject(object)
                    return (
                      <article className={`observe-card${key === objectKey(selected as ObserveObject) ? ' observe-card--selected' : ''}`} key={key}>
                        <div className="observe-card-head">
                          <span className="observe-card-type">{readableType(object)}</span>
                          <span className="observe-card-alt">{degrees(object.alt)} up</span>
                        </div>
                        <h4>{object.name}</h4>
                        <div className="observe-card-facts">
                          <span>Az {degrees(object.az)} {compass(object.az)}</span>
                          {typeof object.magnitude === 'number' ? <span>Catalog mag. {object.magnitude.toFixed(1)}</span> : null}
                        </div>
                        {object.reason ? <p className="observe-card-reason">{object.reason}</p> : null}
                        <div className="observe-card-actions">
                          <button type="button" onClick={() => onSelect(key)} aria-label={`Details for ${object.name}`}>View details</button>
                          {skyUrl ? <SkyWorkspaceLink href={skyUrl}>Open in Sky <span aria-hidden="true">↗</span></SkyWorkspaceLink> : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
                {filtered.length > visible.length ? (
                  <button className="observe-more" type="button" onClick={onShowMore}>
                    Show more objects <span>({filtered.length - visible.length} remaining)</span>
                  </button>
                ) : null}
              </div>

              {selected ? (
                <aside id="observe-selected-detail" className="observe-detail" aria-label="Selected object detail">
                  <div className="observe-detail-head">
                    <span className="observe-card-type">{readableType(selected)}</span>
                    <h3>{selected.name}</h3>
                    {selected.constellation ? <p>Constellation: {selected.constellation}</p> : null}
                  </div>
                  {selected.reason ? (
                    <section>
                      <h4>Overview</h4>
                      <p>{selected.reason}</p>
                    </section>
                  ) : null}
                  <section>
                    <h4>{timeOverride ? 'Sky Position at Selected Time' : 'Current Sky Position'}</h4>
                    <dl className="observe-detail-facts">
                      <div><dt>Altitude</dt><dd>{degrees(selected.alt)}</dd></div>
                      <div><dt>Azimuth</dt><dd>{degrees(selected.az)} {compass(selected.az)}</dd></div>
                      {typeof selected.magnitude === 'number' ? (
                        <div><dt>Catalog magnitude</dt><dd>{selected.magnitude.toFixed(1)}</dd></div>
                      ) : null}
                      {selected.angular_size?.major_arcmin ? (
                        <div><dt>Angular size</dt><dd>{selected.angular_size.major_arcmin.toFixed(1)}′</dd></div>
                      ) : null}
                    </dl>
                  </section>
                  <section>
                    <h4>Identifiers</h4>
                    <p className="observe-identifier">{selected.catalog} · {selected.source_id}</p>
                    {selected.aliases?.length ? <p>Also known as {selected.aliases.slice(0, 3).join(', ')}</p> : null}
                  </section>
                  {payload.observabilityContext ? (
                    <section>
                      <h4>Observing Context</h4>
                      <dl className="observe-detail-facts">
                        <div><dt>Geometric horizon</dt><dd>{(selected.above_geometric_horizon ?? selected.is_visible) ? 'Above' : 'Below'}</dd></div>
                        <div><dt>Sky state</dt><dd>{skyStateLabel(payload.observabilityContext.sky_darkness.state)}</dd></div>
                        <div><dt>Sun altitude</dt><dd>{payload.observabilityContext.sky_darkness.sun_altitude_deg === null ? 'Unavailable' : signedDegrees(payload.observabilityContext.sky_darkness.sun_altitude_deg)}</dd></div>
                        <div><dt>Moon separation</dt><dd>{selected.observability?.moon_angular_separation_deg == null ? 'Unavailable' : degrees(selected.observability.moon_angular_separation_deg)}</dd></div>
                        <div><dt>Moon altitude</dt><dd>{payload.observabilityContext.moon.altitude_deg === null ? 'Unavailable' : signedDegrees(payload.observabilityContext.moon.altitude_deg)}</dd></div>
                        <div><dt>Actual site horizon</dt><dd>Not modeled</dd></div>
                        <div><dt>Weather</dt><dd>{weatherLabel(payload.observabilityContext.weather.status, payload.observabilityContext.weather.cloud_cover_pct)}</dd></div>
                      </dl>
                      <p>Above the geometric horizon does not account for local terrain, trees, or buildings.</p>
                      {payload.observabilityContext.weather.status === 'not_evaluated_for_selected_time' ? <p>Current weather is not applied to this selected observing time.</p> : null}
                    </section>
                  ) : null}
                  {selectedUrl ? <SkyWorkspaceLink className="observe-detail-cta" href={selectedUrl}>Open {selected.name} in Sky <span aria-hidden="true">↗</span></SkyWorkspaceLink> : null}
                  <p className="observe-detail-note">Catalog magnitudes may use different photometric bands. Altitude is a geometric horizon measure.</p>
                </aside>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </>
  )
}

export default function ObservePage() {
  const location = useLocation()
  const context = useMemo(() => getObserveContext(location.search), [location.search])
  const query = useObserveSkyQuery(context)
  const [category, setCategory] = useState<ObserveCategory>('all')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)
  const payload = query.data

  useEffect(() => {
    setCategory('all')
    setSelectedKey(null)
    setVisibleCount(INITIAL_VISIBLE_COUNT)
  }, [location.search])

  useEffect(() => {
    if (payload && !categoriesForObjects(payload.objects).includes(category)) {
      setCategory('all')
      setSelectedKey(null)
      setVisibleCount(INITIAL_VISIBLE_COUNT)
    }
  }, [payload, category])

  useEffect(() => {
    const previousTitle = document.title
    document.title = context.isOras ? 'Observe at ORAS · Astronomy Hub' : 'Observe · Astronomy Hub'
    return () => { document.title = previousTitle }
  }, [context.isOras])

  return (
    <div className="observe-page">
        <section className="observe-hero">
          <div className="observe-hero-inner">
            <div>
              <p className="observe-eyebrow">{context.isOras ? 'The sky from our observatory' : 'The sky from this location'}</p>
              <h1>Observe <em>{context.isOras ? 'at ORAS' : 'this sky'}</em></h1>
              <p className="observe-hero-copy">Find what is above the horizon, read its {context.at ? 'sky position at the selected time' : 'current sky position'}, and open the exact object in Sky Engine.</p>
            </div>
            <div className="observe-context-card">
              <span>Observing site</span>
              <strong>{context.isOras ? ORAS_SITE.label : 'Custom location'}</strong>
              <p>{coordinate(context.latitude, 'latitude')} · {coordinate(context.longitude, 'longitude')}</p>
              <p>{context.elevationMeters === undefined ? 'Elevation not specified' : `${context.elevationMeters.toFixed(1)} m elevation`}</p>
              <span className="observe-context-time">{payload ? formatObserveTime(payload.time, context.isOras) : `${context.at ? 'Selected' : 'Current'} sky · ${context.isOras ? 'ORAS local time' : 'UTC'}`}</span>
            </div>
          </div>
        </section>
        <div className="observe-body">
          <ObserveView
            payload={payload} loading={query.isPending} error={query.isError}
            category={category} selectedKey={selectedKey} visibleCount={visibleCount}
            isOras={context.isOras} timeOverride={Boolean(context.at)}
            onCategoryChange={(next) => { setCategory(next); setSelectedKey(null); setVisibleCount(INITIAL_VISIBLE_COUNT) }}
            onSelect={(key) => {
              setSelectedKey(key)
              if (window.matchMedia('(max-width: 740px)').matches) {
                requestAnimationFrame(() => document.getElementById('observe-selected-detail')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }))
              }
            }}
            onShowMore={() => setVisibleCount((count) => count + INITIAL_VISIBLE_COUNT)}
            onRetry={() => { void query.refetch() }}
          />
          <p className="observe-science-note">Geometric horizon position does not guarantee detectability. The actual site terrain and tree horizon and equipment suitability are not yet modeled. Tonight recommendations are not part of Observe.</p>
        </div>
    </div>
  )
}
