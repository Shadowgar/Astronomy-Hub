import React, { useState } from 'react'
import './locationSelector.css'
import { useLocationSearchQuery } from '../../features/location/queries'

export default function LocationSelector({ onApply, onConfirm, onCancel } = {}) {
  const [query, setQuery] = useState('')
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)

  const searchQuery = useLocationSearchQuery(query)
  const loading = searchQuery.isFetching
  const error = searchQuery.isError
    ? (searchQuery.error && searchQuery.error.message) || 'Unknown error'
    : null
  const suggestions =
    query.trim().length < 3
      ? []
      : Array.isArray(searchQuery.data)
        ? searchQuery.data
        : []

  const handleApply = () => {
    const chosen = selectedSuggestion || (suggestions && suggestions.length ? suggestions[0] : null)
    if (onApply) onApply(chosen)
    else console.log('Apply location', chosen)
  }

  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    else console.log('Confirm pending (no handler)')
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    else console.log('Clear pending (no handler)')
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
        <button className="ls-confirm" onClick={handleConfirm}>Confirm</button>
        <button className="ls-cancel" onClick={handleCancel}>Cancel</button>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedSuggestion(s)
                  }
                }}
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
