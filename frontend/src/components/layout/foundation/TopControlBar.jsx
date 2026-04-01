import React from 'react'
import { topBar } from './foundationData'

export default function TopControlBar() {
  return (
    <header className="app-header app-header-utility" role="banner">
      <h1>Astronomy Hub</h1>
      <div className="header-controls" aria-label="Top control bar">
        <span className="mode-control">
          Scope:
          <select aria-label="Scope selector (placeholder)" defaultValue="above_me" disabled>
            <option value="above_me">{topBar.scope}</option>
          </select>
        </span>
        <span className="mode-control">
          Engine:
          <select aria-label="Engine selector (placeholder)" defaultValue="conditions" disabled>
            <option value="conditions">{topBar.engine}</option>
          </select>
        </span>
        <span className="mode-control">
          Filter:
          <select aria-label="Filter selector (placeholder)" defaultValue="visible_now" disabled>
            <option value="visible_now">{topBar.filter}</option>
          </select>
        </span>
        <span className="mode-control">
          Time:
          <select aria-label="Time selector (placeholder)" defaultValue="now" disabled>
            <option value="now">{topBar.time}</option>
          </select>
        </span>
        <span className="mode-control">Location: {topBar.location}</span>
        <span className="mode-control">
          Mode:
          <select aria-label="Display mode (placeholder)" defaultValue="light" disabled>
            <option value="light">{topBar.mode}</option>
          </select>
        </span>
      </div>
      <div className="header-controls" aria-label="Command bar placeholder">
        <strong>Command Bar</strong>
        {topBar.commands.map((command) => (
          <button key={command} type="button" disabled>
            {command}
          </button>
        ))}
      </div>
    </header>
  )
}
