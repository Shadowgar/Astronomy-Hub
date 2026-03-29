import React from 'react'
import GlassPanel from './ui/GlassPanel'
import SectionHeader from './ui/SectionHeader'
import { useConditionsQuery } from '../features/conditions/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'

function fmtTimeShort(iso: string | null | undefined): string {
  try {
    if (!iso) return 'N/A'
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch (e) {
    return 'N/A'
  }
}

interface MoonSummaryProps {
  locationQuery?: string
}

export default function MoonSummary({ locationQuery = '' }: MoonSummaryProps) {
  const queryParams = parseLocationQuery(locationQuery)
  const conditionsQuery = useConditionsQuery(queryParams)
  const loading = conditionsQuery.isLoading
  const error = conditionsQuery.isError
    ? (conditionsQuery.error && conditionsQuery.error.message) || 'Unknown error'
    : null
  const rawData = conditionsQuery.data as any
  const data = (rawData && rawData.data) || rawData

  if (loading) {
    return (
      <GlassPanel className="component moon-summary">
        <SectionHeader title="Moon Summary" />
        <p className="loading">Loading moon summary…</p>
      </GlassPanel>
    )
  }

  if (error) {
    return (
      <GlassPanel className="component moon-summary">
        <SectionHeader title="Moon Summary" />
        <p className="error">Error loading moon summary: {error}</p>
      </GlassPanel>
    )
  }

  if (!data) {
    return (
      <GlassPanel className="component moon-summary">
        <SectionHeader title="Moon Summary" />
        <p>No data available</p>
      </GlassPanel>
    )
  }

  const { moon_phase, darkness_window, summary } = data

  const darknessText = darkness_window?.start && darkness_window?.end
    ? `${fmtTimeShort(darkness_window.start)} – ${fmtTimeShort(darkness_window.end)}`
    : 'Not available'

  const noteText = summary ? `Notes: ${summary}` : ''

  return (
    <GlassPanel className="component moon-summary">
      <SectionHeader title="Moon Summary" />
      <div className="moon-line moon-line-stack">
        <div className="moon-line-main">
          <strong>{moon_phase || 'Unknown'}</strong>
          <span>— Peak darkness {darknessText}.</span>
        </div>
        {noteText && <div className="moon-note">{noteText}</div>}
      </div>
    </GlassPanel>
  )
}
