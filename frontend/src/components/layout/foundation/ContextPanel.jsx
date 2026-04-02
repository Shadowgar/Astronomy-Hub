import React, { useEffect, useMemo, useState } from 'react'
import PanelSection from './PanelSection'
import PlaceholderItemRow from './PlaceholderItemRow'
import RadarMapPreview from './RadarMapPreview'
import { useConditionsDataQuery } from '../../../features/conditions/queries'
import { useAlertsListQuery } from '../../../features/alerts/queries'
import { usePassesListQuery } from '../../../features/passes/queries'
import { parseLocationQuery } from '../../../features/shared/locationQuery'
import useGlobalUiState from '../../../state/globalUiState'

function formatConditionsScore(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed.toUpperCase() : 'UNKNOWN'
  }
  if (typeof value === 'number') {
    return String(Math.round(value))
  }
  return 'UNKNOWN'
}

function formatUpdatedAt(value) {
  if (typeof value !== 'string' || !value.trim()) return 'Unknown'
  try {
    return new Date(value).toLocaleString()
  } catch (error) {
    return value
  }
}

function formatTemperatureCF(value) {
  const c = Number(value)
  if (!Number.isFinite(c)) return 'N/A'
  const f = (c * 9) / 5 + 32
  return `${c.toFixed(1)}C / ${f.toFixed(1)}F`
}

function formatPassStart(value) {
  if (typeof value !== 'string' || !value.trim()) return 'Unknown'
  try {
    return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch (error) {
    return value
  }
}

function formatField(value) {
  if (value === null || value === undefined) return 'Classified'
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || 'Classified'
  }
  return String(value)
}

function formatListField(value) {
  if (!Array.isArray(value) || value.length === 0) return 'None'
  return value.join(', ')
}

function formatPercent(value) {
  if (value === null || value === undefined || value === '') return 'Classified'
  return `${String(value)}%`
}

function formatMph(value) {
  if (value === null || value === undefined || value === '') return 'Classified'
  return `${String(value)} mph`
}

export default function ContextPanel() {
  const locationQuery = typeof window !== 'undefined' ? window.location.search : ''
  const queryParams = parseLocationQuery(locationQuery)
  const conditionsQuery = useConditionsDataQuery(queryParams)
  const alertsQuery = useAlertsListQuery(queryParams)
  const passesQuery = usePassesListQuery(queryParams)
  const conditions = conditionsQuery.data && typeof conditionsQuery.data === 'object' ? conditionsQuery.data : null
  const alerts = Array.isArray(alertsQuery.data) ? alertsQuery.data : []
  const passes = Array.isArray(passesQuery.data) ? passesQuery.data : []
  const loading = conditionsQuery.isLoading
  const hasError = conditionsQuery.isError
  const { uiToggles, setUiToggle } = useGlobalUiState()
  const isConditionsModalOpen = Boolean(uiToggles.conditionsModalOpen)
  const [radarFrameIndex, setRadarFrameIndex] = useState(0)
  const [radarPlaybackEnabled, setRadarPlaybackEnabled] = useState(true)

  const setIsConditionsModalOpen = (open) => {
    setUiToggle('conditionsModalOpen', Boolean(open))
  }

  useEffect(() => {
    if (!isConditionsModalOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsConditionsModalOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isConditionsModalOpen])

  const topAlert = alerts[0] || null
  const nextPass = passes[0] || null
  const briefingRows = [
    {
      name: 'Observing score',
      reason: formatConditionsScore(conditions?.observing_score),
      marker: conditions?.degraded ? 'Degraded' : 'Live',
      onClick: () => setIsConditionsModalOpen(true),
    },
    {
      name: 'Sky quality',
      reason: `Transparency ${formatField(conditions?.transparency)} · Seeing ${formatField(conditions?.seeing)} · Darkness ${formatField(conditions?.darkness)}`,
      marker: 'Live',
      onClick: () => setIsConditionsModalOpen(true),
    },
    {
      name: 'Atmosphere',
      reason: `Cloud ${formatPercent(conditions?.cloud_cover_pct)} · Humidity ${formatPercent(conditions?.humidity_pct)} · Wind ${formatMph(conditions?.wind_mph)}`,
      marker: 'Live',
    },
    {
      name: 'Temperature',
      reason: formatTemperatureCF(conditions?.temperature_c),
      marker: 'Live',
    },
    nextPass
      ? {
        name: 'Next satellite pass',
        reason: `${nextPass.object_name || 'Satellite'} at ${formatPassStart(nextPass.start_time)}`,
        marker: nextPass.visibility || 'Live',
      }
      : {
        name: 'Next satellite pass',
        reason: 'No pass window currently available.',
        marker: 'N/A',
      },
    topAlert
      ? {
        name: 'Active alert',
        reason: `${topAlert.title}: ${topAlert.summary}`,
        marker: topAlert.priority || 'Live',
      }
      : {
        name: 'Active alert',
        reason: loading || alertsQuery.isLoading ? 'Loading alert feed...' : 'No active alerts.',
        marker: hasError || alertsQuery.isError ? 'Error' : 'Live',
      },
  ]
  const liveBriefingActions = ['Open full briefing', 'Open news digest']
  const radarImageUrl = typeof conditions?.radar_image_url === 'string' ? conditions.radar_image_url : ''
  const radarFrameUrls = Array.isArray(conditions?.radar_frame_urls)
    ? conditions.radar_frame_urls.filter((url) => typeof url === 'string' && url.trim())
    : []
  const activeRadarUrl = radarFrameUrls[radarFrameIndex] || radarImageUrl
  const radarCenter = useMemo(() => {
    const conditionLat = Number(conditions?.location?.latitude)
    const conditionLon = Number(conditions?.location?.longitude)
    if (Number.isFinite(conditionLat) && Number.isFinite(conditionLon)) {
      return { lat: conditionLat, lon: conditionLon }
    }
    const lat = Number(queryParams.lat)
    const lon = Number(queryParams.lon)
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon }
    }
    return { lat: 41.321903, lon: -79.585394 }
  }, [conditions?.location?.latitude, conditions?.location?.longitude, queryParams.lat, queryParams.lon])
  const radarSource = typeof conditions?.radar_source === 'string' ? conditions.radar_source : ''
  const radarGeneratedAt = formatUpdatedAt(conditions?.radar_generated_at)
  const radarFrameStepMinutes = Number.isFinite(Number(conditions?.radar_frame_step_minutes))
    ? Number(conditions?.radar_frame_step_minutes)
    : 10
  const radarSupportsAnimation = radarFrameUrls.length > 1
  const clearSkyChartImageUrl = 'https://www.cleardarksky.com/c/OilRegObs2PAcsk.gif'
  const clearSkyChartPageUrl = 'https://server3.cleardarksky.com/c/OilRegObs2PAkey.html?1'

  useEffect(() => {
    if (!isConditionsModalOpen) return
    if (radarFrameUrls.length > 0) {
      setRadarFrameIndex(radarFrameUrls.length - 1)
      setRadarPlaybackEnabled(true)
    } else {
      setRadarFrameIndex(0)
      setRadarPlaybackEnabled(false)
    }
  }, [isConditionsModalOpen, radarFrameUrls.length])

  useEffect(() => {
    if (!isConditionsModalOpen) return undefined
    if (!radarSupportsAnimation) return undefined
    if (!radarPlaybackEnabled || radarFrameUrls.length < 2) return undefined

    const intervalId = window.setInterval(() => {
      setRadarFrameIndex((index) => (index >= radarFrameUrls.length - 1 ? 0 : index + 1))
    }, 1250)

    return () => window.clearInterval(intervalId)
  }, [isConditionsModalOpen, radarPlaybackEnabled, radarFrameUrls.length, radarSupportsAnimation])
  const decisionRows = useMemo(() => {
    if (!conditions) return []
    return [
      { label: 'Observing score', value: formatConditionsScore(conditions.observing_score) },
      { label: 'Confidence', value: formatField(conditions.confidence) },
      { label: 'Best for', value: formatListField(conditions.best_for) },
      { label: 'Warnings', value: formatListField(conditions.warnings) },
      { label: 'Summary', value: formatField(conditions.summary) },
    ]
  }, [conditions])

  const metricRows = useMemo(() => {
    if (!conditions) return []
    return [
      { label: 'Transparency', value: formatField(conditions.transparency) },
      { label: 'Seeing', value: formatField(conditions.seeing) },
      { label: 'Darkness', value: formatField(conditions.darkness) },
      { label: 'Moon interference', value: formatField(conditions.moon_interference) },
      { label: 'Cloud cover', value: formatField(conditions.cloud_cover_pct) },
      { label: 'Visibility (m)', value: formatField(conditions.visibility_m) },
      { label: 'Temperature (C/F)', value: formatTemperatureCF(conditions.temperature_c) },
      { label: 'Humidity (%)', value: formatField(conditions.humidity_pct) },
      { label: 'Wind (mph)', value: formatField(conditions.wind_mph) },
      { label: 'Dew point (C)', value: formatField(conditions.dew_point_c) },
      { label: 'Smoke', value: formatField(conditions.smoke) },
    ]
  }, [conditions])

  const sourceRows = useMemo(() => {
    if (!conditions) return []
    return [
      { label: 'Weather code', value: formatField(conditions.weather_code) },
      { label: 'Source', value: formatField(conditions.source) },
      { label: 'Last updated', value: formatUpdatedAt(conditions.last_updated) },
      { label: 'Degraded', value: conditions.degraded ? 'Yes' : 'No' },
      {
        label: 'Missing sources',
        value: formatListField(conditions.missing_sources),
      },
    ]
  }, [conditions])

  return (
    <>
      <aside className="module panel" aria-label="Right context panel">
        <h2>Right-Side Live Briefing</h2>
        <PanelSection title="Tonight / Now Summary" badge={null}>
          <ul className="foundation-list">
            {briefingRows.map((item) => (
              <PlaceholderItemRow
                key={item.name}
                name={item.name}
                reason={item.reason}
                marker={item.marker || null}
                onClick={item.onClick || null}
              />
            ))}
          </ul>
        </PanelSection>
        <div className="foundation-context-actions">
          {liveBriefingActions.map((action) => (
            <button key={action} type="button">
              {action}
            </button>
          ))}
        </div>
      </aside>

      {isConditionsModalOpen ? (
        <div
          className="foundation-modal-overlay"
          role="presentation"
          onClick={() => setIsConditionsModalOpen(false)}
        >
          <section
            className="foundation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="conditions-detail-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="foundation-modal-header">
              <h3 id="conditions-detail-modal-title">Conditions engine details</h3>
              <button
                type="button"
                className="foundation-modal-close"
                onClick={() => setIsConditionsModalOpen(false)}
              >
                Close
              </button>
            </header>
            <div className="foundation-modal-body">
              {activeRadarUrl ? (
                <section className="foundation-modal-radar">
                  <h4>Local radar</h4>
                  <RadarMapPreview
                    imageUrl={activeRadarUrl}
                    center={radarCenter}
                    isOpen={isConditionsModalOpen}
                  />
                  {radarSupportsAnimation && radarFrameUrls.length > 1 ? (
                    <div className="foundation-modal-radar-controls">
                      <button
                        type="button"
                        className="foundation-modal-radar-play"
                        onClick={() => setRadarPlaybackEnabled((enabled) => !enabled)}
                      >
                        {radarPlaybackEnabled ? 'Pause' : 'Play'}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={radarFrameUrls.length - 1}
                        value={radarFrameIndex}
                        className="foundation-modal-radar-slider"
                        onChange={(event) => {
                          setRadarPlaybackEnabled(false)
                          setRadarFrameIndex(Number(event.target.value))
                        }}
                      />
                    </div>
                  ) : null}
                  <div className="foundation-modal-radar-meta">
                    {radarSupportsAnimation && radarFrameUrls.length > 1 ? (
                      <span>
                        Frame {radarFrameIndex + 1}/{radarFrameUrls.length} ({radarFrameStepMinutes} min step)
                      </span>
                    ) : (
                      <span>Latest NOAA frame</span>
                    )}
                    <span>Source: {radarSource || 'noaa_nws_eventdriven'}</span>
                    <span>Generated: {radarGeneratedAt}</span>
                  </div>
                </section>
              ) : null}

              <section className="foundation-modal-strip">
                <div className="foundation-modal-strip__header">
                  <h4>ORAS Clear Sky Chart</h4>
                  <a href={clearSkyChartPageUrl} target="_blank" rel="noreferrer">
                    Open full forecast
                  </a>
                </div>
                <p className="foundation-modal-note">
                  ClearDarkSky chart for ORAS Observatory.
                </p>
                <img
                  src={clearSkyChartImageUrl}
                  alt="ORAS Clear Sky Chart"
                  className="foundation-modal-strip-image"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </section>

              <section className="foundation-modal-section">
                <h4>Observing decision</h4>
                <div className="foundation-modal-kpi-grid">
                  {decisionRows.map((row) => (
                    <article key={row.label} className="foundation-modal-kpi-card">
                      <span className="foundation-modal-kpi-label">{row.label}</span>
                      <span className="foundation-modal-kpi-value">{String(row.value)}</span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="foundation-modal-section">
                <h4>Conditions metrics</h4>
                <ul className="foundation-modal-list">
                  {metricRows.map((row) => (
                    <li key={row.label} className="foundation-modal-row">
                      <span className="foundation-modal-label">{row.label}</span>
                      <span className="foundation-modal-value">{String(row.value)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="foundation-modal-section">
                <h4>Provider trace</h4>
                <ul className="foundation-modal-list">
                  {sourceRows.map((row) => (
                    <li key={row.label} className="foundation-modal-row">
                      <span className="foundation-modal-label">{row.label}</span>
                      <span className="foundation-modal-value">{String(row.value)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
