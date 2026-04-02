import React, { useEffect, useMemo, useState } from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'
import { resolveDetailPanelProfile } from './foundationData'
import useGlobalUiState from '../../../state/globalUiState'

export default function DetailPanelShell() {
  const { selectedObjectId, setSelectedObjectId } = useGlobalUiState()
  const detailProfile = useMemo(
    () => resolveDetailPanelProfile(selectedObjectId),
    [selectedObjectId],
  )
  const [activeTabName, setActiveTabName] = useState('')

  useEffect(() => {
    if (!detailProfile) {
      setActiveTabName('')
      return
    }
    const firstSection = Array.isArray(detailProfile.sections) ? detailProfile.sections[0] : null
    setActiveTabName(firstSection?.name || '')
  }, [detailProfile])

  if (!detailProfile) {
    return (
      <section className="module-shell detail-panel-shell">
        <div className="module-shell-header detail-panel-shell__header">
          <div className="detail-panel-shell__identity">
            <h3>Detail Panel</h3>
            <p className="detail-panel-shell__object-meta">Select an object from the hub to inspect details.</p>
          </div>
          <button type="button" className="detail-panel-shell__back" disabled>
            Back
          </button>
        </div>
      </section>
    )
  }

  const sections = Array.isArray(detailProfile.sections) ? detailProfile.sections : []
  const activeSection = sections.find((section) => section.name === activeTabName) || sections[0] || null

  return (
    <section className="module-shell detail-panel-shell">
      <div className="module-shell-header detail-panel-shell__header">
        <div className="detail-panel-shell__identity">
          <h3>Detail Panel</h3>
          <p className="detail-panel-shell__object-name">Object: {detailProfile.objectName}</p>
          <p className="detail-panel-shell__object-meta">{detailProfile.objectMeta}</p>
        </div>
        <button
          type="button"
          className="detail-panel-shell__back"
          onClick={() => setSelectedObjectId(null)}
        >
          Back
        </button>
      </div>

      <div className="module-shell-body detail-panel-shell__body">
        <section className="detail-panel-shell__why">
          <h4>Why it matters</h4>
          <p>{detailProfile.whyItMatters}</p>
        </section>

        <nav className="detail-panel-shell__tabs" aria-label="Detail sections placeholder">
          {sections.map((section) => (
            <button
              key={section.name}
              type="button"
              className={`detail-panel-shell__tab${section.name === activeSection?.name ? ' detail-panel-shell__tab--active' : ''}`}
              onClick={() => setActiveTabName(section.name)}
            >
              {section.name}
            </button>
          ))}
        </nav>

        {activeSection ? (
          <div className="detail-panel-shell__sections">
            <section key={activeSection.name} className="detail-panel-shell__section">
              <h4>{activeSection.name}</h4>
              <ul className="foundation-list">
                {activeSection.items.map((item) => (
                  <PlaceholderItemRow key={`${activeSection.name}-${item.name}`} name={item.name} reason={item.reason} />
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>
    </section>
  )
}
