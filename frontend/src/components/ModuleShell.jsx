import React from 'react'
import logger from '../lib/logger'

export default function ModuleShell({ title, stale, onRetry, children }) {
  const handleRetry = () => {
    // Emit dev-log entry and call onRetry if provided
    try {
      logger.info('module', 'retry', { module: title })
    } catch (e) {
      // ignore logger issues
    }
    if (typeof onRetry === 'function') onRetry()
  }

  return (
    <div className="module-shell component panel compact-module">
      <div className="module-shell-header">
        <h2>{title}</h2>
        <div className="module-shell-controls">
          {stale ? <span className="stale-badge">stale</span> : null}
          <button className="module-retry" onClick={handleRetry} aria-label={`Retry ${title}`}>
            Retry
          </button>
        </div>
      </div>
      <div className="module-shell-body">{children}</div>
    </div>
  )
}
