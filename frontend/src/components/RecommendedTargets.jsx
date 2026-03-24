/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import TargetRow from './TargetRow'

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
        <div style={{padding: 0}}>
          {targets.length === 0 && <div>No targets available</div>}
          <ul style={{margin: 0, padding: 0}}>
            {targets.map((t, idx) => (
              <TargetRow key={t.name || idx} target={t} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
