import React, { useState } from 'react'
import './InlineExpansion.css'

export default function InlineExpansion({summary, children, defaultCollapsed = true, className = ''}){
  const [open, setOpen] = useState(!defaultCollapsed)

  const toggle = () => setOpen(v => !v)

  return (
    <div className={`inline-expansion ${open ? 'inline-expansion--open' : ''} ${className}`.trim()}>
      <button
        className="inline-expansion__toggle"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="inline-expansion__summary">{summary}</span>
        <span className="inline-expansion__chev" aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      <div
        className="inline-expansion__content"
        role="region"
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  )
}
