/* eslint-disable react/prop-types */
import React from 'react'
import { useConditionsQuery } from '../features/conditions/queries'
import { useAlertsQuery } from '../features/alerts/queries'
import { usePassesQuery } from '../features/passes/queries'
import { useTargetsQuery } from '../features/targets/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'
import AppButton from './ui/AppButton'
import useGlobalUiState from '../state/globalUiState'

function fmtTime(iso) {
  try {
    if (!iso) return null
    const d = new Date(iso)
    // use 12-hour, no leading zero for hour
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch (e) {
    return null
  }
}

function observingLabel(score) {
  if (score === null || score === undefined) return 'Unknown'
  if (typeof score === 'string') {
    const s = score.trim().toLowerCase()
    if (s === 'excellent' || s === 'good' || s === 'fair' || s === 'poor') {
      return s[0].toUpperCase() + s.slice(1)
    }
    return 'Unknown'
  }
  if (score >= 75) return 'Excellent'
  if (score >= 50) return 'Good'
  if (score >= 25) return 'Fair'
  return 'Poor'
}

function targetIdFor(target) {
  if (!target) return null
  if (target.id) return target.id
  return (target.name || '')
    .toLowerCase()
    .split(/\s+/)
    .join('-')
    .split('/')
    .join('-')
    .split("'")
    .join('')
}

export default function PrimaryDecisionPanel({ locationQuery = '' }) {
  const queryParams = parseLocationQuery(locationQuery)
  const { selectedObjectId } = useGlobalUiState()
  const conditionsQuery = useConditionsQuery(queryParams)
  const targetsQuery = useTargetsQuery(queryParams)
  const alertsQuery = useAlertsQuery(queryParams)
  const passesQuery = usePassesQuery(queryParams)

  const conds = (conditionsQuery.data && conditionsQuery.data.data) || conditionsQuery.data || null
  const targets = Array.isArray(targetsQuery.data) ? targetsQuery.data : []
  const alerts = Array.isArray(alertsQuery.data) ? alertsQuery.data : []
  const passes = Array.isArray(passesQuery.data) ? passesQuery.data : []
  const loading = conditionsQuery.isLoading || targetsQuery.isLoading || alertsQuery.isLoading || passesQuery.isLoading
  const hasError = conditionsQuery.isError || targetsQuery.isError || alertsQuery.isError || passesQuery.isError
  const errorMessage =
    (conditionsQuery.error && conditionsQuery.error.message) ||
    (targetsQuery.error && targetsQuery.error.message) ||
    (alertsQuery.error && alertsQuery.error.message) ||
    (passesQuery.error && passesQuery.error.message) ||
    null

  const top = targets && targets.length > 0 ? targets[0] : null
  const selectedTarget = targets.find((t) => targetIdFor(t) === selectedObjectId) || null

  const observingScore = conds && (typeof conds.observing_score === 'number' || typeof conds.observing_score === 'string') ? conds.observing_score : null
  const status = observingLabel(observingScore)
  const statusText = `Tonight: ${status.toUpperCase()}`
  const darknessStart = conds && conds.darkness_window && conds.darkness_window.start ? fmtTime(conds.darkness_window.start) : null
  const darknessEnd = conds && conds.darkness_window && conds.darkness_window.end ? fmtTime(conds.darkness_window.end) : null
  const cloudCover = conds && typeof conds.cloud_cover_pct === 'number' ? Math.round(conds.cloud_cover_pct) : null
  const blockingAlerts = alerts.filter((a) => {
    const priority = String(a && a.priority ? a.priority : '').toLowerCase()
    return priority === 'high' || priority === 'critical' || priority === 'urgent' || priority === '1' || priority === '2'
  })
  const reasonLines = []
  if (conds) {
    if (cloudCover !== null) {
      reasonLines.push(`Cloud cover is ${cloudCover}%, supporting a ${status.toLowerCase()} observing outlook.`)
    } else if (observingScore !== null) {
      reasonLines.push(`Current observing outlook is ${status.toLowerCase()}.`)
    }
  }
  if (selectedTarget || top) {
    const recommended = selectedTarget || top
    reasonLines.push(`${selectedTarget ? 'Selected' : 'Top'} target ${recommended.name} is currently prioritized${recommended.direction ? ` toward ${String(recommended.direction).toUpperCase()}` : ''}.`)
  }
  if (blockingAlerts.length > 0) {
    reasonLines.push(`${blockingAlerts.length} high-priority alert${blockingAlerts.length > 1 ? 's are' : ' is'} active, so plan with caution.`)
  } else if (alerts.length > 0) {
    reasonLines.push('No major alerts are currently interfering with the plan.')
  } else {
    reasonLines.push('No alerts are currently affecting the plan.')
  }
  if (passes.length > 0) {
    reasonLines.push(`${passes.length} upcoming pass${passes.length > 1 ? 'es' : ''} add timing context for observing windows.`)
  }

  return (
    <section className="primary-decision-panel" aria-labelledby="pdp-heading">
      <div className="pdp-left">
        <span className="pdp-status-pill">{loading ? 'Loading…' : hasError ? 'Error' : statusText}</span>
        <div className="pdp-darkness small">{darknessStart && darknessEnd ? `Best: ${darknessStart} – ${darknessEnd}` : (loading ? '…' : hasError ? 'Unavailable' : 'Not available')}</div>
      </div>

      <div className="pdp-center">
        <h2 id="pdp-heading" className="sr-only">Tonight’s Observing Plan</h2>
        <div className="pdp-message">
          {loading ? (
            <span>Loading observing plan…</span>
          ) : hasError ? (
            <span className="error">Error loading observing plan{errorMessage ? `: ${errorMessage}` : ''}</span>
          ) : selectedTarget ? (
            <span className="pdp-top-target-inline">Selected target: <strong>{selectedTarget.name}</strong> · {selectedTarget.direction?.toUpperCase()}</span>
          ) : top ? (
            <span className="pdp-top-target-inline">Start with <strong>{top.name}</strong> · {top.direction?.toUpperCase()}</span>
          ) : (
            <span>No clear observing plan yet</span>
          )}
        </div>
        {!loading && !hasError && reasonLines.length > 0 ? (
          <ul className="small pdp-reasoning-list">
            {reasonLines.slice(0, 3).map((line, idx) => (
              <li key={`${line}-${idx}`}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="pdp-right">
        <AppButton
          type="button"
          className="pdp-cta"
          onClick={() => {
            const el = document.getElementById('recommended-targets-panel') || document.querySelector('.targets-module') || document.querySelector('.recommended-targets')
            el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
          }}
        >
          Jump to recommended targets
        </AppButton>
      </div>
    </section>
  )
}
