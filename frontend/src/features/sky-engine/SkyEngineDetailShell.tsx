import React from 'react'

import type { SkyEngineAtmosphereStatus, SkyEngineObserver, SkyEngineSceneObject, SkyEngineSunState } from './types'

interface SkyEngineDetailShellProps {
  readonly observer: SkyEngineObserver
  readonly selectedObject: SkyEngineSceneObject | null
  readonly selectionStatus: 'idle' | 'active' | 'hidden'
  readonly hiddenSelectionName: string | null
  readonly atmosphereStatus: SkyEngineAtmosphereStatus
  readonly sunState: SkyEngineSunState
  readonly sceneTimestampIso: string
  readonly onClearSelection: () => void
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

function phaseModifier(phaseLabel: SkyEngineSunState['phaseLabel']) {
  return phaseLabel.toLowerCase().split(' ').join('-')
}

function renderSelectionSourceCoordinates(selectedObject: SkyEngineSceneObject) {
  if (
    selectedObject.source !== 'computed_real_sky' ||
    selectedObject.rightAscensionHours == null ||
    selectedObject.declinationDeg == null
  ) {
    return null
  }

  return (
    <p className="sky-engine-detail-shell__hint">
      Source coordinates: RA {formatRightAscension(selectedObject.rightAscensionHours)} · Dec {formatSignedDegrees(selectedObject.declinationDeg)}
    </p>
  )
}

function renderSelectionTruthNote(selectedObject: SkyEngineSceneObject) {
  const truthDescription = selectedObject.source === 'computed_real_sky'
    ? 'This object uses a real fixed-star RA/Dec to Alt/Az computation for the ORAS observer and explicit scene timestamp. The slice does not claim a full catalog or planetary ephemeris.'
    : 'This object still uses temporary demo placement and is intentionally kept separate from the computed fixed-star set.'

  return (
    <section className="sky-engine-detail-shell__truth-note">
      <h3>Truth Boundary</h3>
      <p>{selectedObject.truthNote}</p>
      <p>{truthDescription}</p>
    </section>
  )
}

function renderSelectionBody(selectedObject: SkyEngineSceneObject) {
  return (
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
      {renderSelectionSourceCoordinates(selectedObject)}

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

      {renderSelectionTruthNote(selectedObject)}
    </div>
  )
}

function renderEmptySelectionBody(selectionStatus: 'idle' | 'active' | 'hidden', hiddenSelectionName: string | null) {
  if (selectionStatus === 'hidden' && hiddenSelectionName) {
    return (
      <div className="sky-engine-detail-shell__body">
        <p>{hiddenSelectionName} is no longer rendered at this scene time.</p>
        <p className="sky-engine-detail-shell__hint">
          The selection is preserved, but the object is currently below the horizon or outside the active rendered set. Change time again or clear the selection.
        </p>
      </div>
    )
  }

  return (
    <div className="sky-engine-detail-shell__body">
      <p>Drag the scene to look around. Click a rendered marker to open a selection response.</p>
      <p className="sky-engine-detail-shell__hint">
        Computed stars and temporary demo objects are intentionally separated in this slice.
      </p>
    </div>
  )
}

export default function SkyEngineDetailShell({
  observer,
  selectedObject,
  selectionStatus,
  hiddenSelectionName,
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
          <h2>{selectedObject ? selectedObject.name : hiddenSelectionName ?? 'Select a rendered object'}</h2>
        </div>
        {selectionStatus === 'active' || selectionStatus === 'hidden' ? (
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
          <p>Lighting, atmosphere response, and star visibility all recalibrate from this timestamp.</p>
        </div>
        <div>
          <span className="sky-engine-detail-shell__meta-label">Scene-linked sun state</span>
          <strong className="sky-engine-detail-shell__phase-line">
            <span className={`sky-engine-page__phase-pill sky-engine-page__phase-pill--${phaseModifier(sunState.phaseLabel)}`}>
              {sunState.phaseLabel}
            </span>
            <span>{sunState.isAboveHorizon ? 'Above horizon' : 'Below horizon'}</span>
          </strong>
          <p>
            Alt {sunState.altitudeDeg.toFixed(1)}° · Az {sunState.azimuthDeg.toFixed(1)}° · Star visibility {Math.round(sunState.visualCalibration.starVisibility * 100)}%
          </p>
        </div>
      </div>

      {selectedObject ? renderSelectionBody(selectedObject) : renderEmptySelectionBody(selectionStatus, hiddenSelectionName)}
    </aside>
  )
}