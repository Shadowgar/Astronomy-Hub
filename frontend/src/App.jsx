import React, { useState } from 'react'
import Conditions from './components/Conditions'
import PrimaryDecisionPanel from './components/PrimaryDecisionPanel'
import RecommendedTargets from './components/RecommendedTargets'
import AboveMeScene from './components/AboveMeScene'
import AlertsEvents from './components/AlertsEvents'
import SatellitePasses from './components/SatellitePasses'
import MoonSummary from './components/MoonSummary.jsx'
import SkyNews from './components/SkyNews'
import useLocationState from './state/locationState'
import useDisplayModeState from './state/displayModeState'
import AppShell from "./components/layout/AppShell"
import ContentGrid from "./components/layout/ContentGrid"
import CommandCenterHeader from './components/layout/CommandCenterHeader'
import Phase2Step1LayoutFoundation from './components/layout/Phase2Step1LayoutFoundation'

export default function App() {
  const showPhase2Step1Layout =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('phase2Step1Layout') === '1'

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
        {showPhase2Step1Layout ? (
          <Phase2Step1LayoutFoundation />
        ) : (
          <>
            <CommandCenterHeader
              isOrasLocation={isOrasLocation}
              ORAS={ORAS}
              activeLocation={activeLocation}
              latInput={latInput}
              setLatInput={setLatInput}
              lonInput={lonInput}
              setLonInput={setLonInput}
              elevInput={elevInput}
              setElevInput={setElevInput}
              setActiveLocation={setActiveLocation}
              pendingLocation={pendingLocation}
              setPending={setPending}
              confirmPending={confirmPending}
              clearPending={clearPending}
              locError={locError}
              setLocError={setLocError}
              mode={mode}
              setMode={setMode}
              MODES={MODES}
            />

            <ContentGrid className="app-main-flow">
              <main className="dashboard tight-layout">
            {/* Primary command surface: scene-first hierarchy */}
            <section className="section section-scene">
              <div className="section-grid one-col">
                <div className="module scene-module panel">
                  <AboveMeScene locationQuery={locationQuery} />
                </div>
              </div>
            </section>

            {/* Supporting decision intelligence after the primary scene */}
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
          </>
        )}
      </div>
    </AppShell>
  )
}
