import React from 'react'
import publicChangelog from '../content/publicChangelog.json'

export default function Progress() {
  // Minimal Step 2: surface the raw changelog JSON for verification
  if (typeof console !== 'undefined') console.log('publicChangelog:', publicChangelog)
  return (
    <div className="progress-page">
      <h1 className="progress-title">Development Progress</h1>

      {/* Step 3 — Current Status (Hero) — minimal card showing phase, summary, note */}
      <section className="changelog-hero progress-card">
        <h2 className="progress-section-title">Current Status</h2>
        <div><strong>Phase:</strong> {publicChangelog && publicChangelog.currentStatus && publicChangelog.currentStatus.phase ? publicChangelog.currentStatus.phase : '—'}</div>
        <div className="progress-row-gap"><strong>Summary:</strong> {publicChangelog && publicChangelog.currentStatus && publicChangelog.currentStatus.summary ? publicChangelog.currentStatus.summary : '—'}</div>
        <div className="progress-row-gap"><strong>Note:</strong> {publicChangelog && publicChangelog.currentStatus && publicChangelog.currentStatus.note ? publicChangelog.currentStatus.note : '—'}</div>
      </section>

      {/* Step 4 — Current Focus Section: minimal bullet list */}
      <section className="changelog-focus progress-section">
        <h2 className="progress-section-title">Current Focus</h2>
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
      <section className="changelog-recent progress-section">
        <h2 className="progress-section-title">Recent Progress</h2>
        {publicChangelog && publicChangelog.recentProgress && publicChangelog.recentProgress.length > 0 ? (
          <div>
            {publicChangelog.recentProgress.map((item, i) => (
              <div key={i} className="progress-item">
                <div className="progress-item-title">{item.title}</div>
                <div className="progress-item-summary">{item.summary}</div>
              </div>
            ))}
          </div>
        ) : (
          <div>—</div>
        )}
      </section>

      {/* Step 6 — In Progress Section: minimal list of in-progress items */}
      <section className="changelog-inprogress progress-section">
        <h2 className="progress-section-title">In Progress</h2>
        {publicChangelog && publicChangelog.inProgress && publicChangelog.inProgress.length > 0 ? (
          <div>
            {publicChangelog.inProgress.map((item, i) => (
              <div key={i} className="progress-item">
                <div className="progress-item-title">{item.title}</div>
                <div className="progress-item-summary">{item.summary}</div>
              </div>
            ))}
          </div>
        ) : (
          <div>—</div>
        )}
      </section>

      {/* Step 7 — Coming Next Section: minimal list of forward-looking items */}
      <section className="changelog-comingnext progress-section">
        <h2 className="progress-section-title">Coming Next</h2>
        {publicChangelog && publicChangelog.comingNext && publicChangelog.comingNext.length > 0 ? (
          <div>
            {publicChangelog.comingNext.map((item, i) => (
              <div key={i} className="progress-item">
                <div className="progress-item-title">{item.title}</div>
                <div className="progress-item-summary">{item.summary}</div>
              </div>
            ))}
          </div>
        ) : (
          <div>—</div>
        )}
      </section>

      {/* Step 8 — Roadmap Section: minimal list of roadmap items (phase, title, summary) */}
      <section className="changelog-roadmap progress-section">
        <h2 className="progress-section-title">Roadmap</h2>
        {publicChangelog && publicChangelog.roadmap && publicChangelog.roadmap.length > 0 ? (
          <div>
            {publicChangelog.roadmap.map((item, i) => (
              <div key={i} className="progress-item">
                <div className="progress-item-title">{item.phase} — {item.title}</div>
                <div className="progress-item-summary">{item.summary}</div>
              </div>
            ))}
          </div>
        ) : (
          <div>—</div>
        )}
      </section>

      {/* Raw JSON dump removed after verification */}
    </div>
  )
}
