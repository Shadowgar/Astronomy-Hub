import React from 'react'
import publicChangelog from '../content/publicChangelog.json'

export default function Progress() {
  // Minimal Step 2: surface the raw changelog JSON for verification
  if (typeof console !== 'undefined') console.log('publicChangelog:', publicChangelog)
  return (
    <div className="progress-page" style={{padding: '24px'}}>
      <h1>Development Progress</h1>
      <p>Page shell only — no data is loaded in Step 1.</p>
      <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 16}}>{JSON.stringify(publicChangelog, null, 2)}</pre>
    </div>
  )
}
