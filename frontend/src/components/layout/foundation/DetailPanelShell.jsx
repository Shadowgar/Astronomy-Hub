import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'

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

export default function DetailPanelShell() {
  return (
    <section className="module-shell detail-panel-shell">
      <div className="module-shell-header detail-panel-shell__header">
        <div className="detail-panel-shell__identity">
          <h3>Detail Panel</h3>
          <p className="detail-panel-shell__object-name">Object: Placeholder Target</p>
          <p className="detail-panel-shell__object-meta">Type: Placeholder Type · Status: Placeholder Status</p>
        </div>
        <button type="button" className="detail-panel-shell__back" disabled>
          Back
        </button>
      </div>

      <div className="module-shell-body detail-panel-shell__body">
        <section className="detail-panel-shell__why">
          <h4>Why it matters</h4>
          <p>Static explanation placeholder for decision relevance near top of detail context.</p>
        </section>

        <nav className="detail-panel-shell__tabs" aria-label="Detail sections placeholder">
          {DETAIL_SECTIONS.map((section) => (
            <span key={section.name} className="detail-panel-shell__tab">
              {section.name}
            </span>
          ))}
        </nav>

        <div className="detail-panel-shell__sections">
          {DETAIL_SECTIONS.map((section) => (
            <section key={section.name} className="detail-panel-shell__section">
              <h4>{section.name}</h4>
              <ul className="foundation-list">
                {section.rows.map((row) => (
                  <PlaceholderItemRow key={`${section.name}-${row}`} text={row} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
