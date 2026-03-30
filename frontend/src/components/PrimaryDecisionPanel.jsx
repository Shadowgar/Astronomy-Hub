/* eslint-disable react/prop-types */
import React from 'react'
import { useConditionsDataQuery } from '../features/conditions/queries'
import { useAlertsListQuery } from '../features/alerts/queries'
import { usePassesListQuery } from '../features/passes/queries'
import { useTargetsListQuery } from '../features/targets/queries'
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
  const conditionsQuery = useConditionsDataQuery(queryParams)
  const targetsQuery = useTargetsListQuery(queryParams)
  const alertsQuery = useAlertsListQuery(queryParams)
  const passesQuery = usePassesListQuery(queryParams)

  const conds = conditionsQuery.data || null
  const targets = targetsQuery.data
  const alerts = alertsQuery.data
  const passes = passesQuery.data
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
  const recommended = selectedTarget || top || null
  const contextLines = [
    conds && conds.summary ? conds.summary : null,
    recommended && recommended.reason ? recommended.reason : null,
    alerts.length > 0 && alerts[0] && alerts[0].summary ? alerts[0].summary : null,
  ].filter(Boolean)

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
            <span className="pdp-top-target-inline">Selected: <strong>{selectedTarget.name}</strong> · {selectedTarget.direction?.toUpperCase()}</span>
          ) : top ? (
            <span className="pdp-top-target-inline">Start with <strong>{top.name}</strong> · {top.direction?.toUpperCase()}</span>
          ) : (
            <span>No clear plan yet</span>
          )}
        </div>
        {!loading && !hasError && contextLines.length > 0 ? (
          <ul className="small pdp-reasoning-list">
            {contextLines.slice(0, 3).map((line, idx) => (
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
