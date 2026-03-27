import React from "react";
import LocationSelector from "../LocationSelector/LocationSelector";

export default function TopBar({
  activeLocation,
  ORAS,
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
    <header
      className="app-header"
      role="banner"
      style={{ marginBottom: 'var(--space-6)', color: 'var(--text-main)' }}
    >
      <h1
        style={{
          fontSize: 'var(--font-6)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-main)',
          margin: 0,
          marginBottom: 'var(--space-4)'
        }}
      >
        Astronomy Hub
      </h1>
      <div className="header-controls topbar-controls" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--text-main)' }}>
        <div className="location-section">
          <span className="location-label">Location: {activeLocation === ORAS ? ORAS.label : `Custom Location (${activeLocation.latitude.toFixed(5)}, ${activeLocation.longitude.toFixed(5)})`}</span>

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
            <button
              onClick={() => {
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
                setActiveLocation({ label: 'Custom Location', latitude: lat, longitude: lon, elevation_ft: elev })
              }}
              className="location-actions"
            >Apply for session</button>
            <button
              onClick={() => {
                setLocError('')
                setActiveLocation(ORAS)
                setLatInput('')
                setLonInput('')
                setElevInput('')
              }}
            >Reset to ORAS</button>
            {/* Optional dev mount for the LocationSelector used by Step 2D.D3. Enable with ?mountLocationSelector=1 */}
            {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mountLocationSelector') === '1' && (
              <div className="pending-location">
                <LocationSelector
                  onApply={(v) => {
                    setPending(v)
                    if (new URLSearchParams(window.location.search).get('devlog') === '1') {
                      try { console.log(JSON.stringify({ event: 'pending_set', pending: v })) } catch (e) { /* noop */ }
                    }
                  }}
                />
              </div>
            )}
            {pendingLocation && (
              <div className="pending-location">
                <span className="pending-text">Pending: {pendingLocation.name || (pendingLocation.latitude && `${pendingLocation.latitude.toFixed(3)}, ${pendingLocation.longitude.toFixed(3)}`)}</span>
                <button onClick={() => {
                  confirmPending()
                  if (new URLSearchParams(window.location.search).get('devlog') === '1') {
                    try { console.log(JSON.stringify({ event: 'pending_confirm', confirmed: pendingLocation })) } catch (e) {}
                  }
                }}>Confirm pending</button>
                <button onClick={() => clearPending()} className="clear-pending">Clear pending</button>
              </div>
            )}
            {locError && <div className="loc-error" role="alert" style={{ color: 'var(--text-main)' }}>{locError}</div>}
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
  );
}
