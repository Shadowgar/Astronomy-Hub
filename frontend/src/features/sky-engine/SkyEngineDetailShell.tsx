import React from 'react'

import type { SkyEngineAtmosphereStatus, SkyEngineObserver, SkyEngineSceneObject, SkyEngineSunState } from './types'

interface SkyEngineDetailShellProps {
  observer: SkyEngineObserver
  selectedObject: SkyEngineSceneObject | null
  atmosphereStatus: SkyEngineAtmosphereStatus
  sunState: SkyEngineSunState
  sceneTimestampIso: string
  onClearSelection: () => void
}

function formatSignedDegrees(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}°`
}

function formatRightAscension(value: number) {
  return `${value.toFixed(3)}h`
}

function formatTimestamp(timestampIso: string) {
  return new Date(timestampIso).toUTCString()
}

export default function SkyEngineDetailShell({
  observer,
  selectedObject,
  atmosphereStatus,
  sunState,
  sceneTimestampIso,
  onClearSelection,
}: SkyEngineDetailShellProps) {
  return (
    <aside className="sky-engine-detail-shell" aria-label="Sky Engine detail shell">
      <div className="sky-engine-detail-shell__header">
        <div>
          <p className="sky-engine-detail-shell__eyebrow">Sky Engine</p>
          <h2>{selectedObject ? selectedObject.name : 'Select a rendered object'}</h2>
        </div>
        {selectedObject ? (
          <button type="button" className="sky-engine-detail-shell__clear" onClick={onClearSelection}>
            Clear
          </button>
        ) : null}
      </div>

      <div className="sky-engine-detail-shell__meta-grid">
        <div>
          <span className="sky-engine-detail-shell__meta-label">Observer</span>
          <strong>{observer.label}</strong>
          <p>
            {formatSignedDegrees(observer.latitude)} / {formatSignedDegrees(observer.longitude)}
          </p>
        </div>
        <div>
          <span className="sky-engine-detail-shell__meta-label">Atmosphere</span>
          <strong>{atmosphereStatus.mode === 'addon' ? 'Addon active' : 'Fallback active'}</strong>
          <p>{atmosphereStatus.message}</p>
        </div>
        <div>
          <span className="sky-engine-detail-shell__meta-label">Scene time</span>
          <strong>{formatTimestamp(sceneTimestampIso)}</strong>
          <p>Computed objects move when this timestamp changes in code.</p>
        </div>
        <div>
          <span className="sky-engine-detail-shell__meta-label">Sun state</span>
          <strong>{sunState.phaseLabel}</strong>
          <p>
            Alt {sunState.altitudeDeg.toFixed(1)}° · Az {sunState.azimuthDeg.toFixed(1)}° · {sunState.isAboveHorizon ? 'Above horizon' : 'Below horizon'}
          </p>
        </div>
      </div>

      {selectedObject ? (
        <div className="sky-engine-detail-shell__body">
          <div className="sky-engine-detail-shell__badge-row">
            <span className="sky-engine-detail-shell__badge">{selectedObject.type}</span>
            {selectedObject.constellation ? (
              <span className="sky-engine-detail-shell__badge">{selectedObject.constellation}</span>
            ) : null}
            <span
              className={`sky-engine-detail-shell__badge${selectedObject.source === 'temporary_scene_seed' ? ' sky-engine-detail-shell__badge--warning' : ' sky-engine-detail-shell__badge--real'}`}
            >
              {selectedObject.source === 'computed_real_sky' ? 'Computed real sky' : 'Temporary demo placement'}
            </span>
          </div>

          <p className="sky-engine-detail-shell__summary">{selectedObject.summary}</p>
          <p>{selectedObject.description}</p>

          {selectedObject.source === 'computed_real_sky' && selectedObject.rightAscensionHours != null && selectedObject.declinationDeg != null ? (
            <p className="sky-engine-detail-shell__hint">
              Source coordinates: RA {formatRightAscension(selectedObject.rightAscensionHours)} · Dec {formatSignedDegrees(selectedObject.declinationDeg)}
            </p>
          ) : null}

          <dl className="sky-engine-detail-shell__facts">
            <div>
              <dt>Altitude</dt>
              <dd>{selectedObject.altitudeDeg.toFixed(1)}°</dd>
            </div>
            <div>
              <dt>Azimuth</dt>
              <dd>{selectedObject.azimuthDeg.toFixed(1)}°</dd>
            </div>
            <div>
              <dt>Magnitude</dt>
              <dd>{selectedObject.magnitude.toFixed(2)}</dd>
            </div>
          </dl>

          <section className="sky-engine-detail-shell__truth-note">
            <h3>Truth Boundary</h3>
            <p>{selectedObject.truthNote}</p>
            <p>
              {selectedObject.source === 'computed_real_sky'
                ? 'This object uses a real fixed-star RA/Dec to Alt/Az computation for the ORAS observer and explicit scene timestamp. The slice does not claim a full catalog or planetary ephemeris.'
                : 'This object still uses temporary demo placement and is intentionally kept separate from the computed fixed-star set.'}
            </p>
          </section>
        </div>
      ) : (
        <div className="sky-engine-detail-shell__body">
          <p>Drag the scene to look around. Click a rendered marker to open a selection response.</p>
          <p className="sky-engine-detail-shell__hint">
            Computed stars and temporary demo objects are intentionally separated in this slice.
          </p>
        </div>
      )}
    </aside>
  )
}