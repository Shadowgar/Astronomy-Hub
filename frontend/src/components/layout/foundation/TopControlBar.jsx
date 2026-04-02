import React from 'react'
import { topBar } from './foundationData'

export default function TopControlBar() {
  return (
    <>
      <header className="app-header app-header-utility foundation-header-row" role="banner">
        <div className="foundation-header-main">
          <h1>Astronomy Hub</h1>
          <span className="foundation-header-user">User / Settings</span>
        </div>
        <div className="header-controls" aria-label="Top control bar">
          <span className="mode-control">
            Scope:
            <select aria-label="Scope selector (placeholder)" defaultValue="above_me">
              <option value="above_me">{topBar.scope}</option>
            </select>
          </span>
          <span className="mode-control">
            Engine:
            <select aria-label="Engine selector (placeholder)" defaultValue="conditions">
              <option value="conditions">{topBar.engine}</option>
            </select>
          </span>
          <span className="mode-control">
            Time:
            <select aria-label="Time selector (placeholder)" defaultValue="now">
              <option value="now">{topBar.time}</option>
            </select>
          </span>
          <span className="mode-control">Location: {topBar.location}</span>
        </div>
      </header>

      <section className="panel foundation-command-bar" aria-label="Command bar placeholder">
        <h2>Command Bar</h2>
        <div className="foundation-command-bar-actions">
          {topBar.commands.map((command) => (
            <button key={command} type="button">
              {command}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
