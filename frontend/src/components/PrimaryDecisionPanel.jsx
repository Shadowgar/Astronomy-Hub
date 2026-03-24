/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'

function fmtTime(iso) {
  try {
    if (!iso) return null
    const d = new Date(iso)
    // use 12-hour, no leading zero for hour
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch (e) {
    return null
  }
}

function observingLabel(score) {
  if (score === null || score === undefined) return 'Unknown'
  if (score >= 75) return 'Excellent'
  if (score >= 50) return 'Good'
  if (score >= 25) return 'Fair'
  return 'Poor'
}

export default function PrimaryDecisionPanel({ locationQuery = '' }) {
  const [conds, setConds] = useState(null)
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      fetch(`/api/conditions${locationQuery}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
      fetch(`/api/targets${locationQuery}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
    ])
      .then(([c, t]) => {
        if (!cancelled) {
          setConds(c)
          setTargets(Array.isArray(t) ? t : [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          // keep minimal UX on errors — leave panels empty
          setConds(null)
          setTargets([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [locationQuery])

  const top = targets && targets.length > 0 ? targets[0] : null

  const observingScore = conds && typeof conds.observing_score === 'number' ? conds.observing_score : null
  const status = observingLabel(observingScore)
  const statusText = `Tonight: ${status.toUpperCase()}`
  const summary = conds && conds.summary ? conds.summary : null
  const darknessStart = conds && conds.darkness_window && conds.darkness_window.start ? fmtTime(conds.darkness_window.start) : null
  const darknessEnd = conds && conds.darkness_window && conds.darkness_window.end ? fmtTime(conds.darkness_window.end) : null

  return (
    <section className="primary-decision-panel" aria-labelledby="pdp-heading">
      <div className="pdp-left">
        <div className="pdp-status">{loading ? 'Loading…' : statusText}</div>
      </div>

      <div className="pdp-center">
        <h2 id="pdp-heading">Tonight’s Observing Plan</h2>
        <p className="pdp-summary">{summary || (loading ? 'Loading conditions…' : 'No concise summary available.')}</p>
        <div className="pdp-darkness">
          <strong>Best window:</strong>{' '}
          {darknessStart && darknessEnd ? `${darknessStart} – ${darknessEnd}` : (loading ? '…' : 'Not available')}
        </div>
      </div>

      <div className="pdp-right">
        <div className="pdp-top-target">
          {top ? (
            <p className="pdp-target-sentence">Start with {top.name} ({top.category}) in the {top.direction}</p>
          ) : (
            <div className="pdp-no-target">No recommended target</div>
          )}
        </div>

        <button
          className="pdp-cta"
          onClick={() => {
            const el = document.querySelector('.targets-module') || document.querySelector('.recommended-targets')
            if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        >
          Show Me What To Look At
        </button>
      </div>
    </section>
  )
}
