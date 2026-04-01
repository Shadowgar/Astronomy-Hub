import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'

const ROWS = ['Immediate sky summary placeholder', 'Current attention cue placeholder']

export default function NowAboveMePanel() {
  return (
    <section className="module-shell">
      <div className="module-shell-header">
        <h3>Now Above Me</h3>
        <span className="foundation-badge">Placeholder</span>
      </div>
      <div className="module-shell-body">
        <ul className="foundation-list">
          {ROWS.map((row) => (
            <PlaceholderItemRow key={row} text={row} />
          ))}
        </ul>
      </div>
    </section>
  )
}
