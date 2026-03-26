import React from 'react'
import changelog from '../content/publicChangelog.json'

export default function Progress() {
  return (
    <div className="progress-page" style={{padding: '24px'}}>
      <h1>Development Progress</h1>
      <p>This page is under incremental construction. Source: <code>publicChangelog.json</code></p>
      <pre style={{whiteSpace: 'pre-wrap', maxWidth: '66ch'}}>{JSON.stringify(changelog, null, 2)}</pre>
    </div>
  )
}
