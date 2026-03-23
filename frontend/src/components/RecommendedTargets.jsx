/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'

// Render up to 5 targets per UI density rules
const MAX_TARGETS = 5

export default function RecommendedTargets({ locationQuery = '' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [targets, setTargets] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/targets${locationQuery}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!cancelled && Array.isArray(json)) setTargets(json.slice(0, MAX_TARGETS))
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
    <div className="component recommended-targets">
      <h2>Recommended Targets</h2>

      {loading && <p className="loading">Loading targets…</p>}
      {error && <p className="error">Error loading targets: {error}</p>}

      {!loading && !error && (
        <ul>
          {targets.length === 0 && <li>No targets available</li>}
          {targets.map((t, idx) => (
            <li key={t.name || idx} className="target-item">
              <strong>{t.name}</strong>
              <div className="small">
                <span>category: {t.category}</span> · <span>direction: {t.direction}</span>
              </div>
              <div className="small">
                <span>elevation_band: {t.elevation_band}</span> · <span>best_time: {t.best_time}</span>
              </div>
              <div className="small">
                <span>difficulty: {t.difficulty}</span>
              </div>
              <p>{t.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
