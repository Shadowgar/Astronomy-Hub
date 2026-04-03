import React from 'react'
import ContentGrid from '../ContentGrid'
import ContextPanel from './ContextPanel'
import DetailPanelShell from './DetailPanelShell'
import EngineModuleCard from './EngineModuleCard'
import NowAboveMePanel from './NowAboveMePanel'
import ScenePanel from './ScenePanel'
import TopControlBar from './TopControlBar'
import { useSceneByScopeDataQuery } from '../../../features/scene/queries'
import { useAlertsListQuery } from '../../../features/alerts/queries'
import { usePassesListQuery } from '../../../features/passes/queries'
import { useScopesQuery } from '../../../features/scopes/queries'
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

function formatLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatPassStart(value) {
  if (typeof value !== 'string' || !value.trim()) return 'Unknown time'
  try {
    return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch (error) {
    return value
  }
}

function toEventsFromPasses(passes) {
  return passes.map((pass) => ({
    id: `pass-${pass.object_id || pass.object_name || pass.start_time}`,
    name: `${pass.object_name || 'Satellite'} pass`,
    reason: `Starts ${formatPassStart(pass.start_time)} · Max elevation ${pass.max_elevation_deg ?? 'n/a'}°`,
    marker: pass.visibility || 'Live',
  }))
}

export default function CommandCenterFoundationView() {
  const { activeScope, activeEngine, activeFilter, selectedObjectId } = useGlobalUiState()
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
  const alertsQuery = useAlertsListQuery(queryParams)
  const passesQuery = usePassesListQuery(queryParams)
  const scopesQuery = useScopesQuery()

  const scene = sceneQuery.data && typeof sceneQuery.data === 'object' ? sceneQuery.data : null
  const alerts = Array.isArray(alertsQuery.data) ? alertsQuery.data : []
  const passes = Array.isArray(passesQuery.data) ? passesQuery.data : []
  const sceneObjects = Array.isArray(scene?.objects) ? scene.objects : []
  const scopesPayload = scopesQuery.data && typeof scopesQuery.data === 'object' ? scopesQuery.data : null
  const scopes = Array.isArray(scopesPayload?.scopes) ? scopesPayload.scopes : []
  const engineQuickEntryItems = scopes
    .flatMap((scopeItem) => (scopeItem.engines || []).map((engineSlug) => ({ scope: scopeItem.scope, engine: engineSlug })))
    .filter((entry, index, list) => list.findIndex((candidate) => candidate.engine === entry.engine) === index)
    .map((entry) => ({
      name: `${formatLabel(entry.engine)} Engine`,
      reason: `Available in ${formatLabel(entry.scope)} scope.`,
      marker: 'Live',
    }))

  const liveAlerts = alerts.slice(0, 4).map((item, index) => ({
    id: `alert-${index}-${item.title || 'alert'}`,
    name: item.title || 'Alert',
    reason: item.summary || 'Live alert update.',
    marker: item.priority || 'Live',
  }))
  const passEvents = toEventsFromPasses(passes.slice(0, 4))
  const eventsAlertsItems = [...liveAlerts, ...passEvents].slice(0, 4)

  const newsDigestItems = alerts
    .filter((item) => item && item.category !== 'system')
    .slice(0, 4)
    .map((item, index) => ({
      id: `news-${index}-${item.title || 'item'}`,
      name: item.title || 'Space update',
      reason: item.summary || 'Live astronomy update.',
      marker: formatLabel(item.category || 'Live'),
    }))

  if (newsDigestItems.length === 0) {
    newsDigestItems.push({
      id: 'news-unavailable',
      name: 'Space news feed unavailable',
      reason: 'No live article feed is currently configured. Events remain available in Events / Alerts.',
      marker: 'Unavailable',
    })
  }

  const objectsByType = sceneObjects.reduce((acc, item) => {
    const key = String(item.type || 'unknown')
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const activeFiltersItems = [
    {
      name: `scope: ${formatLabel(scope)}`,
      reason: `${sceneObjects.length} live objects in current scene.`,
      marker: 'Live',
    },
    {
      name: `engine: ${formatLabel(engine)}`,
      reason: `Active filter: ${formatLabel(filter)}`,
      marker: 'Live',
    },
    ...Object.entries(objectsByType)
      .slice(0, 3)
      .map(([type, count]) => ({
        name: `${formatLabel(type)} objects`,
        reason: `${count} in current live scene.`,
        marker: 'Live',
      })),
  ]

  const quickToolsItems = [
    {
      name: 'Selected object',
      reason: selectedObjectId ? `Live selection: ${selectedObjectId}` : 'No object selected.',
      marker: selectedObjectId ? 'Live' : 'N/A',
    },
    {
      name: 'Scene timestamp',
      reason: scene?.timestamp || 'Scene time unavailable.',
      marker: 'Live',
    },
    {
      name: 'Location context',
      reason: queryParams.lat && queryParams.lon ? `${queryParams.lat}, ${queryParams.lon}` : 'Default ORAS location',
      marker: 'Live',
    },
    {
      name: 'Provider health',
      reason: scene?.provider_trace?.providers
        ? `${Object.values(scene.provider_trace.providers).filter((payload) => payload?.ok).length}/${Object.keys(scene.provider_trace.providers).length} providers healthy`
        : 'Provider trace unavailable.',
      marker: scene?.provider_trace?.providers ? 'Live' : 'Unknown',
    },
  ]

  return (
    <>
      <TopControlBar />

      <ContentGrid className="app-main-flow">
        <main className="dashboard tight-layout command-center-foundation">
          <div className="command-center-foundation__layout">
            <div className="command-center-foundation__main">
              <section className="section section-scene">
                <div className="section-grid two-col command-center-foundation__hero-row">
                  <ScenePanel />
                  <DetailPanelShell />
                </div>
              </section>

              <section className="section">
                <div className="section-grid three-col command-center-foundation__triple-row">
                  <div className="module panel">
                    <NowAboveMePanel />
                  </div>
                  <EngineModuleCard title="Events / Alerts" items={eventsAlertsItems} footerAction="See all events" />
                  <EngineModuleCard title="News Digest" items={newsDigestItems} footerAction="See all news" />
                </div>
              </section>

              <section className="section">
                <div className="section-grid three-col command-center-foundation__triple-row">
                  <EngineModuleCard title="Engine Quick Entry" items={engineQuickEntryItems} />
                  <EngineModuleCard title="Active Filters" items={activeFiltersItems} />
                  <EngineModuleCard title="Quick Tools" items={quickToolsItems} />
                </div>
              </section>
            </div>

            <aside className="command-center-foundation__detail-column" aria-label="Detail companion panel">
              <ContextPanel />
            </aside>
          </div>
        </main>
      </ContentGrid>

      <footer className="app-footer">ORAS Astronomy Hub (c) 2026</footer>
    </>
  )
}
