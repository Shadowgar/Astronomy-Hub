/* eslint-disable react/prop-types */
import React from 'react'
import GlassPanel from './ui/GlassPanel'
import SectionHeader from './ui/SectionHeader'
// RowItem not used in this component
import InlineExpansion from './common/InlineExpansion'
import ObjectDetail from './ObjectDetail'
import { usePassesQuery } from '../features/passes/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'

const MAX_PASSES = 5

export default function SatellitePasses({ locationQuery = '' }) {
  const queryParams = parseLocationQuery(locationQuery)
  const passesQuery = usePassesQuery(queryParams)
  const loading = passesQuery.isLoading
  const error = passesQuery.isError
    ? (passesQuery.error && passesQuery.error.message) || 'Unknown error'
    : null
  const passes = Array.isArray(passesQuery.data) ? passesQuery.data.slice(0, MAX_PASSES) : []

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

            const objectId = (p.object_name || '')
              .toLowerCase()
              .split(/\s+/)
              .join('-')
              .split('/')
              .join('-')
              .split("'")
              .join('')

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
