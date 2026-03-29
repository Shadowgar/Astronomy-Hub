/* eslint-disable react/prop-types */
import React from 'react'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'
import DataRow from './ui/DataRow'
import LoadingState from './ui/LoadingState'
import ErrorState from './ui/ErrorState'
import EmptyState from './ui/EmptyState'
import InlineExpansion from './common/InlineExpansion'
import ObjectDetail from './ObjectDetail'
import { useTargetsQuery } from '../features/targets/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'
import useGlobalUiState from '../state/globalUiState'

// Render up to 5 targets per UI density rules
const MAX_TARGETS = 5

export default function RecommendedTargets({ locationQuery = '' }) {
  const queryParams = parseLocationQuery(locationQuery)
  const targetsQuery = useTargetsQuery(queryParams)
  const { selectedObjectId, setSelectedObjectId } = useGlobalUiState()
  const loading = targetsQuery.isLoading
  const error = targetsQuery.isError
    ? (targetsQuery.error && targetsQuery.error.message) || 'Unknown error'
    : null
  const targets = Array.isArray(targetsQuery.data) ? targetsQuery.data.slice(0, MAX_TARGETS) : []

  return (
    <Panel className="component recommended-targets">
      <SectionHeader
        title="What to look at next"
        subtitle="Select a target for details and make it active"
      />

      {loading && <LoadingState message="Loading targets…" />}
      {error && <ErrorState message={`Error loading targets: ${error}`} />}

      {!loading && !error && (
        <div className="recommended-targets-body">
          {targets.length === 0 && <EmptyState message="No targets available" />}
          <ul className="recommended-targets-list">
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
                <div className="target-row-inline">
                  <div className="target-row__icon" aria-hidden>
                    {t.imageUrl ? (
                      <img
                        src={t.imageUrl}
                        alt={`${t.name} thumbnail`}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                        className="target-thumb"
                      />
                    ) : (
                      <div />
                    )}
                  </div>

                  <div className="target-row__content target-row-content-inline">
                    <div
                      onClickCapture={() => setSelectedObjectId(computedId)}
                    >
                      <InlineExpansion summary={summary} defaultCollapsed={true}>
                        <ObjectDetail objectId={computedId} objectName={t.name} />
                      </InlineExpansion>
                    </div>
                    {selectedObjectId === computedId ? (
                      <div className="small muted-meta selected-flow-note">
                        Selected in plan
                      </div>
                    ) : null}
                  </div>
                </div>
              )

              const right = (<div className="target-row__chev" aria-hidden>›</div>)

              return (
                <li key={t.name || idx} className="recommended-target-item">
                  <DataRow left={left} right={right} />
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Panel>
  )
}
