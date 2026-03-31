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
import { useSceneByScopeDataQuery } from '../features/scene/queries'
import { useScopesQuery } from '../features/scopes/queries'
import { parseLocationQuery } from '../features/shared/locationQuery'
import useGlobalUiState from '../state/globalUiState'

const SCOPE_LABELS = {
  above_me: 'Above Me',
  earth: 'Earth',
  sun: 'Sun',
  satellites: 'Satellites',
  flights: 'Flights',
  solar_system: 'Solar System',
  deep_sky: 'Deep Sky',
}

const DEFAULT_SCOPE_ENGINE = {
  above_me: 'above_me',
  earth: 'satellites',
  sun: 'moon',
  satellites: 'satellites',
  flights: 'flights',
  solar_system: 'planets',
  deep_sky: 'deep_sky',
}

function labelForType(type) {
  if (type === 'satellite') return 'Satellite'
  if (type === 'planet') return 'Planet'
  if (type === 'deep_sky') return 'Deep Sky'
  return 'Object'
}

export default function AboveMeScene({ locationQuery = '' }) {
  const queryParams = parseLocationQuery(locationQuery)
  const {
    activeScope,
    activeEngine,
    activeFilter,
    selectedObjectId,
    setActiveEngine,
    setActiveFilter,
    setSelectedObjectId,
    setActiveSceneState,
  } = useGlobalUiState()
  const scope = activeScope || 'above_me'
  const scopeLabel = SCOPE_LABELS[scope] || 'Above Me'
  const engine = activeEngine || DEFAULT_SCOPE_ENGINE[scope] || 'above_me'

  const scopeMetaQuery = useScopesQuery({ scope, engine })
  const scopeMeta = scopeMetaQuery.data || {}
  const allowedFilters = Array.isArray(scopeMeta.allowed_filters) ? scopeMeta.allowed_filters : []
  const defaultFilter = typeof scopeMeta.default_filter === 'string' ? scopeMeta.default_filter : 'visible_now'
  const resolvedFilter = allowedFilters.includes(activeFilter) ? activeFilter : defaultFilter

  const sceneQuery = useSceneByScopeDataQuery({ ...queryParams, scope, engine, filter: resolvedFilter })
  const conditionsQuery = useConditionsDataQuery(queryParams)
  const loading = sceneQuery.isLoading || conditionsQuery.isLoading
  const error = sceneQuery.isError
    ? (sceneQuery.error && sceneQuery.error.message) || 'Failed to load scene'
    : conditionsQuery.isError
      ? (conditionsQuery.error && conditionsQuery.error.message) || 'Failed to load conditions'
      : null
  const scene = sceneQuery.data || null
  const conditions = conditionsQuery.data || null

  const objects = useMemo(() => (scene && Array.isArray(scene.objects) ? scene.objects : []), [scene])
  const topTarget = useMemo(() => objects.find((o) => o.type === 'planet' || o.type === 'deep_sky') || null, [objects])
  const nextPass = useMemo(() => objects.find((o) => o.type === 'satellite') || null, [objects])

  useEffect(() => {
    if (!activeEngine && engine) {
      setActiveEngine(engine)
    }
  }, [activeEngine, engine, setActiveEngine])

  useEffect(() => {
    if (resolvedFilter && resolvedFilter !== activeFilter) {
      setActiveFilter(resolvedFilter)
    }
  }, [activeFilter, resolvedFilter, setActiveFilter])

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
        title={`${scopeLabel} context`}
        subtitle={`Scope: ${scopeLabel}. Select an object for details`}
      />
      <div className="above-me-scene__briefing-item">
        <strong>Engine:</strong> {engine}
      </div>
      {allowedFilters.length > 0 && (
        <label className="above-me-scene__briefing-item" htmlFor="scene-filter-selector">
          <strong>Filter:</strong>{' '}
          <select
            id="scene-filter-selector"
            aria-label="Filter selector"
            value={resolvedFilter}
            onChange={(event) => {
              setSelectedObjectId(null)
              setActiveFilter(event.target.value)
            }}
          >
            {allowedFilters.map((filterOption) => (
              <option key={filterOption} value={filterOption}>
                {filterOption}
              </option>
            ))}
          </select>
        </label>
      )}

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
            {objects.length === 0 && (
              <div className="above-me-scene__empty">
                <EmptyState message={`No objects currently available for ${scopeLabel}.`} />
              </div>
            )}
            {objects.map((obj, idx) => {
              const positionClass = `above-me-scene__pos-${idx % 15}`
              return (
                <button
                  key={obj.id || `${obj.name}-${idx}`}
                  type="button"
                  className={`above-me-scene__object above-me-scene__object--${obj.type || 'unknown'} ${positionClass}`}
                  onClick={() => setSelectedObjectId(selectedObjectId === obj.id ? null : obj.id)}
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
