/* eslint-disable react/prop-types */
import React from 'react'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'
import AppButton from './ui/AppButton'
import LoadingState from './ui/LoadingState'
import ErrorState from './ui/ErrorState'
import EmptyState from './ui/EmptyState'
import logger from '../lib/logger'
import { useConditionsDataQuery } from '../features/conditions/queries'
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

  const conditionsQuery = useConditionsDataQuery(queryParams)
  const loading = conditionsQuery.isLoading
  const error = conditionsQuery.isError
    ? (conditionsQuery.error && conditionsQuery.error.message) || 'Unknown error'
    : null
  const data = conditionsQuery.data

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

  if (error) {
    logger?.info?.('module', 'conditions:fetch:error', { err: error })
    return (
      <Panel className="module conditions-module panel">
        <SectionHeader title="Conditions" action={<AppButton onClick={handleRetry} loading={conditionsQuery.isFetching}>Retry</AppButton>} />
        <ErrorState message={`Error loading conditions: ${error}`} />
      </Panel>
    )
  }

  if (!data) {
    return (
      <Panel className="module conditions-module panel">
        <SectionHeader title="Conditions" action={<AppButton onClick={handleRetry} loading={conditionsQuery.isFetching}>Retry</AppButton>} />
        <EmptyState message="No data available" />
      </Panel>
    )
  }

  const { location_label, cloud_cover_pct, moon_phase, darkness_window, summary } = data

  const staleProp = Boolean(data?.meta?.partial)

  const cloudText = typeof cloud_cover_pct === 'number' ? `${Math.round(cloud_cover_pct)}%` : 'N/A'
  const moonText = moon_phase || 'N/A'
  const darknessText = darkness_window?.start && darkness_window?.end
    ? `${fmtTimeShort(darkness_window.start)} – ${fmtTimeShort(darkness_window.end)}`
    : 'Not available'

  // Compact, chip-style signal rows for quick scanning
  return (
    <Panel className="module conditions-module panel">
      <SectionHeader title="Conditions" subtitle={staleProp ? 'Partial data' : undefined} />
      <div className="conditions-body conditions-stack">
        <div className="conditions-head-row">
          <strong className="conditions-location-name">{location_label || 'Unknown location'}</strong>
          <small className="conditions-updated-at">{data?.last_updated ? fmtTimeShort(data.last_updated) : ''}</small>
        </div>

        {summary && (
          <div className="conditions-summary conditions-summary-spaced">{summary}</div>
        )}

        <div className="conditions-chip-row">
          <span className="conditions-chip conditions-chip-primary">{cloudText}</span>
          <span className="conditions-chip conditions-chip-secondary">{moonText}</span>
          <span className="conditions-chip conditions-chip-secondary">{darknessText}</span>
          {typeof data?.observing_score === 'number' ? (
            <span className="conditions-score-badge">{Math.round(data.observing_score)}</span>
          ) : null}
          {typeof data?.observing_score === 'string' ? (
            <span className="conditions-score-badge">{data.observing_score.toUpperCase()}</span>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}
