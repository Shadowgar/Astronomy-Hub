/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import GlassPanel from "./ui/GlassPanel";
import SectionHeader from "./ui/SectionHeader";
import InlineExpansion from './common/InlineExpansion'
import ObjectDetail from './ObjectDetail'

const MAX_ALERTS = 3

export default function AlertsEvents({ locationQuery = '' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/alerts${locationQuery}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!cancelled && Array.isArray(json)) setAlerts(json.slice(0, MAX_ALERTS))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Unknown error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [locationQuery])

  return (
    <GlassPanel className="component alerts-events">
      <SectionHeader title="Alerts / Events" />

      {loading && <p className="loading">Loading alerts…</p>}
      {error && <p className="error">Error loading alerts: {error}</p>}

      {!loading && !error && (
        <ol>
          {alerts.length === 0 && <li>No alerts</li>}
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
    </GlassPanel>
  )
}

// prop-types disabled for simplicity (consistent with other components)
