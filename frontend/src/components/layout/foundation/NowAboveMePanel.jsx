import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'
import PanelSection from './PanelSection'
import { nowAboveMeItems } from './foundationData'
import useGlobalUiState from '../../../state/globalUiState'

export default function NowAboveMePanel() {
  const { setSelectedObjectId } = useGlobalUiState()

  return (
    <PanelSection title="Now Above Me">
      <div className="foundation-now-above-me">
        <ul className="foundation-list">
          {nowAboveMeItems.map((item) => (
            <PlaceholderItemRow
              key={item.name}
              name={item.name}
              reason={item.reason}
              onClick={() => setSelectedObjectId(item.id || item.name.toLowerCase())}
            />
          ))}
        </ul>
        <button type="button" className="foundation-panel-link">
          See all visible objects
        </button>
      </div>
    </PanelSection>
  )
}
