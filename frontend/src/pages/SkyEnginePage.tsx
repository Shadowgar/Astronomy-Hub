import React, { useState } from 'react'
import { Link } from 'react-router-dom'

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
  const selection = useSkyEngineSelection(SKY_ENGINE_TEMPORARY_SCENE_SEED)
  const [atmosphereStatus, setAtmosphereStatus] = useState<SkyEngineAtmosphereStatus>(INITIAL_ATMOSPHERE_STATUS)

  return (
    <div className="sky-engine-page">
      <header className="sky-engine-page__header">
        <div>
          <p className="sky-engine-page__eyebrow">Above Me Orchestration</p>
          <h1>Sky Engine</h1>
          <p className="sky-engine-page__lede">
            Babylon.js owns this viewport. ORAS is the hardcoded observer for this first real rendering foundation.
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
          objects={SKY_ENGINE_TEMPORARY_SCENE_SEED}
          selectedObjectId={selection.selectedObjectId}
          onSelectObject={selection.selectObject}
          onAtmosphereStatusChange={setAtmosphereStatus}
        />

        <div className="sky-engine-page__overlay sky-engine-page__overlay--top-left">
          <section className="sky-engine-page__status-card" aria-label="Sky Engine status">
            <h2>Scene Status</h2>
            <p>{atmosphereStatus.message}</p>
            <p>Drag to orbit the camera. Scroll to tighten or widen the view. Click a bright marker to inspect it.</p>
          </section>
        </div>

        <div className="sky-engine-page__overlay sky-engine-page__overlay--bottom-left">
          <section className="sky-engine-page__status-card sky-engine-page__status-card--compact" aria-label="Scene seed legend">
            <h2>Temporary Scene Seed</h2>
            <ul>
              {SKY_ENGINE_TEMPORARY_SCENE_SEED.map((object) => (
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
          </section>
        </div>

        <div className="sky-engine-page__overlay sky-engine-page__overlay--right">
          <SkyEngineDetailShell
            observer={ORAS_OBSERVER}
            selectedObject={selection.selectedObject}
            atmosphereStatus={atmosphereStatus}
            onClearSelection={selection.clearSelection}
          />
        </div>
      </main>
    </div>
  )
}