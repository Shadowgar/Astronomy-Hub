/* eslint-disable react/prop-types */
import React from 'react'
import InlineExpansion from './common/InlineExpansion'
import TargetDetail from './TargetDetail'

function expandDirection(dir) {
  if (!dir) return ''
  const map = {
    N: 'North',
    NE: 'Northeast',
    E: 'East',
    SE: 'Southeast',
    S: 'South',
    SW: 'Southwest',
    W: 'West',
    NW: 'Northwest',
  }
  return map[dir.toUpperCase()] || dir
}

export default function TargetRow({ target }) {
  const summary = (
    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
      <strong style={{fontSize: 15, display: 'block'}}>{target.name}</strong>
      <div style={{fontSize: 13, color: 'var(--text-muted)'}}>{target.category} · {expandDirection(target.direction)}</div>
    </div>
  )

  return (
    <li style={{listStyle: 'none', margin: '0'}}>
      <div style={{border: '1px solid var(--surface-border)', borderRadius: 8, padding: 8, marginBottom: 10, background: 'var(--surface-bg)'}}>
        <InlineExpansion summary={summary} defaultCollapsed={true}>
          <TargetDetail target={target} />
        </InlineExpansion>
      </div>
    </li>
  )
}
