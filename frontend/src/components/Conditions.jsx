/* eslint-disable react/prop-types */
import React, { useEffect, useState, useCallback } from 'react'
import logFetch from '../lib/logFetch'
import ModuleShell from './ModuleShell'
import logger from '../lib/logger'

function fmtTimeShort(iso) {
  try {
    if (!iso) return 'N/A'
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch (e) {
    return 'N/A'
  }
}

export default function Conditions({ locationQuery = '' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  let simulatePartial = false
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      simulatePartial = params.get('simulate_partial') === '1'
    }
  } catch (e) {
    simulatePartial = false
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function doFetch() {
      try {
        const res = await logFetch(`/api/conditions${locationQuery}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()

        // Support a simple client-side simulation of a partial payload
        // when the URL contains `?simulate_partial=1` (dev-only).
        try {
          const params = new URLSearchParams(window.location.search)
          if (params.get('simulate_partial') === '1') {
            if (json && typeof json === 'object') {
              delete json.summary
              json.meta = Object.assign({}, json.meta || {}, { partial: true })
            }
          }
        } catch (e) {
          // ignore any simulation errors
        }

        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) {
          if (simulatePartial) {
            // Populate minimal partial payload for dev simulation so stale badge shows
            setData({
              location_label: 'Simulated Location',
              cloud_cover_pct: null,
              moon_phase: null,
              darkness_window: { start: null, end: null },
              observing_score: null,
              summary: null,
              last_updated: new Date().toISOString(),
              meta: { partial: true },
            })
          } else {
            setError(err.message || 'Unknown error')
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void doFetch()

    return () => {
      cancelled = true
    }
  }, [locationQuery]);

  const handleRetry = useCallback(() => {
    // trigger a re-fetch by toggling loading and calling effect logic
    setLoading(true)
    setError(null)
    // emit dev-log entry
    try {
      logger.info('module', 'retry', { module: 'conditions' })
    } catch (e) {
      // ignore
    }
    // perform fetch
    logFetch(`/api/conditions${locationQuery}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message || 'Unknown error'))
      .finally(() => setLoading(false))
  }, [locationQuery])

  if (loading) {
    return (
      <ModuleShell title="Conditions" stale={false} onRetry={handleRetry}>
        <p className="loading">Loading conditions…</p>
      </ModuleShell>
    )
  }

  if (error) {
    return (
      <ModuleShell title="Conditions" stale={false} onRetry={handleRetry}>
        <p className="error">Error loading conditions: {error}</p>
      </ModuleShell>
    )
  }

  if (!data) {
    return (
      <ModuleShell title="Conditions" stale={false} onRetry={handleRetry}>
        <p>No data available</p>
      </ModuleShell>
    )
  }

  // Render user-friendly summary of conditions
  const { location_label, cloud_cover_pct, moon_phase, darkness_window, summary } = data

  const isStale = Boolean(data?.meta?.partial)
  // Dev-only: allow forcing the stale/degraded badge via URL param (computed above)
  const staleProp = Boolean(isStale || simulatePartial)

  return (
    <ModuleShell title="Conditions" stale={staleProp} onRetry={handleRetry}>
      <div className="conditions-body">
        <div className="cond-row"><strong>Location:</strong> {location_label || 'Unknown'}</div>
        <div className="cond-row small"><strong>Cloud cover:</strong> {typeof cloud_cover_pct === 'number' ? `${Math.round(cloud_cover_pct)}%` : 'N/A'}</div>
        <div className="cond-row small"><strong>Moon:</strong> {moon_phase || 'N/A'}</div>

        <div className="cond-row"><strong>Best darkness:</strong> {darkness_window?.start && darkness_window?.end ? `${fmtTimeShort(darkness_window.start)} – ${fmtTimeShort(darkness_window.end)}` : 'Not available'}</div>

        <div className="cond-row"><strong>Summary:</strong> {summary ? <span className="cond-summary">{summary}</span> : <span className="cond-summary muted">No short summary available.</span>}</div>
      </div>
    </ModuleShell>
  )
}
