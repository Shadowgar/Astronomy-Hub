import React from 'react'
import PanelSection from './PanelSection'
import PlaceholderItemRow from './PlaceholderItemRow'
import { rightContextSections } from './foundationData'

export default function ContextPanel() {
  return (
    <aside className="module panel" aria-label="Right context panel">
      <h2>Right Context Panel</h2>
      {rightContextSections.map((section) => (
        <PanelSection key={section.title} title={section.title}>
          <ul className="foundation-list">
            {section.items.map((item) => (
              <PlaceholderItemRow key={`${section.title}-${item.name}`} name={item.name} reason={item.reason} />
            ))}
          </ul>
        </PanelSection>
      ))}
    </aside>
  )
}
