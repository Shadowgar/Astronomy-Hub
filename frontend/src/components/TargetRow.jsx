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
    <div className="target-row__meta">
      <strong className="target-row__title">{target.name}</strong>
      <div className="target-row__subtitle">{target.category} · {expandDirection(target.direction)}</div>
    </div>
  )

  return (
    <li className="target-row">
      <div className="target-row__container">
        <div className="target-row__left" aria-hidden>
          <div className="target-row__icon">
            {target.imageUrl ? (
              <img
                src={target.imageUrl}
                alt={`${target.name} thumbnail`}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
                style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
              />
            ) : (
              <div />
            )}
          </div>
        </div>

        <div className="target-row__content">
          <InlineExpansion summary={summary} defaultCollapsed={true}>
            <TargetDetail target={target} />
          </InlineExpansion>
        </div>

        <div className="target-row__chev" aria-hidden>›</div>
      </div>
    </li>
  )
}
