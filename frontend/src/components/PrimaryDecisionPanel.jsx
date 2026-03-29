/* eslint-disable react/prop-types */
import React from 'react'
import { useQueries } from '@tanstack/react-query'
import { conditionsKeys, fetchConditions } from '../features/conditions/queries'
import { targetsKeys, fetchTargets } from '../features/targets/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'
import AppButton from './ui/AppButton'

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

export default function PrimaryDecisionPanel({ locationQuery = '' }) {
  const queryParams = parseLocationQuery(locationQuery)
  const [conditionsQuery, targetsQuery] = useQueries({
    queries: [
      {
        queryKey: conditionsKeys.list(queryParams),
        queryFn: () => fetchConditions(queryParams),
      },
      {
        queryKey: targetsKeys.list(queryParams),
        queryFn: () => fetchTargets(queryParams),
      },
    ],
  })

  const conds = (conditionsQuery.data && conditionsQuery.data.data) || conditionsQuery.data || null
  const targets = Array.isArray(targetsQuery.data) ? targetsQuery.data : []
  const loading = conditionsQuery.isLoading || targetsQuery.isLoading
  const hasError = conditionsQuery.isError || targetsQuery.isError
  const errorMessage =
    (conditionsQuery.error && conditionsQuery.error.message) ||
    (targetsQuery.error && targetsQuery.error.message) ||
    null

  const top = targets && targets.length > 0 ? targets[0] : null

  const observingScore = conds && (typeof conds.observing_score === 'number' || typeof conds.observing_score === 'string') ? conds.observing_score : null
  const status = observingLabel(observingScore)
  const statusText = `Tonight: ${status.toUpperCase()}`
  const darknessStart = conds && conds.darkness_window && conds.darkness_window.start ? fmtTime(conds.darkness_window.start) : null
  const darknessEnd = conds && conds.darkness_window && conds.darkness_window.end ? fmtTime(conds.darkness_window.end) : null

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
          ) : top ? (
            <span className="pdp-top-target-inline">Start with <strong>{top.name}</strong> · {top.direction?.toUpperCase()}</span>
          ) : (
            <span>No observing plan available</span>
          )}
        </div>
      </div>

      <div className="pdp-right">
        <AppButton
          type="button"
          className="pdp-cta"
          onClick={() => {
            const el = document.querySelector('.targets-module') || document.querySelector('.recommended-targets')
            el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
          }}
        >
          Show Me What To Look At
        </AppButton>
      </div>
    </section>
  )
}
