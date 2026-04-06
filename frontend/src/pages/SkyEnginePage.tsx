import React, { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { computeMoonSceneObject, computePlanetSceneObjects, computeRealSkySceneObjects, rankGuidanceTargets } from '../features/sky-engine/astronomy'
import { getDesiredFovForObject, getSkyEngineFovDegrees } from '../features/sky-engine/observerNavigation'
import { SKY_ENGINE_REAL_SKY_STARTERS, SKY_ENGINE_SCENE_TIMESTAMP } from '../features/sky-engine/realSkyCatalog'
import {
  SKY_ENGINE_LOCAL_TIME_ZONE,
  SKY_ENGINE_PLAYBACK_RATE_OPTIONS,
  SKY_ENGINE_TIME_SCALE_OPTIONS,
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

function getPlaybackButtonLabel(playbackValue: number, isPlaying: boolean, label: string) {
  if (playbackValue === 0) {
    return isPlaying ? 'Pause' : 'Play'
  }

  return label
}

function formatDisplayedFov(fovDegrees: number) {
  if (fovDegrees >= 100) {
    return `${fovDegrees.toFixed(0)}°`
  }

  if (fovDegrees >= 10) {
    return `${fovDegrees.toFixed(1)}°`
  }

  if (fovDegrees >= 1) {
    return `${fovDegrees.toFixed(2)}°`
  }

  return `${fovDegrees.toFixed(4)}°`
}

export default function SkyEnginePage() {
  const sceneTime = useSkyEngineSceneTime(SKY_ENGINE_SCENE_TIMESTAMP)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [viewFovDegrees, setViewFovDegrees] = useState(() => Number(getSkyEngineFovDegrees(getDesiredFovForObject(null)).toFixed(1)))
  const [aidVisibility, setAidVisibility] = useState({
    constellations: true,
    azimuthRing: true,
    altitudeRings: true,
  })
  const sunState = useMemo(
    () => computeSunState(ORAS_OBSERVER, sceneTime.sceneTimestampIso),
    [sceneTime.sceneTimestampIso],
  )
  const computedSceneObjects = useMemo(
    () => computeRealSkySceneObjects(ORAS_OBSERVER, sceneTime.sceneTimestampIso, SKY_ENGINE_REAL_SKY_STARTERS),
    [sceneTime.sceneTimestampIso],
  )
  const moonObject = useMemo(
    () => computeMoonSceneObject(ORAS_OBSERVER, sceneTime.sceneTimestampIso),
    [sceneTime.sceneTimestampIso],
  )
  const computedPlanetObjects = useMemo(
    () => computePlanetSceneObjects(ORAS_OBSERVER, sceneTime.sceneTimestampIso),
    [sceneTime.sceneTimestampIso],
  )
  const computedVisibleObjects = useMemo(
    () => [...computedSceneObjects, ...computedPlanetObjects, moonObject].filter((object) => object.isAboveHorizon),
    [computedPlanetObjects, computedSceneObjects, moonObject],
  )
  const baseSceneObjects = useMemo(
    () => [...computedVisibleObjects, ...SKY_ENGINE_TEMPORARY_SCENE_SEED],
    [computedVisibleObjects],
  )
  const guidanceTargets = useMemo(
    () => rankGuidanceTargets(baseSceneObjects, 5),
    [baseSceneObjects],
  )
  const guidanceLookup = useMemo(
    () => new Map(guidanceTargets.map((target, index) => [target.objectId, { ...target, tier: index < 2 ? 'featured' as const : 'guide' as const }])),
    [guidanceTargets],
  )
  const sceneObjects = useMemo(
    () => baseSceneObjects.map((object) => {
      const guidance = guidanceLookup.get(object.id)

      if (!guidance) {
        return object
      }

      return {
        ...object,
        guidanceScore: guidance.score,
        guidanceTier: guidance.tier,
      }
    }),
    [baseSceneObjects, guidanceLookup],
  )
  const selection = useSkyEngineSelection(sceneObjects)
  const guidedObjectIds = useMemo(
    () => guidanceTargets.map((target) => target.objectId),
    [guidanceTargets],
  )
  const selectedTargetName = selection.selectedObject?.name ?? 'Ready to inspect'
  const handleAtmosphereStatusChange = useCallback(() => undefined, [])
  const handleViewStateChange = useCallback((viewState: { fovDegrees: number }) => {
    setViewFovDegrees(viewState.fovDegrees)
  }, [])
  const phaseBandState = sunState.phaseLabel === 'Low Sun' ? 'Twilight' : sunState.phaseLabel
  const searchableSceneObjects = useMemo(
    () => [...sceneObjects].sort((left, right) => left.name.localeCompare(right.name)),
    [sceneObjects],
  )
  const matchingSearchObjects = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return searchableSceneObjects.slice(0, 10)
    }

    return searchableSceneObjects
      .filter((object) => object.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 10)
  }, [deferredSearchQuery, searchableSceneObjects])

  const toggleAid = useCallback((key: 'constellations' | 'azimuthRing' | 'altitudeRings') => {
    setAidVisibility((currentVisibility) => ({
      ...currentVisibility,
      [key]: !currentVisibility[key],
    }))
  }, [])

  const selectObjectFromSearch = useCallback((query: string) => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return
    }

    const nextObject = searchableSceneObjects.find((object) => object.name.toLowerCase() === normalizedQuery)
      ?? searchableSceneObjects.find((object) => object.name.toLowerCase().includes(normalizedQuery))

    if (!nextObject) {
      return
    }

    selection.selectObject(nextObject.id)
    setSearchQuery(nextObject.name)
  }, [searchableSceneObjects, selection])

  return (
    <div className="sky-engine-page sky-engine-page--immersive">
      <main className="sky-engine-page__viewport-shell sky-engine-page__viewport-shell--immersive">
        <SkyEngineScene
          observer={ORAS_OBSERVER}
          objects={sceneObjects}
          sunState={sunState}
          selectedObjectId={selection.selectedObjectId}
          guidedObjectIds={guidedObjectIds}
          aidVisibility={aidVisibility}
          onSelectObject={selection.selectObject}
          onAtmosphereStatusChange={handleAtmosphereStatusChange}
          onViewStateChange={handleViewStateChange}
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
            <form
              className="sky-engine-page__search"
              aria-label="Sky Engine target search"
              onSubmit={(event) => {
                event.preventDefault()
                selectObjectFromSearch(searchQuery)
              }}
            >
              <input
                id="sky-engine-target-search"
                className="sky-engine-page__search-input"
                type="search"
                list="sky-engine-target-search-list"
                placeholder="Search visible sky objects"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <datalist id="sky-engine-target-search-list">
                {matchingSearchObjects.map((object) => (
                  <option key={object.id} value={object.name} />
                ))}
              </datalist>
              <button type="submit" className="sky-engine-page__control-chip sky-engine-page__search-submit">
                Find
              </button>
            </form>
            <div className="sky-engine-page__top-bar-meta">
              <div className="sky-engine-page__status-pill">
                <span className="sky-engine-page__top-bar-label">FOV</span>
                <strong>{formatDisplayedFov(viewFovDegrees)}</strong>
              </div>
              <div className="sky-engine-page__status-pill sky-engine-page__status-pill--wide">
                <span className="sky-engine-page__top-bar-label">Target</span>
                <strong>{selectedTargetName}</strong>
                <small>{ORAS_OBSERVER.label}</small>
              </div>
              <div className="sky-engine-page__status-pill sky-engine-page__status-pill--wide">
                <span className="sky-engine-page__top-bar-label">Local time</span>
                <strong>{sceneTime.formattedSceneLocalTimestamp}</strong>
                <small>{sceneTime.formattedSceneOffset} · {SKY_ENGINE_LOCAL_TIME_ZONE} · {sceneTime.playbackRateLabel}</small>
              </div>
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
                <strong className="sky-engine-page__bottom-hud-offset">{sceneTime.formattedScaleOffset}</strong>
              </div>
              <div className="sky-engine-page__bottom-hud-stats">
                <span>{computedVisibleObjects.length} visible real targets</span>
                <span>{moonObject.isAboveHorizon ? `${moonObject.phaseLabel} moon` : 'Moon below horizon'}</span>
                <span>{guidanceTargets.length} guided now</span>
                <span>{selectedTargetName}</span>
              </div>
            </div>

            <div className="sky-engine-page__phase-band" aria-label="Scene light band">
              {['Daylight', 'Twilight', 'Night'].map((band) => (
                <span
                  key={band}
                  className={`sky-engine-page__phase-band-segment${phaseBandState === band ? ' sky-engine-page__phase-band-segment--active' : ''}`}
                >
                  {band}
                </span>
              ))}
            </div>

            <input
              id="sky-engine-time-slider"
              className="sky-engine-page__time-slider"
              type="range"
              min={sceneTime.sliderMin}
              max={sceneTime.sliderMax}
              step={sceneTime.sliderStep}
              value={sceneTime.sceneOffsetSeconds}
              aria-label="Scene time offset"
              onChange={(event) => sceneTime.setSceneOffsetSeconds(Number(event.target.value))}
            />

            <div className="sky-engine-page__bottom-hud-foot">
              <div className="sky-engine-page__control-group" aria-label="Time scale controls">
                <button type="button" className="sky-engine-page__time-reset" onClick={() => sceneTime.nudgeSceneOffset(-sceneTime.selectedTimeScale.stepSeconds)}>
                  - Step
                </button>
                <div className="sky-engine-page__time-slider-scale">
                  {SKY_ENGINE_TIME_SCALE_OPTIONS.map((scaleOption) => (
                    <button
                      key={scaleOption.id}
                      type="button"
                      className={`sky-engine-page__control-chip${sceneTime.timeScaleId === scaleOption.id ? ' sky-engine-page__control-chip--active' : ''}`}
                      onClick={() => sceneTime.setTimeScaleId(scaleOption.id)}
                    >
                      {scaleOption.shortLabel}
                    </button>
                  ))}
                </div>
                <button type="button" className="sky-engine-page__time-reset" onClick={() => sceneTime.nudgeSceneOffset(sceneTime.selectedTimeScale.stepSeconds)}>
                  + Step
                </button>
              </div>

              <div className="sky-engine-page__control-group" aria-label="Playback controls">
                {SKY_ENGINE_PLAYBACK_RATE_OPTIONS.map((playbackOption) => (
                  <button
                    key={playbackOption.value}
                    type="button"
                    className={`sky-engine-page__control-chip${sceneTime.playbackRate === playbackOption.value ? ' sky-engine-page__control-chip--active' : ''}`}
                    onClick={() => {
                      if (playbackOption.value === 0) {
                        sceneTime.togglePlayback()
                        return
                      }

                      sceneTime.setPlaybackRate(playbackOption.value)
                    }}
                  >
                    {getPlaybackButtonLabel(playbackOption.value, sceneTime.isPlaying, playbackOption.label)}
                  </button>
                ))}
                <button type="button" className="sky-engine-page__time-reset" onClick={sceneTime.resetSceneTime}>
                  Reset
                </button>
              </div>
            </div>

            <div className="sky-engine-page__bottom-hud-foot">
              <div className="sky-engine-page__target-chips" aria-label="Guided sky targets">
                {guidanceTargets.map((target) => (
                  <button
                    key={target.objectId}
                    type="button"
                    className={`sky-engine-page__target-chip${selection.selectedObjectId === target.objectId ? ' sky-engine-page__target-chip--active' : ''}`}
                    onClick={() => selection.selectObject(target.objectId)}
                  >
                    {target.name}
                  </button>
                ))}
              </div>
              <div className="sky-engine-page__target-chips" aria-label="Sky aid toggles">
                <button type="button" className={`sky-engine-page__control-chip${aidVisibility.constellations ? ' sky-engine-page__control-chip--active' : ''}`} onClick={() => toggleAid('constellations')}>
                  Constellations
                </button>
                <button type="button" className={`sky-engine-page__control-chip${aidVisibility.azimuthRing ? ' sky-engine-page__control-chip--active' : ''}`} onClick={() => toggleAid('azimuthRing')}>
                  Compass
                </button>
                <button type="button" className={`sky-engine-page__control-chip${aidVisibility.altitudeRings ? ' sky-engine-page__control-chip--active' : ''}`} onClick={() => toggleAid('altitudeRings')}>
                  Altitude
                </button>
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