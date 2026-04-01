import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'

export default function EngineModuleCard({ title, rows }) {
  return (
    <article className="module panel foundation-module-card">
      <section className="module-shell">
        <div className="module-shell-header">
          <h3>{title}</h3>
          <span className="foundation-badge">Placeholder</span>
        </div>
        <div className="module-shell-body">
          <ul className="foundation-list">
            {rows.map((row) => (
              <PlaceholderItemRow key={`${title}-${row}`} text={row} />
            ))}
          </ul>
        </div>
      </section>
    </article>
  )
}
