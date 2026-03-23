import React, { useEffect, useState, useRef } from 'react'
import './locationSelector.css'

export default function LocationSelector({ onApply } = {}) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (query.trim().length < 3) {
      setSuggestions([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const q = encodeURIComponent(query.trim())
    fetch(`/api/location/search?q=${q}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!cancelled && mounted.current) setSuggestions(Array.isArray(json) ? json : [])
      })
      .catch((err) => {
        if (!cancelled && mounted.current) setError(err.message || 'Unknown error')
      })
      .finally(() => { if (!cancelled && mounted.current) setLoading(false) })

    return () => { cancelled = true }
  }, [query])

  const handleApply = () => {
    const chosen = selectedSuggestion || (suggestions && suggestions.length ? suggestions[0] : null)
    if (onApply) onApply(chosen)
    else console.log('Apply location', chosen)
  }

  return (
    <div className="location-selector component">
      <label className="ls-label">Location</label>
      <div className="ls-row">
        <input
          className="ls-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a place (>=3 chars)"
          aria-label="Location input"
        />
        <button className="ls-apply" onClick={handleApply}>Apply</button>
      </div>

      <div className="ls-suggestions">
        {loading && <div className="ls-loading">Loading…</div>}
        {error && <div className="ls-error">Error: {error}</div>}
        {!loading && !error && suggestions && suggestions.length === 0 && query.trim().length >= 3 && (
          <div className="ls-none">No suggestions</div>
        )}
        {!loading && !error && suggestions && suggestions.length > 0 && (
          <ul>
            {suggestions.map((s, idx) => (
              <li
                key={s.name || idx}
                className={`ls-suggestion ${selectedSuggestion && selectedSuggestion.name === s.name ? 'selected' : ''}`}
                onClick={() => setSelectedSuggestion(s)}
                role="button"
                tabIndex={0}
              >
                <div className="ls-suggestion-name">{s.name}</div>
                {s.latitude != null && s.longitude != null && (
                  <div className="ls-suggestion-coords">{s.latitude}, {s.longitude}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
