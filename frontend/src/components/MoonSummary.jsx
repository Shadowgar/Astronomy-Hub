/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'

function fmtTimeShort(iso) {
  try {
    if (!iso) return 'N/A'
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch (e) {
    return 'N/A'
  }
}

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

  const darknessText = darkness_window?.start && darkness_window?.end
    ? `${fmtTimeShort(darkness_window.start)} – ${fmtTimeShort(darkness_window.end)}`
    : 'Not available'

  const note = summary ? ` Notes: ${summary}` : ''

  return (
    <div className="component moon-summary">
      <h3>Moon Summary</h3>
      <p className="moon-line"><strong>{moon_phase || 'Unknown'}</strong> — Peak darkness {darknessText}.{note}</p>
    </div>
  )
}
