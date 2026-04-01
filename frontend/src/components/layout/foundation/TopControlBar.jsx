import React from 'react'

export default function TopControlBar() {
  return (
    <header className="app-header app-header-utility" role="banner">
      <h1>Astronomy Hub</h1>
      <div className="header-controls" aria-label="Top control bar">
        <span className="mode-control">
          Scope:
          <select aria-label="Scope selector (placeholder)" defaultValue="above_me" disabled>
            <option value="above_me">Above Me</option>
          </select>
        </span>
        <span className="mode-control">
          Engine:
          <select aria-label="Engine selector (placeholder)" defaultValue="conditions" disabled>
            <option value="conditions">Conditions</option>
          </select>
        </span>
        <span className="mode-control">
          Filter:
          <select aria-label="Filter selector (placeholder)" defaultValue="visible_now" disabled>
            <option value="visible_now">visible_now</option>
          </select>
        </span>
        <span className="mode-control">Location: ORAS Observatory (placeholder)</span>
        <span className="mode-control">
          Mode:
          <select aria-label="Display mode (placeholder)" defaultValue="light" disabled>
            <option value="light">light</option>
          </select>
        </span>
      </div>
      <div className="header-controls" aria-label="Command bar placeholder">
        <strong>Command Bar</strong>
        <button type="button" disabled>
          What&apos;s above me now?
        </button>
        <button type="button" disabled>
          Show satellites
        </button>
        <button type="button" disabled>
          Show planets
        </button>
        <button type="button" disabled>
          Earth events
        </button>
        <button type="button" disabled>
          Solar
        </button>
      </div>
    </header>
  )
}
