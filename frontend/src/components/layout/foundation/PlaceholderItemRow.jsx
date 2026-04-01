import React from 'react'

export default function PlaceholderItemRow({ name, reason, marker = 'Static' }) {
  return (
    <li className="foundation-row">
      <div className="foundation-row-main">
        <span className="foundation-row-name">{name}</span>
        {reason ? <span className="foundation-row-reason">{reason}</span> : null}
      </div>
      <span className="foundation-row-marker">{marker}</span>
    </li>
  )
}
