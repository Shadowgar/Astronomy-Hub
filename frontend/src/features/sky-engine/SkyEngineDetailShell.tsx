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

function getSelectionSourceCoordinates(selectedObject: SkyEngineSceneObject) {
  if (
    selectedObject.source !== 'computed_real_sky' ||
    selectedObject.rightAscensionHours == null ||
    selectedObject.declinationDeg == null
  ) {
    return null
  }

  return `Source coordinates: RA ${formatRightAscension(selectedObject.rightAscensionHours)} · Dec ${formatSignedDegrees(selectedObject.declinationDeg)}`
}

function getSelectionTruthDescription(selectedObject: SkyEngineSceneObject) {
  if (selectedObject.source === 'computed_real_sky') {
    return 'Computed from catalog right ascension and declination for the fixed ORAS observer and the current scene time.'
  }

  return 'This remains a temporary scene marker and is intentionally separated from the computed sky set.'
}

function getSelectionBadgeClassName(selectedObject: SkyEngineSceneObject) {
  return selectedObject.source === 'temporary_scene_seed'
    ? 'sky-engine-detail-shell__badge sky-engine-detail-shell__badge--warning'
    : 'sky-engine-detail-shell__badge sky-engine-detail-shell__badge--real'
}

function getSelectionBadgeLabel(selectedObject: SkyEngineSceneObject) {
  return selectedObject.source === 'computed_real_sky' ? 'Computed real sky' : 'Temporary demo placement'
}

function renderSelectionBody(selectedObject: SkyEngineSceneObject) {
  const sourceCoordinates = getSelectionSourceCoordinates(selectedObject)
  const hasComputedTrajectory = selectedObject.source === 'computed_real_sky'

  return (
    <div className="sky-engine-detail-shell__body">
      <div className="sky-engine-detail-shell__badge-row">
        <span className="sky-engine-detail-shell__badge">{selectedObject.type}</span>
        {selectedObject.constellation ? (
          <span className="sky-engine-detail-shell__badge">{selectedObject.constellation}</span>
        ) : null}
        <span className={getSelectionBadgeClassName(selectedObject)}>
          {getSelectionBadgeLabel(selectedObject)}
        </span>
      </div>

      <p className="sky-engine-detail-shell__summary">{selectedObject.summary}</p>
      <p>{selectedObject.description}</p>
      {sourceCoordinates ? <p className="sky-engine-detail-shell__hint">{sourceCoordinates}</p> : null}

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
        <div>
          <dt>Horizon</dt>
          <dd>{selectedObject.isAboveHorizon ? 'Above' : 'Below'}</dd>
        </div>
        <div>
          <dt>Trajectory</dt>
          <dd>{hasComputedTrajectory ? '12h arc active' : 'Static marker'}</dd>
        </div>
      </dl>

      <section className="sky-engine-detail-shell__truth-note">
        <h3>Provenance</h3>
        <p>{getSelectionTruthDescription(selectedObject)}</p>
        <p>{selectedObject.truthNote}</p>
      </section>
    </div>
  )
}

function renderEmptySelectionBody(
  selectionStatus: 'idle' | 'active' | 'hidden',
  hiddenSelectionName: string | null,
) {
  if (selectionStatus === 'hidden' && hiddenSelectionName) {
    return (
      <div className="sky-engine-detail-shell__body">
        <p>{hiddenSelectionName} is no longer rendered at this scene time.</p>
        <p className="sky-engine-detail-shell__hint">
          The selection is preserved. Move the time slider back toward the horizon crossing or clear the selection.
        </p>
      </div>
    )
  }

  return (
    <div className="sky-engine-detail-shell__body">
      <p>Drag to look around, scroll to zoom, and click a rendered marker to inspect it.</p>
      <p className="sky-engine-detail-shell__hint">
        Computed stars support a live trajectory arc. Temporary markers stay clearly labeled.
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
  const heading = selectedObject ? selectedObject.name : hiddenSelectionName ?? 'Select a rendered object'

  return (
    <aside className="sky-engine-detail-shell" aria-label="Sky Engine detail shell">
      <div className="sky-engine-detail-shell__header">
        <div>
          <p className="sky-engine-detail-shell__eyebrow">Sky Engine</p>
          <h2>{heading}</h2>
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
          <p>Lighting, visibility, and trajectories all recalculate from this timestamp.</p>
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