import React, { useEffect, useMemo, useState } from 'react'
import PanelSection from './PanelSection'
import PlaceholderItemRow from './PlaceholderItemRow'
import RadarMapPreview from './RadarMapPreview'
import { liveBriefingActions, liveBriefingItems } from './foundationData'
import { useConditionsDataQuery } from '../../../features/conditions/queries'
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

export default function ContextPanel() {
  const locationQuery = typeof window !== 'undefined' ? window.location.search : ''
  const queryParams = parseLocationQuery(locationQuery)
  const conditionsQuery = useConditionsDataQuery(queryParams)
  const conditions = conditionsQuery.data && typeof conditionsQuery.data === 'object' ? conditionsQuery.data : null
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

  const dynamicConditionRows = []
  if (conditions && Array.isArray(conditions.missing_sources) && conditions.missing_sources.length > 0) {
      dynamicConditionRows.push({
        name: 'Missing sources',
        reason: conditions.missing_sources.join(', '),
        marker: 'Degraded',
      })
  } else if (loading) {
    // Keep briefing focused on decision-support rows while loading.
  } else if (hasError) {
    dynamicConditionRows.push({
      name: 'Conditions',
      reason: 'Conditions unavailable; keeping fallback briefing.',
      marker: 'Error',
    })
  }

  const fallbackRows = liveBriefingItems.filter((item) => item.name !== 'Observing score')
  const briefingRows = [...dynamicConditionRows, ...fallbackRows]
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
  const radarFrameStepMinutes = Number.isFinite(conditions?.radar_frame_step_minutes)
    ? conditions.radar_frame_step_minutes
    : 10

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
    if (!radarPlaybackEnabled || radarFrameUrls.length < 2) return undefined

    const intervalId = window.setInterval(() => {
      setRadarFrameIndex((index) => (index >= radarFrameUrls.length - 1 ? 0 : index + 1))
    }, 1250)

    return () => window.clearInterval(intervalId)
  }, [isConditionsModalOpen, radarPlaybackEnabled, radarFrameUrls.length])
  const detailRows = useMemo(() => {
    if (!conditions) return []
    return [
      { label: 'Observing score', value: formatConditionsScore(conditions.observing_score) },
      { label: 'Summary', value: conditions.summary || 'N/A' },
      { label: 'Cloud cover', value: conditions.cloud_cover_pct ?? 'N/A' },
      { label: 'Visibility (m)', value: conditions.visibility_m ?? 'N/A' },
      { label: 'Temperature (C/F)', value: formatTemperatureCF(conditions.temperature_c) },
      { label: 'Weather code', value: conditions.weather_code ?? 'N/A' },
      { label: 'Source', value: conditions.source || 'N/A' },
      { label: 'Last updated', value: formatUpdatedAt(conditions.last_updated) },
      { label: 'Degraded', value: conditions.degraded ? 'Yes' : 'No' },
      {
        label: 'Missing sources',
        value: Array.isArray(conditions.missing_sources) && conditions.missing_sources.length > 0
          ? conditions.missing_sources.join(', ')
          : 'None',
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
                    frameIndex={radarFrameIndex}
                    frameCount={radarFrameUrls.length}
                    frameStepMinutes={radarFrameStepMinutes}
                    generatedAt={conditions?.radar_generated_at}
                  />
                  {radarFrameUrls.length > 1 ? (
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
                    {radarFrameUrls.length > 1 ? (
                      <span>
                        Frame {radarFrameIndex + 1}/{radarFrameUrls.length} ({radarFrameStepMinutes} min step)
                      </span>
                    ) : (
                      <span>Single latest frame</span>
                    )}
                    <span>Source: {radarSource || 'unknown'}</span>
                    <span>Generated: {radarGeneratedAt}</span>
                  </div>
                </section>
              ) : null}
              <p className="foundation-modal-note">
                Provider-backed conditions payload from the active conditions engine.
              </p>
              <ul className="foundation-modal-list">
                {detailRows.map((row) => (
                  <li key={row.label} className="foundation-modal-row">
                    <span className="foundation-modal-label">{row.label}</span>
                    <span className="foundation-modal-value">{String(row.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
