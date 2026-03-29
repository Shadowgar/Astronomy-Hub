/* eslint-disable react/prop-types */
import React from 'react'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'
import LoadingState from './ui/LoadingState'
import ErrorState from './ui/ErrorState'
import EmptyState from './ui/EmptyState'
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
    <Panel className="module panel sky-news">
      <SectionHeader title="Sky News" subtitle="Light observing context" />

      {loading && <LoadingState message="Loading sky news…" />}
      {error && <ErrorState message={`Error loading sky news: ${error}`} />}

      {!loading && !error && (
        <ul>
          {items.length === 0 && <li><EmptyState message="No sky news items" /></li>}
          {items.map((item, idx) => (
            <li key={item.title || idx}>
              <strong>{item.title}</strong>
              <div className="small muted-meta">{item.category}</div>
              <div>{item.summary}</div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
