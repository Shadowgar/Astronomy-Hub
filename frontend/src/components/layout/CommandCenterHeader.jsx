import React from 'react'
import { Link } from 'react-router-dom'
import LocationSelector from '../LocationSelector/LocationSelector'
import AppButton from '../ui/AppButton'
import CommandBar from '../ui/CommandBar'

export default function CommandCenterHeader({
  isOrasLocation,
  ORAS,
  activeLocation,
  latInput,
  setLatInput,
  lonInput,
  setLonInput,
  elevInput,
  setElevInput,
  setActiveLocation,
  pendingLocation,
  setPending,
  confirmPending,
  clearPending,
  locError,
  setLocError,
  mode,
  setMode,
  MODES,
}) {
  return (
    <header className="app-header app-header-utility" role="banner">
      <h1>Astronomy Hub</h1>
      <nav aria-label="Primary" className="progress-nav">
        <Link to="/progress" className="progress-link">
          Progress
        </Link>
      </nav>
      <div className="header-controls">
        <div className="location-section">
          <span className="location-label">Location: {isOrasLocation ? ORAS.label : `Custom Location (${activeLocation.latitude.toFixed(5)}, ${activeLocation.longitude.toFixed(5)})`}</span>

          <div className="location-inputs">
            <input
              aria-label="Latitude"
              placeholder="lat"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              className="input-lat"
            />
            <input
              aria-label="Longitude"
              placeholder="lon"
              value={lonInput}
              onChange={(e) => setLonInput(e.target.value)}
              className="input-lon"
            />
            <input
              aria-label="Elevation feet (optional)"
              placeholder="elev ft"
              value={elevInput}
              onChange={(e) => setElevInput(e.target.value)}
              className="input-elev"
            />
            <CommandBar className="location-actions">
              <AppButton
                onClick={() => {
                  // validate inputs
                  setLocError('')
                  const lat = Number.parseFloat(latInput)
                  const lon = Number.parseFloat(lonInput)
                  const elev = elevInput === '' ? undefined : Number(elevInput)
                  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
                    setLocError('Latitude must be a number between -90 and 90')
                    return
                  }
                  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
                    setLocError('Longitude must be a number between -180 and 180')
                    return
                  }
                  if (elev !== undefined && !Number.isFinite(elev)) {
                    setLocError('Elevation must be a number')
                    return
                  }
                  // apply for session only
                  setActiveLocation({ label: 'Custom Location', latitude: lat, longitude: lon, elevation_ft: elev })
                }}
              >
                Apply for session
              </AppButton>
              <AppButton
                variant="secondary"
                onClick={() => {
                  setLocError('')
                  setActiveLocation(ORAS)
                  setLatInput('')
                  setLonInput('')
                  setElevInput('')
                }}
              >
                Reset to ORAS
              </AppButton>
            </CommandBar>
            {/* Optional dev mount for the LocationSelector used by Step 2D.D3. Enable with ?mountLocationSelector=1 */}
            {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mountLocationSelector') === '1' && (
              <div className="pending-location">
                <LocationSelector
                  onApply={(v) => {
                    setPending(v)
                    if (new URLSearchParams(window.location.search).get('devlog') === '1') {
                      // single-line JSON log for dev observation
                      try { console.log(JSON.stringify({ event: 'pending_set', pending: v })) } catch (e) { /* noop */ }
                    }
                  }}
                />
              </div>
            )}
            {/* Show pending location and confirm control when set */}
            {pendingLocation && (
              <div className="pending-location">
                <span className="pending-text">Pending: {pendingLocation.name || (pendingLocation.latitude && `${pendingLocation.latitude.toFixed(3)}, ${pendingLocation.longitude.toFixed(3)}`)}</span>
                <CommandBar>
                  <AppButton
                    onClick={() => {
                      confirmPending()
                      if (new URLSearchParams(window.location.search).get('devlog') === '1') {
                        try { console.log(JSON.stringify({ event: 'pending_confirm', confirmed: pendingLocation })) } catch (e) {}
                      }
                    }}
                  >
                    Confirm pending
                  </AppButton>
                  <AppButton variant="secondary" onClick={() => clearPending()} className="clear-pending">
                    Clear pending
                  </AppButton>
                </CommandBar>
              </div>
            )}
            {locError && <div className="loc-error" role="alert">{locError}</div>}
          </div>
        </div>
        <span className="mode-control">
          Mode:
          <select
            aria-label="Display mode"
            value={mode}
            onChange={(e) => {
              const v = e.target.value
              if (MODES.includes(v)) setMode(v)
            }}
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </span>
      </div>
    </header>
  )
}
