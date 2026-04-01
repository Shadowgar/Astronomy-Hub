import React from 'react'

export default function PanelSection({ title, badge = 'Placeholder', children }) {
  return (
    <section className="module-shell">
      <div className="module-shell-header">
        <h3>{title}</h3>
        <span className="foundation-badge">{badge}</span>
      </div>
      <div className="module-shell-body">{children}</div>
    </section>
  )
}
