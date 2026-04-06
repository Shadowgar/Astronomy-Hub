import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { computeRealSkySceneObjects } from '../features/sky-engine/astronomy'
import { SKY_ENGINE_REAL_SKY_STARTERS, SKY_ENGINE_SCENE_TIMESTAMP } from '../features/sky-engine/realSkyCatalog'
import {
  SKY_ENGINE_MAX_SCENE_HOUR_OFFSET,
  SKY_ENGINE_MIN_SCENE_HOUR_OFFSET,
  SKY_ENGINE_SCENE_HOUR_STEP,
  useSkyEngineSceneTime,
} from '../features/sky-engine/sceneTime'
import { computeSunState } from '../features/sky-engine/solar'
import SkyEngineDetailShell from '../features/sky-engine/SkyEngineDetailShell'
import SkyEngineScene from '../features/sky-engine/SkyEngineScene'
import { ORAS_OBSERVER, SKY_ENGINE_TEMPORARY_SCENE_SEED } from '../features/sky-engine/sceneSeed'
import type { SkyEngineAtmosphereStatus } from '../features/sky-engine/types'
import { useSkyEngineSelection } from '../features/sky-engine/useSkyEngineSelection'

const INITIAL_ATMOSPHERE_STATUS: SkyEngineAtmosphereStatus = {
  mode: 'fallback',
  message: 'Sky Engine scene is initializing.',
}

function phaseModifier(phaseLabel: string) {
  return phaseLabel.toLowerCase().split(' ').join('-')
}

export default function SkyEnginePage() {
  const sceneTime = useSkyEngineSceneTime(SKY_ENGINE_SCENE_TIMESTAMP)
  const sunState = useMemo(
    () => computeSunState(ORAS_OBSERVER, sceneTime.sceneTimestampIso),
    [sceneTime.sceneTimestampIso],
  )
  const computedSceneObjects = useMemo(
    () => computeRealSkySceneObjects(ORAS_OBSERVER, sceneTime.sceneTimestampIso, SKY_ENGINE_REAL_SKY_STARTERS),
    [sceneTime.sceneTimestampIso],
  )
  const computedVisibleObjects = useMemo(
    () => computedSceneObjects.filter((object) => object.isAboveHorizon),
    [computedSceneObjects],
  )
  const computedBelowHorizonObjects = useMemo(
    () => computedSceneObjects.filter((object) => !object.isAboveHorizon),
    [computedSceneObjects],
  )
  const sceneObjects = useMemo(
    () => [...computedVisibleObjects, ...SKY_ENGINE_TEMPORARY_SCENE_SEED],
    [computedVisibleObjects],
  )
  const selection = useSkyEngineSelection(sceneObjects)
  const [atmosphereStatus, setAtmosphereStatus] = useState<SkyEngineAtmosphereStatus>(INITIAL_ATMOSPHERE_STATUS)
  const visibleTargets = useMemo(
    () => [...computedVisibleObjects, ...SKY_ENGINE_TEMPORARY_SCENE_SEED],
    [computedVisibleObjects],
  )

  return (
    <div className="sky-engine-page">
      <header className="sky-engine-page__header">
        <div>
          <p className="sky-engine-page__eyebrow">Above Me Orchestration</p>
          <h1>Sky Engine</h1>
          <p className="sky-engine-page__lede">
            Babylon.js owns the viewport. ORAS stays fixed, the star field is computed from real RA/Dec inputs, and the scene now carries its own horizon, compass, and time scrub.
          </p>
        </div>

        <div className="sky-engine-page__header-actions">
          <div className="sky-engine-page__observer-card">
            <span>Observer</span>
            <strong>{ORAS_OBSERVER.label}</strong>
            <p>
              {ORAS_OBSERVER.latitude.toFixed(6)}, {ORAS_OBSERVER.longitude.toFixed(6)} · {ORAS_OBSERVER.elevationFt} ft
            </p>
          </div>
          <Link className="sky-engine-page__back-link" to="/">
            Back to Hub
          </Link>
        </div>
      </header>

      <main className="sky-engine-page__viewport-shell">
        <SkyEngineScene
          observer={ORAS_OBSERVER}
          objects={sceneObjects}
          sunState={sunState}
          selectedObjectId={selection.selectedObjectId}
          onSelectObject={selection.selectObject}
          onAtmosphereStatusChange={setAtmosphereStatus}
        />

        <div className="sky-engine-page__overlay sky-engine-page__overlay--top-left">
          <section className="sky-engine-page__status-card" aria-label="Sky Engine status">
            <h2>Scene</h2>
            <div className="sky-engine-page__scene-link">
              <span className="sky-engine-page__scene-link-label">Scene-linked state</span>
              <div className="sky-engine-page__scene-link-main">
                <strong>{sceneTime.formattedSceneTimestamp}</strong>
                <span
                  className={`sky-engine-page__phase-pill sky-engine-page__phase-pill--${phaseModifier(sunState.phaseLabel)}`}
                  data-phase={sunState.phaseLabel}
                >
                  {sunState.phaseLabel}
                </span>
              </div>
            </div>
            <div className="sky-engine-page__time-slider-block">
              <div className="sky-engine-page__time-slider-header">
                <label className="sky-engine-page__scene-link-label" htmlFor="sky-engine-time-slider">
                  Time scrub
                </label>
                <div className="sky-engine-page__time-slider-actions">
                  <strong>{sceneTime.formattedSceneHourOffset}</strong>
                  <button
                    type="button"
                    className="sky-engine-page__time-reset"
                    onClick={sceneTime.resetSceneTime}
                  >
                    Reset
                  </button>
                </div>
              </div>
              <input
                id="sky-engine-time-slider"
                className="sky-engine-page__time-slider"
                type="range"
                min={SKY_ENGINE_MIN_SCENE_HOUR_OFFSET}
                max={SKY_ENGINE_MAX_SCENE_HOUR_OFFSET}
                step={SKY_ENGINE_SCENE_HOUR_STEP}
                value={sceneTime.sceneHourOffset}
                aria-label="Scene time offset"
                onChange={(event) => sceneTime.setSceneHourOffset(Number(event.target.value))}
              />
              <div className="sky-engine-page__time-slider-scale" aria-hidden="true">
                <span>-24h</span>
                <span>Base</span>
                <span>+24h</span>
              </div>
            </div>

            <div className="sky-engine-page__status-grid">
              <div>
                <span>Visible stars</span>
                <strong>{computedVisibleObjects.length}</strong>
              </div>
              <div>
                <span>Sun</span>
                <strong>{sunState.isAboveHorizon ? 'Up' : 'Down'}</strong>
              </div>
              <div>
                <span>Star visibility</span>
                <strong>{Math.round(sunState.visualCalibration.starVisibility * 100)}%</strong>
              </div>
            </div>

            <p>
              Sun state: {sunState.phaseLabel} · alt {sunState.altitudeDeg.toFixed(1)}° · az {sunState.azimuthDeg.toFixed(1)}°.
            </p>
            <p>Star visibility: {Math.round(sunState.visualCalibration.starVisibility * 100)}%.</p>
            <p>{atmosphereStatus.message}</p>
            <p>Drag to orbit, scroll to zoom, and click a marker or target chip to inspect it.</p>
            {computedBelowHorizonObjects.length > 0 ? (
              <p className="sky-engine-page__status-note">
                Below horizon: {computedBelowHorizonObjects.map((object) => object.name).join(', ')}.
              </p>
            ) : null}
          </section>
        </div>

        <div className="sky-engine-page__overlay sky-engine-page__overlay--bottom-left">
          <section className="sky-engine-page__status-card sky-engine-page__status-card--compact" aria-label="Sky targets">
            <h2>Targets</h2>
            <p className="sky-engine-page__status-note">Selected computed stars show a live 12-hour trajectory arc.</p>
            <ul>
              {visibleTargets.map((object) => (
                <li key={object.id}>
                  <button
                    type="button"
                    className={`sky-engine-page__seed-button${object.source === 'temporary_scene_seed' ? ' sky-engine-page__seed-button--temporary' : ''}${selection.selectedObjectId === object.id ? ' sky-engine-page__seed-button--active' : ''}`}
                    onClick={() => selection.selectObject(object.id)}
                  >
                    <span>
                      {object.name}
                      <small>{object.source === 'computed_real_sky' ? 'Computed star' : 'Temporary marker'}</small>
                    </span>
                    <span>
                      alt {object.altitudeDeg.toFixed(0)}° · az {object.azimuthDeg.toFixed(0)}°
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="sky-engine-page__overlay sky-engine-page__overlay--right">
          <SkyEngineDetailShell
            observer={ORAS_OBSERVER}
            selectedObject={selection.selectedObject}
            selectionStatus={selection.selectionStatus}
            hiddenSelectionName={selection.hiddenSelectionName}
            atmosphereStatus={atmosphereStatus}
            sunState={sunState}
            sceneTimestampIso={sceneTime.sceneTimestampIso}
            onClearSelection={selection.clearSelection}
          />
        </div>
      </main>
    </div>
  )
}