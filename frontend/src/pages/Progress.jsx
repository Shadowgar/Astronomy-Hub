import React from 'react'
import publicChangelog from '../content/publicChangelog.json'

export default function Progress() {
  // Minimal Step 2: surface the raw changelog JSON for verification
  if (typeof console !== 'undefined') console.log('publicChangelog:', publicChangelog)
  return (
    <div className="progress-page" style={{padding: '24px'}}>
      <h1>Development Progress</h1>
      <p>Page shell only — no data is loaded in Step 1.</p>

      {/* Step 3 — Current Status (Hero) — minimal card showing phase, summary, note */}
      <section className="changelog-hero" style={{border: '1px solid #e0e0e0', padding: 12, borderRadius: 6, background: '#fafafa', marginTop: 16}}>
        <h2 style={{marginTop: 0}}>Current Status</h2>
        <div><strong>Phase:</strong> {publicChangelog && publicChangelog.currentStatus && publicChangelog.currentStatus.phase ? publicChangelog.currentStatus.phase : '—'}</div>
        <div style={{marginTop: 8}}><strong>Summary:</strong> {publicChangelog && publicChangelog.currentStatus && publicChangelog.currentStatus.summary ? publicChangelog.currentStatus.summary : '—'}</div>
        <div style={{marginTop: 8}}><strong>Note:</strong> {publicChangelog && publicChangelog.currentStatus && publicChangelog.currentStatus.note ? publicChangelog.currentStatus.note : '—'}</div>
      </section>

      {/* Step 4 — Current Focus Section: minimal bullet list */}
      <section className="changelog-focus" style={{marginTop: 16}}>
        <h2 style={{marginTop: 0}}>Current Focus</h2>
        <ul>
          {publicChangelog && publicChangelog.currentFocus && publicChangelog.currentFocus.length > 0 ? (
            publicChangelog.currentFocus.map((f, i) => (
              <li key={i}>{f}</li>
            ))
          ) : (
            <li>—</li>
          )}
        </ul>
      </section>

      {/* Step 5 — Recent Progress Section: minimal list of title + summary */}
      <section className="changelog-recent" style={{marginTop: 16}}>
        <h2 style={{marginTop: 0}}>Recent Progress</h2>
        {publicChangelog && publicChangelog.recentProgress && publicChangelog.recentProgress.length > 0 ? (
          <div>
            {publicChangelog.recentProgress.map((item, i) => (
              <div key={i} style={{marginBottom: 12}}>
                <div style={{fontWeight: 600}}>{item.title}</div>
                <div style={{marginTop: 4}}>{item.summary}</div>
              </div>
            ))}
          </div>
        ) : (
          <div>—</div>
        )}
      </section>

      {/* Step 6 — In Progress Section: minimal list of in-progress items */}
      <section className="changelog-inprogress" style={{marginTop: 16}}>
        <h2 style={{marginTop: 0}}>In Progress</h2>
        {publicChangelog && publicChangelog.inProgress && publicChangelog.inProgress.length > 0 ? (
          <div>
            {publicChangelog.inProgress.map((item, i) => (
              <div key={i} style={{marginBottom: 12}}>
                <div style={{fontWeight: 600}}>{item.title}</div>
                <div style={{marginTop: 4}}>{item.summary}</div>
              </div>
            ))}
          </div>
        ) : (
          <div>—</div>
        )}
      </section>

      <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 16}}>{JSON.stringify(publicChangelog, null, 2)}</pre>
    </div>
  )
}
