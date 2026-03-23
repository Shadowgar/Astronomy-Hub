/* eslint-disable react/prop-types */
import React, { useEffect, useState, useCallback } from 'react'
import logFetch from '../lib/logFetch'
import ModuleShell from './ModuleShell'
import logger from '../lib/logger'

export default function Conditions({ locationQuery = '' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    let reload = 0

    const doFetch = () => {
      logFetch(`/api/conditions${locationQuery}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        // Support a simple client-side simulation of a partial payload
        // when the URL contains `?simulate_partial=1` (dev-only).
        try {
          const params = new URLSearchParams(window.location.search)
          if (params.get('simulate_partial') === '1') {
            // drop one field to simulate partial payload and mark as partial
            if (json && typeof json === 'object') {
              delete json.summary
              json.meta = Object.assign({}, json.meta || {}, { partial: true })
            }
          }
        } catch (e) {
          // ignore any simulation errors
        }

        if (!cancelled) setData(json)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Unknown error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    doFetch()

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

  // Render exactly the fields from the Conditions contract
  const { location_label, cloud_cover_pct, moon_phase, darkness_window, observing_score, summary, last_updated } = data

  const isStale = Boolean(data && data.meta && data.meta.partial)

  return (
    <ModuleShell title="Conditions" stale={isStale} onRetry={handleRetry}>
      <dl>
        <dt>location_label</dt>
        <dd>{location_label}</dd>

        <dt>cloud_cover_pct</dt>
        <dd>{String(cloud_cover_pct)}</dd>

        <dt>moon_phase</dt>
        <dd>{moon_phase}</dd>

        <dt>darkness_window.start</dt>
        <dd>{darkness_window && darkness_window.start}</dd>

        <dt>darkness_window.end</dt>
        <dd>{darkness_window && darkness_window.end}</dd>

        <dt>observing_score</dt>
        <dd>{observing_score}</dd>

        <dt>summary</dt>
        <dd>{summary}</dd>

        <dt>last_updated</dt>
        <dd>{last_updated}</dd>
      </dl>
    </ModuleShell>
  )
}
