import React, { useState, useEffect } from 'react'
import Conditions from './components/Conditions'
import RecommendedTargets from './components/RecommendedTargets'
import AlertsEvents from './components/AlertsEvents'
import SatellitePasses from './components/SatellitePasses'
import MoonSummary from './components/MoonSummary'
import PrimaryDecisionPanel from './components/PrimaryDecisionPanel'
import LocationSelector from './components/LocationSelector/LocationSelector'
import useLocationState from './state/locationState'
import Starfield from './components/Starfield'

const MODES = ['Light', 'Dark', 'Red']

export default function App() {
  const MODE_OPTIONS = ['Light', 'Dark', 'Red']
  const THEME_CLASSES = ['theme-light', 'theme-light-hc', 'theme-dark', 'theme-dark-hc', 'theme-red']

  const mapModeToThemeClass = (m) => {
    if (m === 'Light') return 'theme-light'
    if (m === 'Dark') return 'theme-dark'
    if (m === 'Red') return 'theme-red'
    return 'theme-light'
  }

  const mapThemeClassToBase = (tc) => {
    if (!tc) return 'Light'
    if (tc === 'theme-red') return 'Red'
    if (tc.startsWith('theme-light')) return 'Light'
    if (tc.startsWith('theme-dark')) return 'Dark'
    return 'Light'
  }

  const [mode, setMode] = useState(() => {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const stored = globalThis.localStorage.getItem('astronomyHub.mode')
      // legacy values
      if (MODE_OPTIONS.includes(stored)) return stored
      // stored might be a theme class — map to base for UI controls
      if (typeof stored === 'string') {
        return mapThemeClassToBase(stored)
      }
      return 'Light'
    }
    return 'Light'
  })

  useEffect(() => {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const currentStored = globalThis.localStorage.getItem('astronomyHub.mode')
      // If the stored value is a theme class and it maps to the same base mode,
      // avoid overwriting it on initial mount so manual theme-class values are preserved.
      if (!(THEME_CLASSES.includes(currentStored) && mapThemeClassToBase(currentStored) === mode)) {
        globalThis.localStorage.setItem('astronomyHub.mode', mode)
      }
    }
  }, [mode])

  useEffect(() => {
    // Determine which theme-class to apply to the root element:
    // prefer an explicit theme-class stored in localStorage if present,
    // otherwise map the current base `mode` to its theme-class.
    let themeClass = mapModeToThemeClass(mode)
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const stored = globalThis.localStorage.getItem('astronomyHub.mode')
      if (THEME_CLASSES.includes(stored)) {
        themeClass = stored
      }
    }

    const root = (typeof document !== 'undefined' && (document.documentElement || document.body))
    if (root) {
      THEME_CLASSES.forEach((c) => root.classList.remove(c))
      root.classList.add(themeClass)
    }
  }, [mode])

  

  // Active Observing Location (Phase 1 - frontend-only, session state)
  const ORAS = {
    label: 'ORAS Observatory',
    latitude: 41.321903,
    longitude: -79.585394,
    elevation_ft: 1420,
  }

  // replace single-state with useLocationState to provide `pendingLocation` for Step 2D.D3
  const {
    activeLocation,
    setActiveLocation,
    pendingLocation,
    setPending,
    confirmPending,
    clearPending,
  } = useLocationState(ORAS)
  const [latInput, setLatInput] = useState('')
  const [lonInput, setLonInput] = useState('')
  const [elevInput, setElevInput] = useState('')
  const [locError, setLocError] = useState('')

  // build location query string for children when activeLocation is custom
  let locationQuery = ''
  if (activeLocation !== ORAS) {
    const lat = encodeURIComponent(activeLocation.latitude)
    const lon = encodeURIComponent(activeLocation.longitude)
    locationQuery = `?lat=${lat}&lon=${lon}`
    if (activeLocation.elevation_ft !== undefined && activeLocation.elevation_ft !== null) {
      locationQuery += `&elevation_ft=${encodeURIComponent(activeLocation.elevation_ft)}`
    }
  }

  return (
    <div className={`app-shell mode-${mode.toLowerCase()}`}>
      <Starfield />
      <header className="app-header" role="banner">
        <h1>Astronomy Hub</h1>
        <div className="header-controls">
          <div className="location-section">
            <span className="location-label">Location: {activeLocation === ORAS ? ORAS.label : `Custom Location (${activeLocation.latitude.toFixed(5)}, ${activeLocation.longitude.toFixed(5)})`}</span>

            <div className="location-inputs">
              <input
                aria-label="Latitude"
                placeholder="lat"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                className="input-lat"
              />
              <input
                aria-label="Longitude"
                placeholder="lon"
                value={lonInput}
                onChange={(e) => setLonInput(e.target.value)}
                className="input-lon"
              />
              <input
                aria-label="Elevation feet (optional)"
                placeholder="elev ft"
                value={elevInput}
                onChange={(e) => setElevInput(e.target.value)}
                className="input-elev"
              />
              <button
                onClick={() => {
                  // validate inputs
                  setLocError('')
                  const lat = Number.parseFloat(latInput)
                  const lon = Number.parseFloat(lonInput)
                  const elev = elevInput === '' ? undefined : Number(elevInput)
                  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
                    setLocError('Latitude must be a number between -90 and 90')
                    return
                  }
                  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
                    setLocError('Longitude must be a number between -180 and 180')
                    return
                  }
                  if (elev !== undefined && !Number.isFinite(elev)) {
                    setLocError('Elevation must be a number')
                    return
                  }
                  // apply for session only
                  setActiveLocation({ label: 'Custom Location', latitude: lat, longitude: lon, elevation_ft: elev })
                }}
                className="location-actions"
              >Apply for session</button>
              <button
                onClick={() => {
                  setLocError('')
                  setActiveLocation(ORAS)
                  setLatInput('')
                  setLonInput('')
                  setElevInput('')
                }}
              >Reset to ORAS</button>
              {/* Optional dev mount for the LocationSelector used by Step 2D.D3. Enable with ?mountLocationSelector=1 */}
              {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mountLocationSelector') === '1' && (
                <div className="pending-location">
                  <LocationSelector
                    onApply={(v) => {
                      setPending(v)
                      if (new URLSearchParams(window.location.search).get('devlog') === '1') {
                        // single-line JSON log for dev observation
                        try { console.log(JSON.stringify({ event: 'pending_set', pending: v })) } catch (e) { /* noop */ }
                      }
                    }}
                  />
                </div>
              )}
              {/* Show pending location and confirm control when set */}
              {pendingLocation && (
                <div className="pending-location">
                  <span className="pending-text">Pending: {pendingLocation.name || (pendingLocation.latitude && `${pendingLocation.latitude.toFixed(3)}, ${pendingLocation.longitude.toFixed(3)}`)}</span>
                  <button onClick={() => {
                    confirmPending()
                    if (new URLSearchParams(window.location.search).get('devlog') === '1') {
                      try { console.log(JSON.stringify({ event: 'pending_confirm', confirmed: pendingLocation })) } catch (e) {}
                    }
                  }}>Confirm pending</button>
                  <button onClick={() => clearPending()} className="clear-pending">Clear pending</button>
                </div>
              )}
              {locError && <div className="loc-error" role="alert">{locError}</div>}
            </div>
          </div>
          <span className="mode-control">
            Mode:
            <select
              aria-label="Display mode"
              value={mode}
              onChange={(e) => {
                const v = e.target.value
                if (MODES.includes(v)) setMode(v)
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

      <main className="dashboard tight-layout">
        {/* Primary Decision Panel: Phase B transformation — prominent, above modules */}
        <PrimaryDecisionPanel locationQuery={locationQuery} />

        {/* Section: Targets + Conditions (2-column) */}
        <section className="section section-top">
          <div className="section-grid two-col">
            <div className="module conditions-module panel">
              <Conditions locationQuery={locationQuery} />
            </div>
            <div className="module targets-module panel">
              <RecommendedTargets locationQuery={locationQuery} />
            </div>
          </div>
        </section>

        {/* Section: Alerts + Passes (2-column) */}
        <section className="section section-middle">
          <div className="section-grid two-col">
            <div className="module alerts-module panel">
              <AlertsEvents locationQuery={locationQuery} />
            </div>
            <div className="module passes-module panel">
              <SatellitePasses locationQuery={locationQuery} />
            </div>
          </div>
        </section>

        {/* Section: Moon summary (full width) */}
        <section className="section section-bottom">
          <div className="module moon-module panel small-panel">
            <MoonSummary locationQuery={locationQuery} />
          </div>
        </section>
      </main>

      <footer className="app-footer">Astronomy Hub — Observing Tools</footer>
    </div>
  )
}
