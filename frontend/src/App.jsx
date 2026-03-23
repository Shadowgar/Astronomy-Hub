import React from 'react'
import Conditions from './components/Conditions'
import RecommendedTargets from './components/RecommendedTargets'
import AlertsEvents from './components/AlertsEvents'
import SatellitePasses from './components/SatellitePasses'
import MoonSummary from './components/MoonSummary'

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Astronomy Hub</h1>
        <div className="header-controls">Location: Oil City, PA · Mode: Day</div>
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
