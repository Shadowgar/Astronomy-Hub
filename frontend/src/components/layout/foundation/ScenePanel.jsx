import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'
import PanelSection from './PanelSection'
import { sceneItems } from './foundationData'
import useGlobalUiState from '../../../state/globalUiState'

export default function ScenePanel() {
  const { setSelectedObjectId } = useGlobalUiState()

  return (
    <section className="module scene-module panel">
      <h2>Primary Scene / Hero</h2>
      <PanelSection title="Scene Snapshot">
        <div className="foundation-scene-body">
          <ul className="foundation-list">
            {sceneItems.map((item) => (
              <PlaceholderItemRow
                key={item.name}
                name={item.name}
                reason={item.reason}
                onClick={() => setSelectedObjectId(item.id || item.name.toLowerCase())}
              />
            ))}
          </ul>
        </div>
      </PanelSection>
      <div className="above-me-scene__sky" role="img" aria-label="Main scene placeholder" />
      <div className="foundation-scene-notes">
        <p>Scene changes based on:</p>
        <ul>
          <li>scope</li>
          <li>active engine</li>
          <li>active filter</li>
        </ul>
      </div>
    </section>
  )
}
