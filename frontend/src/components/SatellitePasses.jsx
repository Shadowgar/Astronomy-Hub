/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'

const MAX_PASSES = 5

export default function SatellitePasses({ locationQuery = '' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [passes, setPasses] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/passes${locationQuery}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!cancelled && Array.isArray(json)) setPasses(json.slice(0, MAX_PASSES))
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
    <div className="component satellite-passes">
      <h2>Satellite Passes</h2>

      {loading && <p className="loading">Loading passes…</p>}
      {error && <p className="error">Error loading passes: {error}</p>}

      {!loading && !error && (
        <ul>
          {passes.length === 0 && <li>No upcoming passes</li>}
          {passes.map((p, idx) => (
            <li key={(p.object_name || '') + (p.start_time || '') || idx} className="pass-item">
              <strong>{p.object_name}</strong>
              <div className="small">start_time: {p.start_time} · visibility: {p.visibility}</div>
              <div className="small">max_elevation_deg: {p.max_elevation_deg}</div>
              <div className="small">start_direction: {p.start_direction} · end_direction: {p.end_direction}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
