/* eslint-disable react/prop-types */
import React from "react";
import Panel from "./ui/Panel";
import SectionHeader from "./ui/SectionHeader";
import LoadingState from "./ui/LoadingState";
import ErrorState from "./ui/ErrorState";
import EmptyState from "./ui/EmptyState";
import InlineExpansion from './common/InlineExpansion'
import ObjectDetail from './ObjectDetail'
import { useAlertsQuery } from '../features/alerts/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'

const MAX_ALERTS = 3

export default function AlertsEvents({ locationQuery = '' }) {
  const queryParams = parseLocationQuery(locationQuery)
  const alertsQuery = useAlertsQuery(queryParams)
  const loading = alertsQuery.isLoading
  const error = alertsQuery.isError
    ? (alertsQuery.error && alertsQuery.error.message) || 'Unknown error'
    : null
  const alerts = Array.isArray(alertsQuery.data) ? alertsQuery.data.slice(0, MAX_ALERTS) : []

  return (
    <Panel className="component alerts-events">
      <SectionHeader title="Alerts / Events" />

      {loading && <LoadingState message="Loading alerts…" />}
      {error && <ErrorState message={`Error loading alerts: ${error}`} />}

      {!loading && !error && (
        <ol>
          {alerts.length === 0 && <li><EmptyState message="No alerts" /></li>}
          {alerts.map((a, idx) => {
            const key = a.title || idx
            const summary = (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div>
                  <strong>{a.title}</strong>
                </div>
                <div className="small muted-meta">{a.category} · Relevance: {a.relevance} · Priority: {a.priority}</div>
                <div style={{ marginTop: 'var(--space-2)' }}>{a.summary}</div>
              </div>
            )

            // If the alert references an object by name, allow inline detail expansion
            const relatedName = a.object_name || a.related_object || a.related_object_name || null
            const objectId = relatedName
              ? (relatedName || '')
                  .toLowerCase()
                  .split(/\s+/)
                  .join('-')
                  .split('/')
                  .join('-')
                  .split("'")
                  .join('')
              : null

            return (
              <li key={key} style={{ listStyle: 'none' }}>
                <InlineExpansion summary={summary} defaultCollapsed={true}>
                  {objectId ? (
                    <ObjectDetail objectId={objectId} objectName={relatedName} />
                  ) : (
                    // No object referenced; repeat summary for expanded view
                    <div style={{ paddingTop: 'var(--space-2)' }}>{a.summary}</div>
                  )}
                </InlineExpansion>
              </li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}

// prop-types disabled for simplicity (consistent with other components)
