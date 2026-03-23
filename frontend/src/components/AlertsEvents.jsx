import React, { useEffect, useState } from 'react'

const MAX_ALERTS = 3

export default function AlertsEvents() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/alerts')
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
  }, [])

  return (
    <div className="component alerts-events">
      <h2>Alerts / Events</h2>

      {loading && <p className="loading">Loading alerts…</p>}
      {error && <p className="error">Error loading alerts: {error}</p>}

      {!loading && !error && (
        <ol>
          {alerts.length === 0 && <li>No alerts</li>}
          {alerts.map((a, idx) => (
            <li key={a.title || idx} className="alert-item">
              <strong>{a.title}</strong>
              <div className="small">priority: {a.priority} · category: {a.category}</div>
              <p>{a.summary}</p>
              <div className="small">relevance: {a.relevance}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
