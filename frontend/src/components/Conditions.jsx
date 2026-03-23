import React, { useEffect, useState } from 'react'

export default function Conditions() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/conditions')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!cancelled) setData(json)
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

  if (loading) {
    return (
      <div className="component conditions">
        <h2>Conditions</h2>
        <p className="loading">Loading conditions…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="component conditions">
        <h2>Conditions</h2>
        <p className="error">Error loading conditions: {error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="component conditions">
        <h2>Conditions</h2>
        <p>No data available</p>
      </div>
    )
  }

  // Render exactly the fields from the Conditions contract
  const {
    location_label,
    cloud_cover_pct,
    moon_phase,
    darkness_window,
    observing_score,
    summary,
    last_updated,
  } = data

  return (
    <div className="component conditions">
      <h2>Conditions</h2>
      <dl>
        <dt>location_label</dt>
        <dd>{location_label}</dd>

        <dt>cloud_cover_pct</dt>
        <dd>{String(cloud_cover_pct)}</dd>

        <dt>moon_phase</dt>
        <dd>{moon_phase}</dd>

        <dt>darkness_window.start</dt>
        <dd>{darkness_window?.start}</dd>

        <dt>darkness_window.end</dt>
        <dd>{darkness_window?.end}</dd>

        <dt>observing_score</dt>
        <dd>{observing_score}</dd>

        <dt>summary</dt>
        <dd>{summary}</dd>

        <dt>last_updated</dt>
        <dd>{last_updated}</dd>
      </dl>
    </div>
  )
}
