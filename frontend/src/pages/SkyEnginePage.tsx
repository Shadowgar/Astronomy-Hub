import React, { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { computeRealSkySceneObjects } from '../features/sky-engine/astronomy'
import { SKY_ENGINE_REAL_SKY_STARTERS, SKY_ENGINE_SCENE_TIMESTAMP } from '../features/sky-engine/realSkyCatalog'
import {
  SKY_ENGINE_LOCAL_TIME_ZONE,
  SKY_ENGINE_MAX_SCENE_HOUR_OFFSET,
  SKY_ENGINE_MIN_SCENE_HOUR_OFFSET,
  SKY_ENGINE_SCENE_HOUR_STEP,
  useSkyEngineSceneTime,
} from '../features/sky-engine/sceneTime'
import { computeSunState } from '../features/sky-engine/solar'
import SkyEngineDetailShell from '../features/sky-engine/SkyEngineDetailShell'
import SkyEngineScene from '../features/sky-engine/SkyEngineScene'
import { ORAS_OBSERVER, SKY_ENGINE_TEMPORARY_SCENE_SEED } from '../features/sky-engine/sceneSeed'
import { useSkyEngineSelection } from '../features/sky-engine/useSkyEngineSelection'

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
  const sceneObjects = useMemo(
    () => [...computedVisibleObjects, ...SKY_ENGINE_TEMPORARY_SCENE_SEED],
    [computedVisibleObjects],
  )
  const selection = useSkyEngineSelection(sceneObjects)
  const visibleTargets = useMemo(
    () => [...computedVisibleObjects, ...SKY_ENGINE_TEMPORARY_SCENE_SEED],
    [computedVisibleObjects],
  )
  const selectedTargetName = selection.selectedObject?.name ?? 'Ready to inspect'
  const handleAtmosphereStatusChange = useCallback(() => undefined, [])

  return (
    <div className="sky-engine-page sky-engine-page--immersive">
      <main className="sky-engine-page__viewport-shell sky-engine-page__viewport-shell--immersive">
        <SkyEngineScene
          observer={ORAS_OBSERVER}
          objects={sceneObjects}
          sunState={sunState}
          selectedObjectId={selection.selectedObjectId}
          onSelectObject={selection.selectObject}
          onAtmosphereStatusChange={handleAtmosphereStatusChange}
        />

        <div className="sky-engine-page__overlay sky-engine-page__overlay--top-bar">
          <div className="sky-engine-page__top-bar" aria-label="Sky Engine top bar">
            <div className="sky-engine-page__top-bar-section sky-engine-page__top-bar-section--actions">
              <Link className="sky-engine-page__back-link" to="/">
                Back
              </Link>
              <button
                type="button"
                className="sky-engine-page__time-reset sky-engine-page__time-reset--top"
                onClick={sceneTime.resetSceneTime}
              >
                Reset
              </button>
            </div>
            <div className="sky-engine-page__top-bar-section">
              <span className="sky-engine-page__top-bar-label">Observer</span>
              <strong>{ORAS_OBSERVER.label}</strong>
            </div>
            <div className="sky-engine-page__top-bar-section sky-engine-page__top-bar-section--time">
              <span className="sky-engine-page__top-bar-label">Local time</span>
              <strong>{sceneTime.formattedSceneLocalTimestamp}</strong>
              <small>{sceneTime.formattedSceneUtcTimestamp} · {SKY_ENGINE_LOCAL_TIME_ZONE}</small>
            </div>
            <div className="sky-engine-page__top-bar-section sky-engine-page__top-bar-section--phase">
              <span className="sky-engine-page__top-bar-label">Phase</span>
              <span
                className={`sky-engine-page__phase-pill sky-engine-page__phase-pill--${phaseModifier(sunState.phaseLabel)}`}
                data-phase={sunState.phaseLabel}
              >
                {sunState.phaseLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="sky-engine-page__overlay sky-engine-page__overlay--bottom-hud">
          <section className="sky-engine-page__bottom-hud" aria-label="Sky Engine controls">
            <div className="sky-engine-page__bottom-hud-main">
              <div>
                <span className="sky-engine-page__scene-link-label">Time scrub</span>
                <strong className="sky-engine-page__bottom-hud-offset">{sceneTime.formattedSceneHourOffset}</strong>
              </div>
              <div className="sky-engine-page__bottom-hud-stats">
                <span>{computedVisibleObjects.length} visible stars</span>
                <span>{sunState.isAboveHorizon ? 'Sun above horizon' : 'Sun below horizon'}</span>
                <span>{selectedTargetName}</span>
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

            <div className="sky-engine-page__bottom-hud-foot">
              <div className="sky-engine-page__time-slider-scale" aria-hidden="true">
                <span>-24h</span>
                <span>Now</span>
                <span>+24h</span>
              </div>
              <div className="sky-engine-page__target-chips" aria-label="Quick sky targets">
                {visibleTargets.slice(0, 5).map((object) => (
                  <button
                    key={object.id}
                    type="button"
                    className={`sky-engine-page__target-chip${selection.selectedObjectId === object.id ? ' sky-engine-page__target-chip--active' : ''}`}
                    onClick={() => selection.selectObject(object.id)}
                  >
                    {object.name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="sky-engine-page__overlay sky-engine-page__overlay--right">
          <SkyEngineDetailShell
            selectedObject={selection.selectedObject}
            selectionStatus={selection.selectionStatus}
            hiddenSelectionName={selection.hiddenSelectionName}
            onClearSelection={selection.clearSelection}
          />
        </div>
      </main>
    </div>
  )
}