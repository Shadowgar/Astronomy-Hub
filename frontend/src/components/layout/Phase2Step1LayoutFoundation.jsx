import React from 'react'
import ContentGrid from './ContentGrid'

const ENGINE_MODULES = [
  {
    name: 'Conditions',
    rows: ['Sky quality summary placeholder', 'Seeing/transparency placeholder'],
  },
  {
    name: 'Satellites',
    rows: ['Visible pass window placeholder', 'Tracking candidate placeholder'],
  },
  {
    name: 'Solar System',
    rows: ['Top planet visibility placeholder', 'Moon/planet context placeholder'],
  },
  {
    name: 'Deep Sky',
    rows: ['Target shortlist placeholder', 'Magnitude window placeholder'],
  },
  {
    name: 'Sun',
    rows: ['Solar activity placeholder', 'Daylight constraint placeholder'],
  },
  {
    name: 'Flights',
    rows: ['Overflight candidate placeholder', 'Altitude track placeholder'],
  },
  {
    name: 'Events',
    rows: ['Transient event placeholder', 'Priority timing placeholder'],
  },
]

const DETAIL_SECTIONS = [
  {
    name: 'Overview',
    rows: ['Summary placeholder', 'Observing note placeholder'],
  },
  {
    name: 'Sky Position',
    rows: ['Azimuth placeholder', 'Elevation placeholder'],
  },
  {
    name: 'Images',
    rows: ['Primary image placeholder', 'Secondary image placeholder'],
  },
  {
    name: 'Data',
    rows: ['Contract fields placeholder', 'Trace metadata placeholder'],
  },
]

function FoundationRows({ rows }) {
  return (
    <ul className="phase2-foundation-list">
      {rows.map((row) => (
        <li key={row} className="phase2-foundation-row">
          <span>{row}</span>
          <span className="phase2-foundation-row-marker">Static</span>
        </li>
      ))}
    </ul>
  )
}

function FoundationModule({ title, rows }) {
  return (
    <article className="module panel phase2-foundation-module">
      <section className="module-shell">
        <div className="module-shell-header">
          <h3>{title}</h3>
          <span className="phase2-foundation-badge">Placeholder</span>
        </div>
        <div className="module-shell-body">
          <FoundationRows rows={rows} />
        </div>
      </section>
    </article>
  )
}

function DetailPanelShell() {
  return (
    <section className="module-shell phase2-detail-panel">
      <div className="module-shell-header phase2-detail-panel__header">
        <div className="phase2-detail-panel__identity">
          <h3>Detail Panel</h3>
          <p className="phase2-detail-panel__object-name">Object: Placeholder Target</p>
          <p className="phase2-detail-panel__object-meta">Type: Placeholder Type · Status: Placeholder Status</p>
        </div>
        <button type="button" className="phase2-detail-panel__back" disabled>
          Back
        </button>
      </div>

      <div className="module-shell-body phase2-detail-panel__body">
        <section className="phase2-detail-panel__why">
          <h4>Why it matters</h4>
          <p>Static explanation placeholder for decision relevance near top of detail context.</p>
        </section>

        <nav className="phase2-detail-panel__tabs" aria-label="Detail sections placeholder">
          {DETAIL_SECTIONS.map((section) => (
            <span key={section.name} className="phase2-detail-panel__tab">
              {section.name}
            </span>
          ))}
        </nav>

        <div className="phase2-detail-panel__sections">
          {DETAIL_SECTIONS.map((section) => (
            <section key={section.name} className="phase2-detail-panel__section">
              <h4>{section.name}</h4>
              <FoundationRows rows={section.rows} />
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Phase2Step1LayoutFoundation() {
  return (
    <>
      <header className="app-header app-header-utility" role="banner">
        <h1>Astronomy Hub</h1>
        <div className="header-controls" aria-label="Top control bar">
          <span className="mode-control">
            Scope:
            <select aria-label="Scope selector (placeholder)" defaultValue="above_me" disabled>
              <option value="above_me">Above Me</option>
            </select>
          </span>
          <span className="mode-control">
            Engine:
            <select aria-label="Engine selector (placeholder)" defaultValue="conditions" disabled>
              <option value="conditions">Conditions</option>
            </select>
          </span>
          <span className="mode-control">
            Filter:
            <select aria-label="Filter selector (placeholder)" defaultValue="visible_now" disabled>
              <option value="visible_now">visible_now</option>
            </select>
          </span>
          <span className="mode-control">Location: ORAS Observatory (placeholder)</span>
          <span className="mode-control">
            Mode:
            <select aria-label="Display mode (placeholder)" defaultValue="light" disabled>
              <option value="light">light</option>
            </select>
          </span>
        </div>
      </header>

      <ContentGrid className="app-main-flow">
        <main className="dashboard tight-layout phase2-step1-foundation">
          <section className="section section-scene">
            <div className="section-grid two-col">
              <div className="module scene-module panel">
                <h2>Main Scene Area</h2>
                <div className="phase2-foundation-scene-body">
                  <p>Static scene foundation placeholder.</p>
                  <FoundationRows
                    rows={['Scene frame placeholder', 'Object layer placeholder', 'Visibility cues placeholder']}
                  />
                </div>
                <div className="above-me-scene__sky" role="img" aria-label="Main scene placeholder" />
              </div>

              <aside className="module panel" aria-label="Right context panel">
                <h2>Right Context Panel</h2>
                <section className="module-shell">
                  <div className="module-shell-header">
                    <h3>Now Above Me</h3>
                    <span className="phase2-foundation-badge">Placeholder</span>
                  </div>
                  <div className="module-shell-body">
                    <FoundationRows rows={['Immediate sky summary placeholder', 'Current attention cue placeholder']} />
                  </div>
                </section>

                <DetailPanelShell />
              </aside>
            </div>
          </section>

          <section className="section">
            <div className="section-grid one-col">
              <div className="module panel">
                <h2>Engine Module Grid</h2>
                <div className="phase2-foundation-grid">
                  {ENGINE_MODULES.map((moduleItem) => (
                    <FoundationModule key={moduleItem.name} title={moduleItem.name} rows={moduleItem.rows} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </ContentGrid>

      <footer className="app-footer">Astronomy Hub — Command Center Layout Foundation</footer>
    </>
  )
}
