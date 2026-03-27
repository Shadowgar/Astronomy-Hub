/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import GlassPanel from './ui/GlassPanel'
import SectionHeader from './ui/SectionHeader'

const MAX_NEWS = 3

export default function SkyNews({ locationQuery = '' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/alerts${locationQuery}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((json) => {
        if (!cancelled) setItems(Array.isArray(json) ? json.slice(0, MAX_NEWS) : [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Unknown error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [locationQuery])

  return (
    <GlassPanel className="module panel sky-news">
      <SectionHeader title="Sky News" subtitle="Light observing context" />

      {loading && <p className="loading">Loading sky news…</p>}
      {error && <p className="error">Error loading sky news: {error}</p>}

      {!loading && !error && (
        <ul>
          {items.length === 0 && <li>No sky news items</li>}
          {items.map((item, idx) => (
            <li key={item.title || idx}>
              <strong>{item.title}</strong>
              <div className="small muted-meta">{item.category}</div>
              <div>{item.summary}</div>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  )
}
