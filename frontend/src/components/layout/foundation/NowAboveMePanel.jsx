import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'
import PanelSection from './PanelSection'
import { nowAboveMeItems } from './foundationData'

export default function NowAboveMePanel() {
  return (
    <PanelSection title="Now Above Me">
      <div className="foundation-now-above-me">
        <ul className="foundation-list">
          {nowAboveMeItems.map((item, index) => (
            <PlaceholderItemRow
              key={item.name}
              name={`${index + 1}. ${item.name}`}
              reason={item.reason}
              marker="Ranked"
            />
          ))}
        </ul>
      </div>
    </PanelSection>
  )
}
