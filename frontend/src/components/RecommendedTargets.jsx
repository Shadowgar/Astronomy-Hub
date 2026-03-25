/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import GlassPanel from './ui/GlassPanel'
import SectionHeader from './ui/SectionHeader'
import RowItem from './ui/RowItem'
import InlineExpansion from './common/InlineExpansion'
import TargetDetail from './TargetDetail'

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
    <GlassPanel className="component recommended-targets">
      <SectionHeader title="Recommended Targets" />

      {loading && <p className="loading">Loading targets…</p>}
      {error && <p className="error">Error loading targets: {error}</p>}

      {!loading && !error && (
        <div style={{ padding: 0 }}>
          {targets.length === 0 && <div>No targets available</div>}
          <ul style={{ margin: 0, padding: 0 }}>
            {targets.map((t, idx) => {
              const summary = (
                <div className="target-row__meta">
                  <strong className="target-row__title">{t.name}</strong>
                  <div className="target-row__subtitle">{t.category}{t.direction ? ` · ${t.direction}` : ''}</div>
                </div>
              )

              const left = (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="target-row__icon" aria-hidden>
                    {t.imageUrl ? (
                      <img
                        src={t.imageUrl}
                        alt={`${t.name} thumbnail`}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                      />
                    ) : (
                      <div />
                    )}
                  </div>

                  <div className="target-row__content">
                    <InlineExpansion summary={summary} defaultCollapsed={true}>
                      <TargetDetail target={t} />
                    </InlineExpansion>
                  </div>
                </div>
              )

              const right = (<div className="target-row__chev" aria-hidden>›</div>)

              return (
                <li key={t.name || idx} style={{ listStyle: 'none' }}>
                  <RowItem left={left} right={right} />
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </GlassPanel>
  )
}
