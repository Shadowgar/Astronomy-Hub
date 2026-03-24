import React, { useState, useEffect } from 'react'
import Conditions from './components/Conditions'
import RecommendedTargets from './components/RecommendedTargets'
import AlertsEvents from './components/AlertsEvents'
import SatellitePasses from './components/SatellitePasses'
import MoonSummary from './components/MoonSummary'
// PrimaryDecisionPanel moved to ObservingHero; LocationSelector used inside TopBar
import useLocationState from './state/locationState'
import Starfield from './components/Starfield'
import AppShell from "./components/layout/AppShell"
import TopBar from "./components/layout/TopBar"
import ContentGrid from "./components/layout/ContentGrid"
import ObservingHero from "./components/hero/ObservingHero"

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
    <AppShell>
      <div className={`app-shell mode-${mode.toLowerCase()}`}>
        <Starfield />
        <TopBar
          activeLocation={activeLocation}
          ORAS={ORAS}
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
        <ObservingHero />
        

        <ContentGrid>
          <main className="dashboard tight-layout">
        {/* Primary Decision Panel removed in Phase B: ObservingHero replaces PDP */}

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
        </ContentGrid>

        <footer className="app-footer">Astronomy Hub — Observing Tools</footer>
      </div>
    </AppShell>
  )
}
