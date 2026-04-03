import React from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'
import PanelSection from './PanelSection'
import { useSceneByScopeDataQuery } from '../../../features/scene/queries'
import { parseLocationQuery } from '../../../features/shared/locationQuery'
import useGlobalUiState from '../../../state/globalUiState'

export default function NowAboveMePanel() {
  const { activeFilter, selectedObjectId, setSelectedObjectId, setActiveScope, setActiveEngine, setActiveFilter } = useGlobalUiState()
  const locationQuery = typeof window !== 'undefined' ? window.location.search : ''
  const queryParams = parseLocationQuery(locationQuery)
  const filter = activeFilter || 'visible_now'
  const aboveMeFilter = filter === 'high_altitude' || filter === 'short_window' ? filter : 'visible_now'
  const sceneQuery = useSceneByScopeDataQuery({
    ...queryParams,
    scope: 'above_me',
    engine: 'above_me',
    filter: aboveMeFilter,
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
              isSelected={(item.id || null) === (selectedObjectId || null)}
              onClick={() => setSelectedObjectId(item.id || null)}
            />
          ))}
        </ul>
        <button
          type="button"
          className="foundation-panel-link"
          onClick={() => {
            setActiveScope('above_me')
            setActiveEngine('above_me')
            setActiveFilter('visible_now')
            setSelectedObjectId(null)
          }}
        >
          See all visible objects
        </button>
      </div>
    </PanelSection>
  )
}
