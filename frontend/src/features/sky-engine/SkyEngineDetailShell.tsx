import React from 'react'

import type { SkyEngineSceneObject } from './types'

interface SkyEngineDetailShellProps {
  readonly selectedObject: SkyEngineSceneObject | null
  readonly selectionStatus: 'idle' | 'active' | 'hidden'
  readonly hiddenSelectionName: string | null
  readonly onClearSelection: () => void
}

function formatSignedDegrees(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}°`
}

function formatRightAscension(value: number) {
  return `${value.toFixed(3)}h`
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
    return 'Catalog position is computed for the ORAS observer and the current scene time.'
  }

  return 'This remains a temporary scene marker and is kept separate from the computed sky set.'
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
  const trajectoryLine = hasComputedTrajectory
    ? '12h arc active and tied to the selected object.'
    : 'Static marker only.'

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
      <p className="sky-engine-detail-shell__description">{selectedObject.truthNote}</p>
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

      <p className="sky-engine-detail-shell__hint">{trajectoryLine}</p>
      <p className="sky-engine-detail-shell__hint">{getSelectionTruthDescription(selectedObject)}</p>
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
      <p>Pick a visible object to open its inspector.</p>
      <p className="sky-engine-detail-shell__hint">Selected computed stars keep a live trajectory arc and a persistent readable label.</p>
    </div>
  )
}

export default function SkyEngineDetailShell({
  selectedObject,
  selectionStatus,
  hiddenSelectionName,
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

      {selectedObject ? renderSelectionBody(selectedObject) : renderEmptySelectionBody(selectionStatus, hiddenSelectionName)}
    </aside>
  )
}