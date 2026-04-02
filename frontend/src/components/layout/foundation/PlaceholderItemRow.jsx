import React from 'react'

export default function PlaceholderItemRow({ name, reason, marker = null, onClick = null, isSelected = false }) {
  const interactive = typeof onClick === 'function'
  const selectedClass = isSelected ? ' foundation-row-selected' : ''

  return (
    <li className={`foundation-row${interactive ? ' foundation-row-interactive' : ''}${selectedClass}`}>
      {interactive ? (
        <button
          type="button"
          className="foundation-row-button"
          onClick={onClick}
          aria-label={`Open details for ${name}`}
        >
          <div className="foundation-row-main">
            <span className="foundation-row-name">{name}</span>
            {reason ? <span className="foundation-row-reason">{reason}</span> : null}
          </div>
          {marker ? <span className="foundation-row-marker">{marker}</span> : null}
        </button>
      ) : (
        <>
          <div className="foundation-row-main">
            <span className="foundation-row-name">{name}</span>
            {reason ? <span className="foundation-row-reason">{reason}</span> : null}
          </div>
          {marker ? <span className="foundation-row-marker">{marker}</span> : null}
        </>
      )}
    </li>
  )
}
