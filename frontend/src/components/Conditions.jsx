/* eslint-disable react/prop-types */
import React from 'react'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'
import AppButton from './ui/AppButton'
import LoadingState from './ui/LoadingState'
import ErrorState from './ui/ErrorState'
import EmptyState from './ui/EmptyState'
import logger from '../lib/logger'
import { useConditionsQuery } from '../features/conditions/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'

/**
 * @typedef {import('../types/conditions').Conditions} Conditions
 * @typedef {import('../types/conditions').DarknessWindow} DarknessWindow
 */

function fmtTimeShort(iso) {
  try {
    if (!iso) return 'N/A'
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch (e) {
    return 'N/A'
  }
}

/**
 * @param {{locationQuery?: string}} props
 * @returns {JSX.Element}
 */
export default function Conditions({ locationQuery = '' }) {
  const queryParams = parseLocationQuery(locationQuery)

  const simulatePartial = (() => {
    try {
      if (typeof window === 'undefined') return false
      const params = new URLSearchParams(window.location.search)
      return params.get('simulate_partial') === '1'
    } catch (e) {
      return false
    }
  })()

  const conditionsQuery = useConditionsQuery(queryParams)
  const loading = conditionsQuery.isLoading
  const error = conditionsQuery.isError
    ? (conditionsQuery.error && conditionsQuery.error.message) || 'Unknown error'
    : null
  const rawData = conditionsQuery.data
  const data = (rawData && rawData.data) || rawData

  const fallbackPartialData = {
    location_label: 'Simulated Location',
    cloud_cover_pct: null,
    moon_phase: null,
    darkness_window: { start: null, end: null },
    summary: null,
    last_updated: new Date().toISOString(),
    meta: { partial: true },
  }

  const effectiveData =
    simulatePartial && (error || !data)
      ? fallbackPartialData
      : simulatePartial && data && typeof data === 'object'
        ? (() => {
            const patched = Object.assign({}, data)
            delete patched.summary
            patched.meta = Object.assign({}, patched.meta || {}, { partial: true })
            return patched
          })()
        : data

  const handleRetry = () => {
    conditionsQuery.refetch()
  }

  if (loading) {
    return (
      <Panel className="module conditions-module panel">
        <SectionHeader title="Conditions" />
        <LoadingState message="Loading conditions…" />
      </Panel>
    )
  }

  if (error && !simulatePartial) {
    logger?.info?.('module', 'conditions:fetch:error', { err: error })
    return (
      <Panel className="module conditions-module panel">
        <SectionHeader title="Conditions" action={<AppButton onClick={handleRetry}>Retry</AppButton>} />
        <ErrorState message={`Error loading conditions: ${error}`} />
      </Panel>
    )
  }

  if (!effectiveData) {
    return (
      <Panel className="module conditions-module panel">
        <SectionHeader title="Conditions" action={<AppButton onClick={handleRetry}>Retry</AppButton>} />
        <EmptyState message="No data available" />
      </Panel>
    )
  }

  const { location_label, cloud_cover_pct, moon_phase, darkness_window, summary } = effectiveData

  const isStale = Boolean(effectiveData?.meta?.partial)
  const staleProp = Boolean(isStale || simulatePartial)

  const cloudText = typeof cloud_cover_pct === 'number' ? `${Math.round(cloud_cover_pct)}%` : 'N/A'
  const moonText = moon_phase || 'N/A'
  const darknessText = darkness_window?.start && darkness_window?.end
    ? `${fmtTimeShort(darkness_window.start)} – ${fmtTimeShort(darkness_window.end)}`
    : 'Not available'

  // Compact, chip-style signal rows for quick scanning
  return (
    <Panel className="module conditions-module panel">
      <SectionHeader title="Conditions" subtitle={staleProp ? 'Partial data' : undefined} />
      <div className="conditions-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--token-space-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '1rem' }}>{location_label || 'Unknown location'}</strong>
          <small style={{ color: 'var(--token-color-text-secondary)', fontSize: '0.85rem' }}>{effectiveData?.last_updated ? fmtTimeShort(effectiveData.last_updated) : ''}</small>
        </div>

        {summary && (
          <div className="conditions-summary" style={{ marginTop: 'var(--space-3)' }}>{summary}</div>
        )}

        <div style={{ display: 'flex', gap: 'var(--token-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ padding: 'var(--token-chip-padding-y) var(--token-chip-padding-x)', borderRadius: 'var(--token-radius-pill)', background: 'var(--token-color-surface-panel)', fontWeight: 'var(--token-font-weight-bold)' }}>{cloudText}</span>
          <span style={{ padding: 'var(--token-chip-padding-y) var(--token-chip-padding-x)', borderRadius: 'var(--token-radius-pill)', background: 'transparent', color: 'var(--token-color-text-secondary)' }}>{moonText}</span>
          <span style={{ padding: 'var(--token-chip-padding-y) var(--token-chip-padding-x)', borderRadius: 'var(--token-radius-pill)', background: 'transparent', color: 'var(--token-color-text-secondary)' }}>{darknessText}</span>
          {typeof effectiveData?.observing_score === 'number' ? (
            <span style={{ marginLeft: 'var(--token-space-1)', padding: 'var(--token-badge-padding-y) var(--token-badge-padding-x)', borderRadius: 'var(--token-radius-xs)', background: 'var(--token-color-action-primary)', color: 'var(--token-color-white)', fontWeight: 'var(--token-font-weight-bold)' }}>{Math.round(effectiveData.observing_score)}</span>
          ) : null}
          {typeof effectiveData?.observing_score === 'string' ? (
            <span style={{ marginLeft: 'var(--token-space-1)', padding: 'var(--token-badge-padding-y) var(--token-badge-padding-x)', borderRadius: 'var(--token-radius-xs)', background: 'var(--token-color-action-primary)', color: 'var(--token-color-white)', fontWeight: 'var(--token-font-weight-bold)' }}>{effectiveData.observing_score.toUpperCase()}</span>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}
