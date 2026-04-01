import React from 'react'
import DetailPanelShell from './DetailPanelShell'
import NowAboveMePanel from './NowAboveMePanel'

export default function ContextPanel() {
  return (
    <aside className="module panel" aria-label="Right context panel">
      <h2>Right Context Panel</h2>
      <NowAboveMePanel />
      <DetailPanelShell />
    </aside>
  )
}
