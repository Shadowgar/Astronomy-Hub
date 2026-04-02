import React from 'react'
import PanelSection from './PanelSection'
import PlaceholderItemRow from './PlaceholderItemRow'
import { liveBriefingActions, liveBriefingItems } from './foundationData'

export default function ContextPanel() {
  return (
    <aside className="module panel" aria-label="Right context panel">
      <h2>Right-Side Live Briefing</h2>
      <PanelSection title="Tonight / Now Summary" badge={null}>
        <ul className="foundation-list">
          {liveBriefingItems.map((item) => (
            <PlaceholderItemRow key={item.name} name={item.name} reason={item.reason} />
          ))}
        </ul>
      </PanelSection>
      <div className="foundation-context-actions">
        {liveBriefingActions.map((action) => (
          <button key={action} type="button">
            {action}
          </button>
        ))}
      </div>
    </aside>
  )
}
