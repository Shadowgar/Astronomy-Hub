import React from 'react'
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

export default function NowAboveMePanel() {
  const { activeScope, activeEngine, activeFilter, setSelectedObjectId } = useGlobalUiState()
  const locationQuery = typeof window !== 'undefined' ? window.location.search : ''
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
  const nowAboveMeItems = Array.isArray(scene?.objects) ? scene.objects.slice(0, 7) : []

  return (
    <PanelSection title="Now Above Me">
      <div className="foundation-now-above-me">
        <ul className="foundation-list">
          {nowAboveMeItems.map((item) => (
            <PlaceholderItemRow
              key={item.id || item.name}
              name={item.name}
              reason={item.reason || item.summary || 'Live scene object'}
              marker={item.type || 'object'}
              onClick={() => setSelectedObjectId(item.id || null)}
            />
          ))}
        </ul>
        <button type="button" className="foundation-panel-link">
          See all visible objects
        </button>
      </div>
    </PanelSection>
  )
}
