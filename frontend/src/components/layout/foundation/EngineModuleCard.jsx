import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'
import PanelSection from './PanelSection'

export default function EngineModuleCard({ title, items, marker = null, footerAction = null }) {
  return (
    <article className="module panel foundation-module-card">
      <PanelSection title={title}>
        <ul className="foundation-list">
          {items.map((item, index) => (
            <PlaceholderItemRow
              key={`${title}-${item.id || item.name}-${index}`}
              name={item.name}
              reason={item.reason}
              marker={item.marker || marker || null}
              onClick={item.onClick || null}
            />
          ))}
        </ul>
        {footerAction ? (
          <button type="button" className="foundation-panel-link">
            {footerAction}
          </button>
        ) : null}
      </PanelSection>
    </article>
  )
}
