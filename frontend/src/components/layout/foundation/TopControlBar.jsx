import React from 'react'
import useDisplayModeState from '../../../state/displayModeState'
import useGlobalUiState from '../../../state/globalUiState'
import { useConditionsDataQuery } from '../../../features/conditions/queries'
import { parseLocationQuery } from '../../../features/shared/locationQuery'
import { topBar } from './foundationData'

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
  const { setUiToggle } = useGlobalUiState()
  const locationQuery = typeof window !== 'undefined' ? window.location.search : ''
  const queryParams = parseLocationQuery(locationQuery)
  const conditionsQuery = useConditionsDataQuery(queryParams)
  const conditions = conditionsQuery.data && typeof conditionsQuery.data === 'object' ? conditionsQuery.data : null
  const hasConditions = Boolean(conditions)
  const cloudCover = Number.isFinite(Number(conditions?.cloud_cover_pct)) ? Number(conditions.cloud_cover_pct) : null

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
            <select aria-label="Scope selector (placeholder)" defaultValue="above_me">
              <option value="above_me">{topBar.scope}</option>
            </select>
          </span>
          <span className="mode-control">
            Engine:
            <select aria-label="Engine selector (placeholder)" defaultValue="conditions">
              <option value="conditions">{topBar.engine}</option>
            </select>
          </span>
          <span className="mode-control">
            Time:
            <select aria-label="Time selector (placeholder)" defaultValue="now">
              <option value="now">{topBar.time}</option>
            </select>
          </span>
          <span className="mode-control">Location: {topBar.location}</span>
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
            {topBar.commands.map((command) => (
              <button key={command} type="button">
                {command}
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
