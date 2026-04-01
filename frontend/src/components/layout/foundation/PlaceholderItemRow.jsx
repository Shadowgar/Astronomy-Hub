import React from 'react'

export default function PlaceholderItemRow({ text, marker = 'Static' }) {
  return (
    <li className="foundation-row">
      <span>{text}</span>
      <span className="foundation-row-marker">{marker}</span>
    </li>
  )
}
