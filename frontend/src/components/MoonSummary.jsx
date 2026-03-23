/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'

export default function MoonSummary({ locationQuery = '' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/conditions${locationQuery}`)
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
  }, [locationQuery])

  if (loading) {
    return (
      <div className="component moon-summary">
        <h3>Moon Summary</h3>
        <p className="loading">Loading moon summary…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="component moon-summary">
        <h3>Moon Summary</h3>
        <p className="error">Error loading moon summary: {error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="component moon-summary">
        <h3>Moon Summary</h3>
        <p>No data available</p>
      </div>
    )
  }

  const { moon_phase, darkness_window, summary } = data

  return (
    <div className="component moon-summary">
      <h3>Moon Summary</h3>

      <dl>
        <dt>Phase</dt>
        <dd>{moon_phase}</dd>

        <dt>Darkness</dt>
        <dd>
          {darkness_window?.start || '—'} — {darkness_window?.end || '—'}
        </dd>

        {summary ? (
          <>
            <dt>Notes</dt>
            <dd>{summary}</dd>
          </>
        ) : null}
      </dl>
    </div>
  )
}
