import React from 'react'
import ContentGrid from '../ContentGrid'
import ContextPanel from './ContextPanel'
import EngineGrid from './EngineGrid'
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

          <EngineGrid />
        </main>
      </ContentGrid>

      <footer className="app-footer">Astronomy Hub — Command Center Layout Foundation</footer>
    </>
  )
}
