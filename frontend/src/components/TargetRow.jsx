/* eslint-disable react/prop-types */
import React from 'react'
import InlineExpansion from './common/InlineExpansion'
import TargetDetail from './TargetDetail'

export default function TargetRow({ target }) {
  const summary = (
    <div className="target-summary">
      <strong>{target.name}</strong>
      <div className="small">
        <span>category: {target.category}</span> · <span>direction: {target.direction}</span>
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
