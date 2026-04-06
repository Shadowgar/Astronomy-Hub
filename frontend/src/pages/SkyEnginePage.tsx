import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { computeRealSkySceneObjects } from '../features/sky-engine/astronomy'
import { SKY_ENGINE_REAL_SKY_STARTERS, SKY_ENGINE_SCENE_TIMESTAMP } from '../features/sky-engine/realSkyCatalog'
import SkyEngineDetailShell from '../features/sky-engine/SkyEngineDetailShell'
import SkyEngineScene from '../features/sky-engine/SkyEngineScene'
import { ORAS_OBSERVER, SKY_ENGINE_TEMPORARY_SCENE_SEED } from '../features/sky-engine/sceneSeed'
import type { SkyEngineAtmosphereStatus } from '../features/sky-engine/types'
import { useSkyEngineSelection } from '../features/sky-engine/useSkyEngineSelection'

const INITIAL_ATMOSPHERE_STATUS: SkyEngineAtmosphereStatus = {
  mode: 'fallback',
  message: 'Sky Engine scene is initializing.',
}

export default function SkyEnginePage() {
  const computedSceneObjects = useMemo(
    () => computeRealSkySceneObjects(ORAS_OBSERVER, SKY_ENGINE_SCENE_TIMESTAMP, SKY_ENGINE_REAL_SKY_STARTERS),
    [],
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

  return (
    <div className="sky-engine-page">
      <header className="sky-engine-page__header">
        <div>
          <p className="sky-engine-page__eyebrow">Above Me Orchestration</p>
          <h1>Sky Engine</h1>
          <p className="sky-engine-page__lede">
            Babylon.js owns this viewport. ORAS is the fixed observer, and a tiny starter star set is now positioned from real RA/Dec sky math.
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
          selectedObjectId={selection.selectedObjectId}
          onSelectObject={selection.selectObject}
          onAtmosphereStatusChange={setAtmosphereStatus}
        />

        <div className="sky-engine-page__overlay sky-engine-page__overlay--top-left">
          <section className="sky-engine-page__status-card" aria-label="Sky Engine status">
            <h2>Scene Status</h2>
            <p>{atmosphereStatus.message}</p>
            <p>
              Scene timestamp: {new Date(SKY_ENGINE_SCENE_TIMESTAMP).toUTCString()} · {computedVisibleObjects.length} computed stars rendered above the horizon.
            </p>
            <p>Drag to orbit the camera. Scroll to tighten or widen the view. Click a rendered marker to inspect it.</p>
            {computedBelowHorizonObjects.length > 0 ? (
              <p>
                Below horizon and not rendered as visible targets: {computedBelowHorizonObjects.map((object) => object.name).join(', ')}.
              </p>
            ) : null}
          </section>
        </div>

        <div className="sky-engine-page__overlay sky-engine-page__overlay--bottom-left">
          <section className="sky-engine-page__status-card sky-engine-page__status-card--compact" aria-label="Sky object legend">
            <h2>Rendered Objects</h2>
            <p className="sky-engine-page__section-label">Computed fixed stars</p>
            <ul>
              {computedVisibleObjects.map((object) => (
                <li key={object.id}>
                  <button
                    type="button"
                    className={`sky-engine-page__seed-button${selection.selectedObjectId === object.id ? ' sky-engine-page__seed-button--active' : ''}`}
                    onClick={() => selection.selectObject(object.id)}
                  >
                    <span>{object.name}</span>
                    <span>
                      alt {object.altitudeDeg.toFixed(0)}° · az {object.azimuthDeg.toFixed(0)}°
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="sky-engine-page__section-label">Temporary demo objects</p>
            <ul>
              {SKY_ENGINE_TEMPORARY_SCENE_SEED.map((object) => (
                <li key={object.id}>
                  <button
                    type="button"
                    className={`sky-engine-page__seed-button sky-engine-page__seed-button--temporary${selection.selectedObjectId === object.id ? ' sky-engine-page__seed-button--active' : ''}`}
                    onClick={() => selection.selectObject(object.id)}
                  >
                    <span>{object.name}</span>
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
            atmosphereStatus={atmosphereStatus}
            sceneTimestampIso={SKY_ENGINE_SCENE_TIMESTAMP}
            onClearSelection={selection.clearSelection}
          />
        </div>
      </main>
    </div>
  )
}