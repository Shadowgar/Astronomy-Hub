/* eslint-disable react/prop-types */
import React from 'react'
import GlassPanel from './ui/GlassPanel'
import SectionHeader from './ui/SectionHeader'
import { useAlertsQuery } from '../features/alerts/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'

const MAX_NEWS = 3

export default function SkyNews({ locationQuery = '' }) {
  const queryParams = parseLocationQuery(locationQuery)
  const alertsQuery = useAlertsQuery(queryParams)
  const loading = alertsQuery.isLoading
  const error = alertsQuery.isError
    ? (alertsQuery.error && alertsQuery.error.message) || 'Unknown error'
    : null
  const items = Array.isArray(alertsQuery.data) ? alertsQuery.data.slice(0, MAX_NEWS) : []

  return (
    <GlassPanel className="module panel sky-news">
      <SectionHeader title="Sky News" subtitle="Light observing context" />

      {loading && <p className="loading">Loading sky news…</p>}
      {error && <p className="error">Error loading sky news: {error}</p>}

      {!loading && !error && (
        <ul>
          {items.length === 0 && <li>No sky news items</li>}
          {items.map((item, idx) => (
            <li key={item.title || idx}>
              <strong>{item.title}</strong>
              <div className="small muted-meta">{item.category}</div>
              <div>{item.summary}</div>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  )
}
