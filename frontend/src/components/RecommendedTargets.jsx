/* eslint-disable react/prop-types */
import React from 'react'
import GlassPanel from './ui/GlassPanel'
import SectionHeader from './ui/SectionHeader'
import RowItem from './ui/RowItem'
import InlineExpansion from './common/InlineExpansion'
import ObjectDetail from './ObjectDetail'
import { useTargetsQuery } from '../features/targets/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'

// Render up to 5 targets per UI density rules
const MAX_TARGETS = 5

export default function RecommendedTargets({ locationQuery = '' }) {
  const queryParams = parseLocationQuery(locationQuery)
  const targetsQuery = useTargetsQuery(queryParams)
  const loading = targetsQuery.isLoading
  const error = targetsQuery.isError
    ? (targetsQuery.error && targetsQuery.error.message) || 'Unknown error'
    : null
  const targets = Array.isArray(targetsQuery.data) ? targetsQuery.data.slice(0, MAX_TARGETS) : []

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
                  <div className="target-row__subtitle">{(t.type || t.category)}{t.direction ? ` · ${t.direction}` : ''}</div>
                </div>
              )

              const computedId = t.id || (t.name || '')
                .toLowerCase()
                .split(/\s+/)
                .join('-')
                .split('/')
                .join('-')
                .split("'")
                .join('')

              const left = (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
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

                  <div className="target-row__content" style={{ minWidth: 0 }}>
                    <InlineExpansion summary={summary} defaultCollapsed={true}>
                      <ObjectDetail objectId={computedId} objectName={t.name} />
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
