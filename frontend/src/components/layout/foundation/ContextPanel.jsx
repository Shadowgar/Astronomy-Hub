import React, { useEffect, useMemo, useState } from 'react'
import PanelSection from './PanelSection'
import PlaceholderItemRow from './PlaceholderItemRow'
import { liveBriefingActions, liveBriefingItems } from './foundationData'
import { useConditionsDataQuery } from '../../../features/conditions/queries'
import { parseLocationQuery } from '../../../features/shared/locationQuery'

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

export default function ContextPanel() {
  const locationQuery = typeof window !== 'undefined' ? window.location.search : ''
  const queryParams = parseLocationQuery(locationQuery)
  const conditionsQuery = useConditionsDataQuery(queryParams)
  const conditions = conditionsQuery.data && typeof conditionsQuery.data === 'object' ? conditionsQuery.data : null
  const loading = conditionsQuery.isLoading
  const hasError = conditionsQuery.isError
  const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false)

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
  if (conditions) {
    dynamicConditionRows.push({
      name: 'Observing score',
      reason: formatConditionsScore(conditions.observing_score),
      marker: conditions.degraded ? 'Degraded' : 'Live',
      onClick: () => setIsConditionsModalOpen(true),
    })
    if (typeof conditions.summary === 'string' && conditions.summary.trim()) {
      dynamicConditionRows.push({
        name: 'Conditions summary',
        reason: conditions.summary,
        marker: conditions.degraded ? 'Degraded' : 'Live',
        onClick: () => setIsConditionsModalOpen(true),
      })
    }
    if (Array.isArray(conditions.missing_sources) && conditions.missing_sources.length > 0) {
      dynamicConditionRows.push({
        name: 'Missing sources',
        reason: conditions.missing_sources.join(', '),
        marker: 'Degraded',
      })
    }
  } else if (loading) {
    dynamicConditionRows.push({
      name: 'Observing score',
      reason: 'Loading live conditions…',
      marker: 'Loading',
    })
  } else if (hasError) {
    dynamicConditionRows.push({
      name: 'Observing score',
      reason: 'Conditions unavailable; keeping fallback briefing.',
      marker: 'Error',
    })
  }

  const fallbackRows = liveBriefingItems.filter((item) => item.name !== 'Observing score')
  const briefingRows = [...dynamicConditionRows, ...fallbackRows]
  const detailRows = useMemo(() => {
    if (!conditions) return []
    return [
      { label: 'Observing score', value: formatConditionsScore(conditions.observing_score) },
      { label: 'Summary', value: conditions.summary || 'N/A' },
      { label: 'Cloud cover', value: conditions.cloud_cover_pct ?? 'N/A' },
      { label: 'Visibility (m)', value: conditions.visibility_m ?? 'N/A' },
      { label: 'Temperature (C)', value: conditions.temperature_c ?? 'N/A' },
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
