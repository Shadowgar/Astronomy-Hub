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
    selectedObject.source === 'temporary_scene_seed' ||
    selectedObject.rightAscensionHours == null ||
    selectedObject.declinationDeg == null
  ) {
    return null
  }

  return `Source coordinates: RA ${formatRightAscension(selectedObject.rightAscensionHours)} · Dec ${formatSignedDegrees(selectedObject.declinationDeg)}`
}

function getSelectionTruthDescription(selectedObject: SkyEngineSceneObject) {
  if (selectedObject.source === 'backend_satellite_scene') {
    return 'Satellite position is sourced from the backend satellite scene for the active observer snapshot. This slice intentionally renders only a bounded marker without orbit lines or frontend TLE propagation.'
  }

  if (selectedObject.source === 'engine_catalog_tile') {
    return 'Survey-backed star tiles were loaded through the file-backed Sky Engine repository for this scene. The runtime may combine local Hipparcos assets with proxied Gaia HiPS tiles depending on the limiting magnitude.'
  }

  if (selectedObject.source === 'engine_mock_tile') {
    return 'In-memory mock tile data is driving this star while preserving the same runtime slice used by the real file-backed path.'
  }

  if (selectedObject.source === 'computed_real_sky') {
    return 'Catalog position is computed for the ORAS observer and the current scene time.'
  }

  if (selectedObject.source === 'computed_ephemeris') {
    return 'Ephemeris position and phase are recomputed for the active observer and exact scene timestamp.'
  }

  if (selectedObject.source === 'minor_planet_catalog') {
    return 'Minor-planet position is computed from bounded catalog coordinates transformed for the active observer and time.'
  }

  if (selectedObject.source === 'comet_catalog') {
    return 'Comet position is computed from bounded catalog coordinates transformed for the active observer and time.'
  }

  if (selectedObject.source === 'meteor_shower_catalog') {
    return 'Meteor-shower radiant is transformed from bounded shower catalog coordinates for the active observer and time.'
  }

  return 'This remains a temporary scene marker and is kept separate from the computed sky set.'
}

function getSelectionBadgeClassName(selectedObject: SkyEngineSceneObject) {
  return selectedObject.source === 'temporary_scene_seed'
    ? 'sky-engine-detail-shell__badge sky-engine-detail-shell__badge--warning'
    : 'sky-engine-detail-shell__badge sky-engine-detail-shell__badge--real'
}

function getSelectionBadgeLabel(selectedObject: SkyEngineSceneObject) {
  if (selectedObject.source === 'backend_satellite_scene') {
    return 'Backend satellite scene'
  }

  if (selectedObject.source === 'engine_catalog_tile') {
    return 'Catalog tile runtime'
  }

  if (selectedObject.source === 'engine_mock_tile') {
    return 'Mock tile runtime'
  }

  if (selectedObject.source === 'computed_real_sky') {
    return 'Computed real sky'
  }

  if (selectedObject.source === 'computed_ephemeris') {
    return 'Computed ephemeris'
  }

  if (selectedObject.source === 'minor_planet_catalog') {
    return 'Minor-planet catalog'
  }

  if (selectedObject.source === 'comet_catalog') {
    return 'Comet catalog'
  }

  if (selectedObject.source === 'meteor_shower_catalog') {
    return 'Meteor-shower catalog'
  }

  return 'Temporary demo placement'
}

function getTrajectoryLabel(selectedObject: SkyEngineSceneObject) {
  if (selectedObject.type === 'satellite') {
    return 'Marker only'
  }

  if (selectedObject.trackingMode === 'fixed_equatorial') {
    return '12h arc active'
  }

  if (selectedObject.trackingMode === 'lunar_ephemeris') {
    return '12h ephemeris arc'
  }

  return 'Static marker'
}

function getTrajectoryDescription(selectedObject: SkyEngineSceneObject) {
  if (selectedObject.type === 'satellite') {
    return 'Dedicated satellite marker only. Orbit path and iterative propagation are deferred to a later slice.'
  }

  if (selectedObject.trackingMode === 'lunar_ephemeris') {
    return '12h arc is sampled from the lunar ephemeris so the moon does not drift with a fake fixed-star trajectory.'
  }

  if (selectedObject.trackingMode === 'fixed_equatorial') {
    return '12h arc active and tied to the selected object.'
  }

  return 'Static marker only.'
}

function getTrackingLabel(selectedObject: SkyEngineSceneObject) {
  if (selectedObject.type === 'satellite') {
    return 'Backend snapshot'
  }

  if (selectedObject.trackingMode === 'lunar_ephemeris') {
    return 'Ephemeris'
  }

  if (selectedObject.trackingMode === 'fixed_equatorial') {
    return 'Fixed RA/Dec'
  }

  return 'Static'
}

function getGuidanceLabel(selectedObject: SkyEngineSceneObject) {
  if (selectedObject.guidanceScore === undefined) {
    return 'Normal'
  }

  return selectedObject.guidanceTier === 'featured' ? 'Featured' : 'Recommended'
}

function getIlluminationLabel(selectedObject: SkyEngineSceneObject) {
  if (selectedObject.illuminationFraction === undefined) {
    return ''
  }

  return ` · ${(selectedObject.illuminationFraction * 100).toFixed(0)}% illuminated`
}

function formatDegrees(value: number) {
  return `${value.toFixed(1)}°`
}

function renderSelectionInsights(selectedObject: SkyEngineSceneObject) {
  return (
    <>
      {selectedObject.type === 'satellite' ? (
        <p className="sky-engine-detail-shell__hint">
          Pass window: {selectedObject.visibilityWindowStartIso ?? 'Unknown start'}
          {selectedObject.visibilityWindowEndIso ? ` to ${selectedObject.visibilityWindowEndIso}` : ''}
          {selectedObject.providerSource ? ` · provider ${selectedObject.providerSource}` : ''}
          {selectedObject.orbitalPeriodMinutes ? ` · period ${selectedObject.orbitalPeriodMinutes.toFixed(1)} min` : ''}
          {selectedObject.orbitalInclinationDeg ? ` · i ${selectedObject.orbitalInclinationDeg.toFixed(1)}°` : ''}
        </p>
      ) : null}
      {selectedObject.phaseLabel ? (
        <p className="sky-engine-detail-shell__hint">
          Phase: {selectedObject.phaseLabel}
          {getIlluminationLabel(selectedObject)}
        </p>
      ) : null}
      {selectedObject.apparentSizeDeg ? (
        <p className="sky-engine-detail-shell__hint">
          Apparent size: {formatDegrees(selectedObject.apparentSizeDeg)}
        </p>
      ) : null}
      {selectedObject.phaseAngle !== undefined ? (
        <p className="sky-engine-detail-shell__hint">
          Phase angle: {formatDegrees((selectedObject.phaseAngle * 180) / Math.PI)}
        </p>
      ) : null}
      {selectedObject.ringOpening !== undefined ? (
        <p className="sky-engine-detail-shell__hint">
          Ring opening: {(selectedObject.ringOpening * 100).toFixed(0)}%
        </p>
      ) : null}
      {selectedObject.detailRoute ? (
        <p className="sky-engine-detail-shell__hint">
          Source detail route: {selectedObject.detailRoute}
        </p>
      ) : null}
      {selectedObject.guidanceScore === undefined ? null : (
        <p className="sky-engine-detail-shell__hint">
          Guidance target: {(selectedObject.guidanceScore * 100).toFixed(0)} relevance
          {selectedObject.guidanceTier === 'featured' ? ' · featured now' : ''}
        </p>
      )}
      {selectedObject.type === 'meteor_shower' ? (
        <p className="sky-engine-detail-shell__hint">
          Peak: {selectedObject.meteorPeakIso ?? 'Unknown'} · ZHR {selectedObject.meteorZenithRatePerHour ?? 'Unknown'}
        </p>
      ) : null}
    </>
  )
}

function renderSelectionBody(selectedObject: SkyEngineSceneObject) {
  const sourceCoordinates = getSelectionSourceCoordinates(selectedObject)
  const trajectoryLine = getTrajectoryDescription(selectedObject)

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
      {renderSelectionInsights(selectedObject)}

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
          <dd>{
            selectedObject.type === 'satellite' && selectedObject.stdMagnitude === undefined
              ? 'Not provided'
              : selectedObject.magnitude.toFixed(2)
          }</dd>
        </div>
        <div>
          <dt>Horizon</dt>
          <dd>{selectedObject.isAboveHorizon ? 'Above' : 'Below'}</dd>
        </div>
        <div>
          <dt>Trajectory</dt>
          <dd>{getTrajectoryLabel(selectedObject)}</dd>
        </div>
        <div>
          <dt>Tracking</dt>
          <dd>{getTrackingLabel(selectedObject)}</dd>
        </div>
        <div>
          <dt>Guidance</dt>
          <dd>{getGuidanceLabel(selectedObject)}</dd>
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
      <p className="sky-engine-detail-shell__hint">Selected computed targets keep a persistent readable label, and the moon uses its own phase-aware rendering instead of the star path.</p>
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