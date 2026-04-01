import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'
import { detailPanel } from './foundationData'

export default function DetailPanelShell() {
  return (
    <section className="module-shell detail-panel-shell">
      <div className="module-shell-header detail-panel-shell__header">
        <div className="detail-panel-shell__identity">
          <h3>Detail Panel</h3>
          <p className="detail-panel-shell__object-name">Object: {detailPanel.objectName}</p>
          <p className="detail-panel-shell__object-meta">{detailPanel.objectMeta}</p>
        </div>
        <button type="button" className="detail-panel-shell__back" disabled>
          Back
        </button>
      </div>

      <div className="module-shell-body detail-panel-shell__body">
        <section className="detail-panel-shell__why">
          <h4>Why it matters</h4>
          <p>{detailPanel.whyItMatters}</p>
        </section>

        <nav className="detail-panel-shell__tabs" aria-label="Detail sections placeholder">
          {detailPanel.sections.map((section) => (
            <span key={section.name} className="detail-panel-shell__tab">
              {section.name}
            </span>
          ))}
        </nav>

        <div className="detail-panel-shell__sections">
          {detailPanel.sections.map((section) => (
            <section key={section.name} className="detail-panel-shell__section">
              <h4>{section.name}</h4>
              <ul className="foundation-list">
                {section.items.map((item) => (
                  <PlaceholderItemRow key={`${section.name}-${item.name}`} name={item.name} reason={item.reason} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
