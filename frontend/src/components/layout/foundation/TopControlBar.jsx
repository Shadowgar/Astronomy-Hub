import React from 'react'
import useDisplayModeState from '../../../state/displayModeState'
import useGlobalUiState from '../../../state/globalUiState'
import { useConditionsDataQuery } from '../../../features/conditions/queries'
import { parseLocationQuery } from '../../../features/shared/locationQuery'
import { useScopesQuery } from '../../../features/scopes/queries'

const COMMAND_ACTIONS = [
  { label: "What's above me now?", scope: 'above_me', engine: 'above_me', filter: 'visible_now' },
  { label: 'Show satellites', scope: 'satellites', engine: 'satellites', filter: 'visible_now' },
  { label: 'Show planets', scope: 'solar_system', engine: 'planets', filter: 'visible_now' },
  { label: 'Earth events', scope: 'earth', engine: 'satellites', filter: 'short_window' },
  { label: 'Solar', scope: 'sun', engine: 'moon', filter: 'visible_now' },
]

function formatScopeLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatConditionsScore(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed.toUpperCase() : 'UNKNOWN'
  }
  if (typeof value === 'number') {
    return String(Math.round(value))
  }
  return 'UNKNOWN'
}

function formatTemperatureCF(value) {
  const c = Number(value)
  if (!Number.isFinite(c)) return 'N/A'
  const f = (c * 9) / 5 + 32
  return `${c.toFixed(1)}C / ${f.toFixed(1)}F`
}

export default function TopControlBar() {
  const { mode, setMode, MODES } = useDisplayModeState()
  const {
    activeScope,
    activeEngine,
    activeFilter,
    setActiveScope,
    setActiveEngine,
    setActiveFilter,
    setSelectedObjectId,
    setUiToggle,
  } = useGlobalUiState()
  const locationQuery = typeof window !== 'undefined' ? window.location.search : ''
  const queryParams = parseLocationQuery(locationQuery)
  const scopesQuery = useScopesQuery()
  const conditionsQuery = useConditionsDataQuery(queryParams)
  const conditions = conditionsQuery.data && typeof conditionsQuery.data === 'object' ? conditionsQuery.data : null
  const hasConditions = Boolean(conditions)
  const cloudCover = Number.isFinite(Number(conditions?.cloud_cover_pct)) ? Number(conditions.cloud_cover_pct) : null
  const scopesPayload = scopesQuery.data && typeof scopesQuery.data === 'object' ? scopesQuery.data : null
  const scopes = Array.isArray(scopesPayload?.scopes) ? scopesPayload.scopes : []
  const scope = activeScope || 'above_me'
  const scopeEntry = scopes.find((entry) => entry?.scope === scope) || null
  const engines = scopeEntry
    ? [...new Set([...(scopeEntry.engines || []), ...(scopeEntry.optional_engines || [])])]
    : ['above_me']
  const engine = activeEngine || engines[0] || 'above_me'
  const filter = activeFilter || 'visible_now'
  const locationLabel = queryParams.lat && queryParams.lon
    ? `${queryParams.lat}, ${queryParams.lon}`
    : 'ORAS'
  const timeLabel = typeof window !== 'undefined'
    ? new URLSearchParams(locationQuery).get('at') || 'Now'
    : 'Now'

  const applySelection = (nextScope, nextEngine, nextFilter) => {
    setActiveScope(nextScope)
    setActiveEngine(nextEngine)
    setActiveFilter(nextFilter || 'visible_now')
    setSelectedObjectId(null)
  }

  return (
    <>
      <header className="app-header app-header-utility foundation-header-row" role="banner">
        <div className="foundation-header-main">
          <h1>Astronomy Hub</h1>
          <span className="foundation-header-user">User / Settings</span>
        </div>
        <div className="header-controls" aria-label="Top control bar">
          <span className="mode-control">
            Scope:
            <select
              aria-label="Scope selector"
              value={scope}
              onChange={(event) => {
                const nextScope = event.target.value
                const nextScopeEntry = scopes.find((entry) => entry?.scope === nextScope) || null
                const nextEngine = (nextScopeEntry?.engines || [])[0] || 'above_me'
                applySelection(nextScope, nextEngine, 'visible_now')
              }}
            >
              {(scopes.length > 0 ? scopes : [{ scope: 'above_me' }]).map((scopeItem) => (
                <option key={scopeItem.scope} value={scopeItem.scope}>
                  {formatScopeLabel(scopeItem.scope)}
                </option>
              ))}
            </select>
          </span>
          <span className="mode-control">
            Engine:
            <select
              aria-label="Engine selector"
              value={engine}
              onChange={(event) => {
                setActiveEngine(event.target.value)
                setActiveFilter('visible_now')
                setSelectedObjectId(null)
              }}
            >
              {engines.map((engineItem) => (
                <option key={engineItem} value={engineItem}>
                  {formatScopeLabel(engineItem)}
                </option>
              ))}
            </select>
          </span>
          <span className="mode-control">
            Time:
            <select aria-label="Time selector">
              <option value="now">{timeLabel}</option>
            </select>
          </span>
          <span className="mode-control">Location: {locationLabel}</span>
          <span className="mode-control">
            Mode:
            <select
              aria-label="Display mode"
              value={mode}
              onChange={(e) => {
                const nextMode = e.target.value
                if (MODES.includes(nextMode)) {
                  setMode(nextMode)
                }
              }}
            >
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </span>
        </div>
      </header>

      <section className="panel foundation-command-bar" aria-label="Command bar placeholder">
        <h2>Command Bar</h2>
        <div className="foundation-command-bar-row">
          <div className="foundation-command-bar-actions">
            {COMMAND_ACTIONS.map((command) => (
              <button
                key={command.label}
                type="button"
                className={scope === command.scope && engine === command.engine && filter === command.filter ? 'foundation-command-active' : ''}
                onClick={() => applySelection(command.scope, command.engine, command.filter)}
              >
                {command.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="foundation-conditions-chip"
            onClick={() => setUiToggle('conditionsModalOpen', true)}
            aria-label="Open conditions details"
          >
            {hasConditions ? (
              <>
                <span className="foundation-conditions-chip-label">Conditions</span>
                <span>{formatConditionsScore(conditions.observing_score)}</span>
                <span>{formatTemperatureCF(conditions.temperature_c)}</span>
                <span>{cloudCover !== null ? `Cloud ${cloudCover}%` : 'Cloud N/A'}</span>
              </>
            ) : (
              <>
                <span className="foundation-conditions-chip-label">Conditions</span>
                <span>{conditionsQuery.isLoading ? 'Loading…' : 'Unavailable'}</span>
              </>
            )}
          </button>
        </div>
      </section>
    </>
  )
}
