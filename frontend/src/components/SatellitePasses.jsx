/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import GlassPanel from './ui/GlassPanel'
import SectionHeader from './ui/SectionHeader'
import RowItem from './ui/RowItem'
import InlineExpansion from './common/InlineExpansion'
import ObjectDetail from './ObjectDetail'

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
    <GlassPanel className="component satellite-passes">
      <SectionHeader title="Satellite Passes" />

      {loading && <p className="loading">Loading passes…</p>}
      {error && <p className="error">Error loading passes: {error}</p>}

      {!loading && !error && (
        <ul>
          {passes.length === 0 && <li>No upcoming passes</li>}
          {passes.map((p, idx) => {
            const key = (p.object_name || '') + (p.start_time || '') || idx
            const summary = (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div><strong>{p.object_name}</strong></div>
                <div className="small">Visible: {p.visibility}</div>
                <div className="small">Peak elevation: {p.max_elevation_deg}{p.max_elevation_deg ? '°' : ''}</div>
                <div className="small">Path: {p.start_direction} → {p.end_direction}</div>
              </div>
            )

            const left = (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ minWidth: 0, flex: 1 }}>{summary}</div>
              </div>
            )

            const objectId = (p.object_name || '').toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-').replace("'", '')

            return (
              <li key={key} style={{ listStyle: 'none' }}>
                <InlineExpansion summary={left} defaultCollapsed={true}>
                  <ObjectDetail objectId={objectId} objectName={p.object_name} />
                </InlineExpansion>
              </li>
            )
          })}
        </ul>
      )}
    </GlassPanel>
  )
}
