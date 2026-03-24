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
    <div className="target-summary">
      <strong>{target.name}</strong>
      <div className="small">
        {target.category} · {expandDirection(target.direction)}
      </div>
    </div>
  )

  return (
    <li className="target-item">
      <InlineExpansion summary={summary} defaultCollapsed={true}>
        <TargetDetail target={target} />
      </InlineExpansion>
    </li>
  )
}
