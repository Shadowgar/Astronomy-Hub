/* eslint-disable react/prop-types */
import React, { useEffect, useMemo } from 'react'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'
import AppButton from './ui/AppButton'
import LoadingState from './ui/LoadingState'
import ErrorState from './ui/ErrorState'
import EmptyState from './ui/EmptyState'
import ObjectDetail from './ObjectDetail'
import Starfield from './Starfield'
import { useConditionsDataQuery } from '../features/conditions/queries'
import { useSceneAboveMeDataQuery } from '../features/scene/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'
import useGlobalUiState from '../state/globalUiState'

function labelForType(type) {
  if (type === 'satellite') return 'Satellite'
  if (type === 'planet') return 'Planet'
  if (type === 'deep_sky') return 'Deep Sky'
  return 'Object'
}

export default function AboveMeScene({ locationQuery = '' }) {
  const queryParams = parseLocationQuery(locationQuery)
  const sceneQuery = useSceneAboveMeDataQuery(queryParams)
  const conditionsQuery = useConditionsDataQuery(queryParams)
  const loading = sceneQuery.isLoading || conditionsQuery.isLoading
  const error = sceneQuery.isError
    ? (sceneQuery.error && sceneQuery.error.message) || 'Failed to load scene'
    : conditionsQuery.isError
      ? (conditionsQuery.error && conditionsQuery.error.message) || 'Failed to load conditions'
      : null
  const scene = sceneQuery.data || null
  const conditions = conditionsQuery.data || null
  const { selectedObjectId, setSelectedObjectId, setActiveSceneState } = useGlobalUiState()

  const objects = useMemo(() => (scene && Array.isArray(scene.objects) ? scene.objects : []), [scene])
  const topTarget = useMemo(() => objects.find((o) => o.type === 'planet' || o.type === 'deep_sky') || null, [objects])
  const nextPass = useMemo(() => objects.find((o) => o.type === 'satellite') || null, [objects])

  useEffect(() => {
    if (loading) {
      setActiveSceneState({ status: 'loading' })
      return
    }
    if (error) {
      setActiveSceneState({ status: 'error' })
      return
    }
    setActiveSceneState({ status: 'ready' })
  }, [loading, error, setActiveSceneState])

  return (
    <Panel className="module panel above-me-scene">
      <SectionHeader
        title="Sky context"
        subtitle="What is above you now. Select an object for details"
      />

      {loading && <LoadingState message="Loading scene…" />}
      {error && <ErrorState message={`Error loading scene: ${error}`} />}

      {!loading && !error && (
        <div className="above-me-scene__content">
          <div className="above-me-scene__briefing">
            <div className="above-me-scene__briefing-item"><strong>Conditions:</strong> {conditions?.observing_score ?? 'N/A'}</div>
            <div className="above-me-scene__briefing-item"><strong>Top target:</strong> {topTarget?.name || 'None'}</div>
            <div className="above-me-scene__briefing-item"><strong>Next pass:</strong> {nextPass?.name || 'None'}</div>
            <div className="above-me-scene__briefing-item"><strong>Visible:</strong> {objects.length}</div>
          </div>

          <div className="above-me-scene__sky" aria-label="Sky scene">
            <Starfield className="above-me-scene__starfield" />
            {objects.length === 0 && <div className="above-me-scene__empty"><EmptyState message="No objects currently above horizon." /></div>}
            {objects.map((obj, idx) => {
              const positionClass = `above-me-scene__pos-${idx % 15}`
              return (
                <button
                  key={obj.id || `${obj.name}-${idx}`}
                  type="button"
                  className={`above-me-scene__object above-me-scene__object--${obj.type || 'unknown'} ${positionClass}`}
                  onClick={() => setSelectedObjectId((prev) => (prev === obj.id ? null : obj.id))}
                >
                  <span className="above-me-scene__object-name">{obj.name}</span>
                  <span className="above-me-scene__object-type">{labelForType(obj.type)}</span>
                </button>
              )
            })}
          </div>

          {selectedObjectId && (
            <div className="above-me-scene__detail">
              <div className="above-me-scene__detail-header">
                <strong>Selected target details</strong>
                <AppButton onClick={() => setSelectedObjectId(null)}>Close</AppButton>
              </div>
              <ObjectDetail objectId={selectedObjectId} />
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
