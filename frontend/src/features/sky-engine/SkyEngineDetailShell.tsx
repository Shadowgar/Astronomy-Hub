import React from 'react'

import type { SkyEngineAtmosphereStatus, SkyEngineObserver, SkyEngineSceneObject } from './types'

interface SkyEngineDetailShellProps {
  observer: SkyEngineObserver
  selectedObject: SkyEngineSceneObject | null
  atmosphereStatus: SkyEngineAtmosphereStatus
  onClearSelection: () => void
}

function formatSignedDegrees(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}°`
}

export default function SkyEngineDetailShell({
  observer,
  selectedObject,
  atmosphereStatus,
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
      </div>

      {selectedObject ? (
        <div className="sky-engine-detail-shell__body">
          <div className="sky-engine-detail-shell__badge-row">
            <span className="sky-engine-detail-shell__badge">{selectedObject.type}</span>
            {selectedObject.constellation ? (
              <span className="sky-engine-detail-shell__badge">{selectedObject.constellation}</span>
            ) : null}
            <span className="sky-engine-detail-shell__badge sky-engine-detail-shell__badge--warning">
              Temporary scene-seed data
            </span>
          </div>

          <p className="sky-engine-detail-shell__summary">{selectedObject.summary}</p>
          <p>{selectedObject.description}</p>

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
            <p>{selectedObject.seededReason}</p>
            <p>
              This slice proves scene ownership, rendering, camera movement, and click-to-detail flow. It does not yet prove
              live astronomical correctness.
            </p>
          </section>
        </div>
      ) : (
        <div className="sky-engine-detail-shell__body">
          <p>Drag the scene to look around. Click a bright rendered marker to open a real selection response.</p>
          <p className="sky-engine-detail-shell__hint">
            Object positions in this page are temporary scene-seed values isolated for the first Babylon Sky Engine slice.
          </p>
        </div>
      )}
    </aside>
  )
}