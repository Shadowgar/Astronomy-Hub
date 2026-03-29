import React from 'react'
import logger from '../lib/logger'
import AppButton from './ui/AppButton'

export default function ModuleShell({ title, stale, onRetry, children }) {
  const [retrying, setRetrying] = React.useState(false)

  const handleRetry = () => {
    // Emit dev-log entry and call onRetry if provided
    try {
      logger.info('module', 'retry', { module: title })
    } catch (e) {
      // ignore logger issues
    }
    if (typeof onRetry !== 'function') return
    const result = onRetry()
    if (result && typeof result.then === 'function') {
      setRetrying(true)
      Promise.resolve(result).finally(() => setRetrying(false))
    }
  }

  return (
    <div className="module-shell component panel compact-module">
      <div className="module-shell-header">
        <h2>{title}</h2>
        <div className="module-shell-controls">
          {stale ? <span className="stale-badge">stale</span> : null}
          <AppButton
            className="module-retry"
            variant="secondary"
            onClick={handleRetry}
            aria-label={`Retry ${title}`}
            loading={retrying}
          >
            Retry
          </AppButton>
        </div>
      </div>
      <div className="module-shell-body">{children}</div>
    </div>
  )
}
