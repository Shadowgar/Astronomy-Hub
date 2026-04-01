import React from 'react'
import ContentGrid from '../ContentGrid'
import ContextPanel from './ContextPanel'
import DetailPanelShell from './DetailPanelShell'
import EngineGrid from './EngineGrid'
import NowAboveMePanel from './NowAboveMePanel'
import ScenePanel from './ScenePanel'
import TopControlBar from './TopControlBar'

export default function CommandCenterFoundationView() {
  return (
    <>
      <TopControlBar />

      <ContentGrid className="app-main-flow">
        <main className="dashboard tight-layout command-center-foundation">
          <section className="section section-scene">
            <div className="section-grid two-col">
              <ScenePanel />
              <ContextPanel />
            </div>
          </section>

          <section className="section">
            <div className="section-grid one-col">
              <div className="module panel">
                <NowAboveMePanel />
              </div>
            </div>
          </section>

          <EngineGrid />

          <section className="section">
            <div className="section-grid one-col">
              <div className="module panel">
                <DetailPanelShell />
              </div>
            </div>
          </section>
        </main>
      </ContentGrid>

      <footer className="app-footer">Astronomy Hub — Command Center Layout Foundation</footer>
    </>
  )
}
