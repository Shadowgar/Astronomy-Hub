import React, { useState } from 'react'
import Conditions from './components/Conditions'
import PrimaryDecisionPanel from './components/PrimaryDecisionPanel'
import RecommendedTargets from './components/RecommendedTargets'
import AboveMeScene from './components/AboveMeScene'
import AlertsEvents from './components/AlertsEvents'
import SatellitePasses from './components/SatellitePasses'
import MoonSummary from './components/MoonSummary'
import SkyNews from './components/SkyNews'
import LocationSelector from './components/LocationSelector/LocationSelector'
// LocationSelector is mounted inside the top controls.
import useLocationState from './state/locationState'
import useDisplayModeState from './state/displayModeState'
import Starfield from './components/Starfield'
import AppShell from "./components/layout/AppShell"
import ContentGrid from "./components/layout/ContentGrid"
import AppButton from './components/ui/AppButton'
import CommandBar from './components/ui/CommandBar'

export default function App() {
  const { mode, setMode, MODES } = useDisplayModeState()

  

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
  const isOrasLocation = (() => {
    if (!activeLocation) return false
    const aLat = Number(activeLocation.latitude)
    const aLon = Number(activeLocation.longitude)
    const aElev = activeLocation.elevation_ft === undefined || activeLocation.elevation_ft === null ? null : Number(activeLocation.elevation_ft)
    const oLat = Number(ORAS.latitude)
    const oLon = Number(ORAS.longitude)
    const oElev = ORAS.elevation_ft === undefined || ORAS.elevation_ft === null ? null : Number(ORAS.elevation_ft)
    return aLat === oLat && aLon === oLon && aElev === oElev
  })()

  if (!isOrasLocation) {
    const lat = encodeURIComponent(activeLocation.latitude)
    const lon = encodeURIComponent(activeLocation.longitude)
    locationQuery = `?lat=${lat}&lon=${lon}`
    if (activeLocation.elevation_ft !== undefined && activeLocation.elevation_ft !== null) {
      locationQuery += `&elevation_ft=${encodeURIComponent(activeLocation.elevation_ft)}`
    }
  }

  return (
    <AppShell>
      <div className="app-shell">
        <Starfield />
        <header className="app-header app-header-utility" role="banner">
        <h1>Astronomy Hub</h1>
        <nav aria-label="Primary" className="progress-nav">
          <a
            href="/progress"
            className="progress-link"
          >
            Progress
          </a>
        </nav>
        <div className="header-controls">
          <div className="location-section">
            <span className="location-label">Location: {isOrasLocation ? ORAS.label : `Custom Location (${activeLocation.latitude.toFixed(5)}, ${activeLocation.longitude.toFixed(5)})`}</span>

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
              <CommandBar className="location-actions">
                <AppButton
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
                >
                  Apply for session
                </AppButton>
                <AppButton
                  variant="secondary"
                  onClick={() => {
                    setLocError('')
                    setActiveLocation(ORAS)
                    setLatInput('')
                    setLonInput('')
                    setElevInput('')
                  }}
                >
                  Reset to ORAS
                </AppButton>
              </CommandBar>
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
                  <CommandBar>
                    <AppButton
                      onClick={() => {
                        confirmPending()
                        if (new URLSearchParams(window.location.search).get('devlog') === '1') {
                          try { console.log(JSON.stringify({ event: 'pending_confirm', confirmed: pendingLocation })) } catch (e) {}
                        }
                      }}
                    >
                      Confirm pending
                    </AppButton>
                    <AppButton variant="secondary" onClick={() => clearPending()} className="clear-pending">
                      Clear pending
                    </AppButton>
                  </CommandBar>
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
        

        <ContentGrid className="app-main-flow">
          <main className="dashboard tight-layout">
        <section className="section section-primary">
          <div className="section-grid one-col">
            <div className="module panel primary-decision-module">
              <PrimaryDecisionPanel locationQuery={locationQuery} />
            </div>
          </div>
        </section>

        {/* Guided step: recommended action target */}
        <section className="section section-top">
          <div className="section-grid one-col">
            <div className="module targets-module panel" id="recommended-targets-panel">
              <RecommendedTargets locationQuery={locationQuery} />
            </div>
          </div>
        </section>

        {/* Guided step: object/sky context for selected target */}
        <section className="section section-scene">
          <div className="section-grid one-col">
            <div className="module scene-module panel">
              <AboveMeScene locationQuery={locationQuery} />
            </div>
          </div>
        </section>

        <section className="section section-supporting-context-intro" aria-label="Supporting context">
          <div className="section-grid one-col">
            <p>Supporting Context</p>
          </div>
        </section>

        {/* Supporting context: immediate sky conditions */}
        <section className="section section-supporting-top">
          <div className="section-grid two-col">
            <div className="module conditions-module panel">
              <Conditions locationQuery={locationQuery} />
            </div>
            <div className="module moon-module panel small-panel">
              <MoonSummary locationQuery={locationQuery} />
            </div>
          </div>
        </section>

        {/* Supporting context: timing and alerts */}
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

        {/* Supporting context: additional news */}
        <section className="section section-bottom">
          <div className="section-grid one-col">
            <div className="module panel">
              <SkyNews locationQuery={locationQuery} />
            </div>
          </div>
        </section>
          </main>
        </ContentGrid>

        <footer className="app-footer">Astronomy Hub — Observing Tools</footer>
      </div>
    </AppShell>
  )
}
