/* eslint-disable react/prop-types */
import React from 'react'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'
import LoadingState from './ui/LoadingState'
import ErrorState from './ui/ErrorState'
import EmptyState from './ui/EmptyState'
import { useConditionsQuery } from '../features/conditions/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'

function fmtTimeShort(iso) {
  try {
    if (!iso) return 'N/A'
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch (e) {
    return 'N/A'
  }
}

export default function MoonSummary({ locationQuery = '' }) {
  const queryParams = parseLocationQuery(locationQuery)
  const conditionsQuery = useConditionsQuery(queryParams)
  const loading = conditionsQuery.isLoading
  const error = conditionsQuery.isError
    ? (conditionsQuery.error && conditionsQuery.error.message) || 'Unknown error'
    : null
  const rawData = conditionsQuery.data
  const data = (rawData && rawData.data) || rawData

  if (loading) {
    return (
      <Panel className="component moon-summary">
        <SectionHeader title="Moon Summary" />
        <LoadingState message="Loading moon summary…" />
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel className="component moon-summary">
        <SectionHeader title="Moon Summary" />
        <ErrorState message={`Error loading moon summary: ${error}`} />
      </Panel>
    )
  }

  if (!data) {
    return (
      <Panel className="component moon-summary">
        <SectionHeader title="Moon Summary" />
        <EmptyState message="No data available" />
      </Panel>
    )
  }

  const { moon_phase, darkness_window, summary } = data

  const darknessText = darkness_window?.start && darkness_window?.end
    ? `${fmtTimeShort(darkness_window.start)} – ${fmtTimeShort(darkness_window.end)}`
    : 'Not available'

  const noteText = summary ? `Notes: ${summary}` : ''

  return (
    <Panel className="component moon-summary">
      <SectionHeader title="Moon Summary" />
      <div className="moon-line" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
          <strong>{moon_phase || 'Unknown'}</strong>
          <span>— Peak darkness {darknessText}.</span>
        </div>
        {noteText && <div style={{ color: 'var(--text-sub)' }}>{noteText}</div>}
      </div>
    </Panel>
  )
}
