import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'
import PanelSection from './PanelSection'

export default function EngineModuleCard({ title, items }) {
  return (
    <article className="module panel foundation-module-card">
      <PanelSection title={title}>
        <ul className="foundation-list">
          {items.map((item) => (
            <PlaceholderItemRow key={`${title}-${item.name}`} name={item.name} reason={item.reason} />
          ))}
        </ul>
      </PanelSection>
    </article>
  )
}
