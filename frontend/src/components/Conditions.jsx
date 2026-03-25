/* eslint-disable react/prop-types */
import React, { useEffect, useState, useCallback } from 'react'
import logFetch from '../lib/logFetch'
import GlassPanel from './ui/GlassPanel'
import SectionHeader from './ui/SectionHeader'
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

  const simulatePartial = (() => {
    try {
      if (typeof window === 'undefined') return false
      const params = new URLSearchParams(window.location.search)
      return params.get('simulate_partial') === '1'
    } catch (e) {
      return false
    }
  })()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await logFetch(`/api/conditions${locationQuery}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()

      // Dev-only: allow simulating a partial payload via URL param
      if (simulatePartial && json && typeof json === 'object') {
        const patched = Object.assign({}, json)
        delete patched.summary
        patched.meta = Object.assign({}, patched.meta || {}, { partial: true })
        setData(patched)
      } else {
        setData(json)
      }
    } catch (err) {
      logger?.info?.('module', 'conditions:fetch:error', { err: err && err.message })
      if (simulatePartial) {
        setData({
          location_label: 'Simulated Location',
          cloud_cover_pct: null,
          moon_phase: null,
          darkness_window: { start: null, end: null },
          summary: null,
          last_updated: new Date().toISOString(),
          meta: { partial: true },
        })
      } else {
        setError(err.message || 'Unknown error')
      }
    } finally {
      setLoading(false)
    }
  }, [locationQuery, simulatePartial])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRetry = () => fetchData()

  if (loading) {
    return (
      <GlassPanel className="module conditions-module panel">
        <SectionHeader title="Conditions" />
        <p className="loading">Loading conditions…</p>
      </GlassPanel>
    )
  }

  if (error) {
    return (
      <GlassPanel className="module conditions-module panel">
        <SectionHeader title="Conditions" action={<button onClick={handleRetry}>Retry</button>} />
        <p className="error">Error loading conditions: {error}</p>
      </GlassPanel>
    )
  }

  if (!data) {
    return (
      <GlassPanel className="module conditions-module panel">
        <SectionHeader title="Conditions" action={<button onClick={handleRetry}>Retry</button>} />
        <p>No data available</p>
      </GlassPanel>
    )
  }

  const { location_label, cloud_cover_pct, moon_phase, darkness_window, summary } = data

  const isStale = Boolean(data?.meta?.partial)
  const staleProp = Boolean(isStale || simulatePartial)

  const cloudText = typeof cloud_cover_pct === 'number' ? `${Math.round(cloud_cover_pct)}%` : 'N/A'
  const moonText = moon_phase || 'N/A'
  const darknessText = darkness_window?.start && darkness_window?.end
    ? `${fmtTimeShort(darkness_window.start)} – ${fmtTimeShort(darkness_window.end)}`
    : 'Not available'

  // Compact, chip-style signal rows for quick scanning
  return (
    <GlassPanel className="module conditions-module panel">
      <SectionHeader title="Conditions" subtitle={staleProp ? 'Partial data' : undefined} />
      <div className="conditions-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '1rem' }}>{location_label || 'Unknown location'}</strong>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{data?.last_updated ? fmtTimeShort(data.last_updated) : ''}</small>
        </div>

        {summary && (
          <div className="conditions-summary" style={{ marginTop: 'var(--space-3)' }}>{summary}</div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'var(--surface-panel)', fontWeight: 700 }}>{cloudText}</span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'transparent', color: 'var(--text-muted)' }}>{moonText}</span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'transparent', color: 'var(--text-muted)' }}>{darknessText}</span>
          {typeof data?.observing_score === 'number' ? (
            <span style={{ marginLeft: 6, padding: '4px 8px', borderRadius: 6, background: 'var(--accent)', color: 'white', fontWeight: 700 }}>{Math.round(data.observing_score)}</span>
          ) : null}
        </div>
      </div>
    </GlassPanel>
  )
}
