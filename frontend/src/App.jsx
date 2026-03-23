import React, { useState } from 'react'
import Conditions from './components/Conditions'
import RecommendedTargets from './components/RecommendedTargets'
import AlertsEvents from './components/AlertsEvents'
import SatellitePasses from './components/SatellitePasses'
import MoonSummary from './components/MoonSummary'

const MODES = ['Day', 'Night', 'Red']

export default function App() {
  const [mode, setMode] = useState('Day')

  return (
    <div className={`app-shell mode-${mode.toLowerCase()}`}>
      <header className="app-header">
        <h1>Astronomy Hub</h1>
        <div className="header-controls">
          <span className="location-label">Location: Oil City, PA</span>
          <span className="mode-control">
            Mode:
            <select
              aria-label="Display mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
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

      <main className="dashboard">
        {/* Module order locked by UI Information Architecture */}
        <section className="module conditions-module">
          <Conditions />
        </section>

        <section className="module targets-module">
          <RecommendedTargets />
        </section>

        <section className="module alerts-module">
          <AlertsEvents />
        </section>

        <section className="module passes-module">
          <SatellitePasses />
        </section>

        <aside className="module moon-module">
          <MoonSummary />
        </aside>
      </main>

      <footer className="app-footer">Astronomy Hub — Phase 1 (Dashboard Shell)</footer>
    </div>
  )
}
