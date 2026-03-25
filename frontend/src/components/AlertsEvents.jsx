/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import GlassPanel from './components/ui/GlassPanel'
import SectionHeader from './components/ui/SectionHeader'

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
          {alerts.map((a, idx) => (
            <li key={a.title || idx} className="alert-item">
              <strong>{a.title}</strong>
              <div className="small muted-meta">{a.category} · Relevance: {a.relevance} · Priority: {a.priority}</div>
              <p>{a.summary}</p>
            </li>
          ))}
        </ol>
      )}
    </GlassPanel>
  )
}
