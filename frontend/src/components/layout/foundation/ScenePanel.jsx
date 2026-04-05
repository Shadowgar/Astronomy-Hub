import React from 'react'
import { Link } from 'react-router-dom'
import PlaceholderItemRow from './PlaceholderItemRow'
import PanelSection from './PanelSection'
import { useSceneByScopeDataQuery } from '../../../features/scene/queries'
import { parseLocationQuery } from '../../../features/shared/locationQuery'
import useGlobalUiState from '../../../state/globalUiState'

const DEFAULT_SCOPE_ENGINE = {
  above_me: 'above_me',
  earth: 'satellites',
  sun: 'moon',
  satellites: 'satellites',
  flights: 'flights',
  solar_system: 'planets',
  deep_sky: 'deep_sky',
}

export default function ScenePanel() {
  const { activeScope, activeEngine, activeFilter, selectedObjectId, setSelectedObjectId } = useGlobalUiState()
  const locationQuery = globalThis.window?.location.search || ''
  const queryParams = parseLocationQuery(locationQuery)
  const scope = activeScope || 'above_me'
  const engine = activeEngine || DEFAULT_SCOPE_ENGINE[scope] || 'above_me'
  const filter = activeFilter || 'visible_now'

  const sceneQuery = useSceneByScopeDataQuery({
    ...queryParams,
    scope,
    engine,
    filter,
  })
  const scene = sceneQuery.data && typeof sceneQuery.data === 'object' ? sceneQuery.data : null
  const sceneItems = Array.isArray(scene?.objects) ? scene.objects.slice(0, 5) : []

  return (
    <section className="module scene-module panel">
      <h2>Primary Scene / Hero</h2>
      <PanelSection title="Scene Snapshot">
        <div className="foundation-scene-body">
          <ul className="foundation-list">
            {sceneItems.map((item) => (
              <PlaceholderItemRow
                key={item.id || item.name}
                name={item.name}
                reason={item.reason || item.summary || 'Live scene object'}
                marker={item.type || null}
                isSelected={(item.id || null) === (selectedObjectId || null)}
                onClick={() => setSelectedObjectId(item.id || null)}
              />
            ))}
          </ul>
        </div>
      </PanelSection>
      <div className="above-me-scene__sky" aria-label="Main scene placeholder" />
      <div className="foundation-scene-notes">
        <p>Scene changes based on:</p>
        <ul>
          <li>scope</li>
          <li>active engine</li>
          <li>active filter</li>
        </ul>
        <Link className="foundation-panel-link foundation-panel-link--launch" to="/sky-engine">
          Open Babylon Sky Engine
        </Link>
      </div>
    </section>
  )
}
