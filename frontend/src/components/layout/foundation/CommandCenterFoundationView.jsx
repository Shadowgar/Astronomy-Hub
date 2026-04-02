import React from 'react'
import ContentGrid from '../ContentGrid'
import ContextPanel from './ContextPanel'
import DetailPanelShell from './DetailPanelShell'
import EngineModuleCard from './EngineModuleCard'
import NowAboveMePanel from './NowAboveMePanel'
import ScenePanel from './ScenePanel'
import TopControlBar from './TopControlBar'
import {
  activeFiltersItems,
  engineQuickEntryItems,
  eventsAlertsItems,
  newsDigestItems,
  quickToolsItems,
} from './foundationData'

export default function CommandCenterFoundationView() {
  return (
    <>
      <TopControlBar />

      <ContentGrid className="app-main-flow">
        <main className="dashboard tight-layout command-center-foundation">
          <section className="section section-scene">
            <div className="section-grid two-col command-center-foundation__hero-row">
              <ScenePanel />
              <ContextPanel />
            </div>
          </section>

          <section className="section">
            <div className="section-grid three-col command-center-foundation__triple-row">
              <div className="module panel">
                <NowAboveMePanel />
              </div>
              <EngineModuleCard title="Events / Alerts" items={eventsAlertsItems} footerAction="See all events" />
              <EngineModuleCard title="News Digest" items={newsDigestItems} footerAction="See all news" />
            </div>
          </section>

          <section className="section">
            <div className="section-grid three-col command-center-foundation__triple-row">
              <EngineModuleCard title="Engine Quick Entry" items={engineQuickEntryItems} />
              <EngineModuleCard title="Active Filters" items={activeFiltersItems} />
              <EngineModuleCard title="Quick Tools" items={quickToolsItems} />
            </div>
          </section>

          <section className="section section-detail-panel">
            <div className="foundation-detail-panel-shell">
              <DetailPanelShell />
            </div>
          </section>
        </main>
      </ContentGrid>

      <footer className="app-footer">ORAS Astronomy Hub (c) 2026</footer>
    </>
  )
}
