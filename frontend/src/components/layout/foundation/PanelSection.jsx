import React from 'react'

export default function PanelSection({ title, badge = null, children }) {
  return (
    <section className="module-shell">
      <div className="module-shell-header">
        <h3>{title}</h3>
        {badge ? <span className="foundation-badge">{badge}</span> : null}
      </div>
      <div className="module-shell-body">{children}</div>
    </section>
  )
}
