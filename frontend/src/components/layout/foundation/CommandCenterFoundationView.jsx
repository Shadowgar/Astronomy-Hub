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
  const scopesQuery = useScopesQuery()

  const scene = sceneQuery.data && typeof sceneQuery.data === 'object' ? sceneQuery.data : null
  const alerts = Array.isArray(alertsQuery.data) ? alertsQuery.data : []
  const sceneObjects = Array.isArray(scene?.objects) ? scene.objects : []
  const providerEntries = Object.entries(scene?.provider_trace?.providers || {})
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

  const eventsAlertsItems = alerts.length > 0
    ? alerts.slice(0, 4).map((item) => ({
      name: item.title || 'Alert',
      reason: item.summary || 'Live alert update.',
      marker: item.priority || 'Live',
    }))
    : sceneObjects.slice(0, 4).map((item) => ({
      name: `${formatLabel(item.type)} watch`,
      reason: item.reason_for_inclusion || item.summary || 'Live scene event candidate.',
      marker: 'Live',
    }))

  const newsDigestItems = providerEntries.length > 0
    ? providerEntries.slice(0, 4).map(([provider, payload]) => ({
      name: `${formatLabel(provider)} provider`,
      reason: payload?.ok
        ? `Pipeline healthy (${payload?.stages?.cache || 'live'} cache state).`
        : `Degraded: ${payload?.reason || 'provider unavailable'}.`,
      marker: payload?.ok ? 'Live' : 'Degraded',
    }))
    : sceneObjects.slice(0, 4).map((item) => ({
      name: item.name || 'Live update',
      reason: item.summary || 'Live scene update.',
      marker: 'Live',
    }))

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
      reason: providerEntries.length > 0
        ? `${providerEntries.filter(([, payload]) => payload?.ok).length}/${providerEntries.length} providers healthy`
        : 'Provider trace unavailable.',
      marker: providerEntries.length > 0 ? 'Live' : 'Unknown',
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
