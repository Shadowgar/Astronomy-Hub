import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'
import PanelSection from './PanelSection'
import { sceneItems } from './foundationData'

export default function ScenePanel() {
  return (
    <section className="module scene-module panel">
      <h2>Main Scene Area</h2>
      <PanelSection title="Scene Snapshot">
        <div className="foundation-scene-body">
          <ul className="foundation-list">
            {sceneItems.map((item) => (
              <PlaceholderItemRow key={item.name} name={item.name} reason={item.reason} />
            ))}
          </ul>
        </div>
      </PanelSection>
      <div className="above-me-scene__sky" role="img" aria-label="Main scene placeholder" />
    </section>
  )
}
