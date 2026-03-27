/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from 'react'
import GlassPanel from './ui/GlassPanel'
import SectionHeader from './ui/SectionHeader'
import ObjectDetail from './ObjectDetail'

function labelForType(type) {
  if (type === 'satellite') return 'Satellite'
  if (type === 'planet') return 'Planet'
  if (type === 'deep_sky') return 'Deep Sky'
  return 'Object'
}

export default function AboveMeScene({ locationQuery = '' }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scene, setScene] = useState(null)
  const [conditions, setConditions] = useState(null)
  const [selectedObjectId, setSelectedObjectId] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      fetch(`/api/scene/above-me${locationQuery}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`scene ${r.status}`)))),
      fetch(`/api/conditions${locationQuery}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`conditions ${r.status}`)))),
    ])
      .then(([sceneResp, conditionsResp]) => {
        if (cancelled) return
        setScene((sceneResp && sceneResp.data) || sceneResp || null)
        setConditions((conditionsResp && conditionsResp.data) || conditionsResp || null)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load scene')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [locationQuery])

  const objects = useMemo(() => (scene && Array.isArray(scene.objects) ? scene.objects : []), [scene])
  const topTarget = useMemo(() => objects.find((o) => o.type === 'planet' || o.type === 'deep_sky') || null, [objects])
  const nextPass = useMemo(() => objects.find((o) => o.type === 'satellite') || null, [objects])

  return (
    <GlassPanel className="module panel above-me-scene">
      <SectionHeader title="Above Me Scene" subtitle="Backend-owned live scene" />

      {loading && <p className="loading">Loading scene…</p>}
      {error && <p className="error">Error loading scene: {error}</p>}

      {!loading && !error && (
        <div className="above-me-scene__content">
          <div className="above-me-scene__briefing">
            <div className="above-me-scene__briefing-item"><strong>Observing score:</strong> {conditions?.observing_score ?? 'N/A'}</div>
            <div className="above-me-scene__briefing-item"><strong>Top target:</strong> {topTarget?.name || 'None'}</div>
            <div className="above-me-scene__briefing-item"><strong>Next pass:</strong> {nextPass?.name || 'None'}</div>
            <div className="above-me-scene__briefing-item"><strong>Objects above now:</strong> {objects.length}</div>
          </div>

          <div className="above-me-scene__sky" aria-label="Sky scene">
            {objects.length === 0 && <div className="above-me-scene__empty">No objects currently above horizon.</div>}
            {objects.map((obj, idx) => {
              const fallbackLeft = 10 + (idx % 5) * 18
              const fallbackTop = 18 + Math.floor(idx / 5) * 24
              return (
                <button
                  key={obj.id || `${obj.name}-${idx}`}
                  type="button"
                  className={`above-me-scene__object above-me-scene__object--${obj.type || 'unknown'}`}
                  style={{ left: `${fallbackLeft}%`, top: `${fallbackTop}%` }}
                  onClick={() => setSelectedObjectId((prev) => (prev === obj.id ? null : obj.id))}
                >
                  <span className="above-me-scene__object-name">{obj.name}</span>
                  <span className="above-me-scene__object-type">{labelForType(obj.type)}</span>
                </button>
              )
            })}
          </div>

          {selectedObjectId && (
            <div className="above-me-scene__detail">
              <div className="above-me-scene__detail-header">
                <strong>Selected object detail</strong>
                <button type="button" onClick={() => setSelectedObjectId(null)}>Close</button>
              </div>
              <ObjectDetail objectId={selectedObjectId} />
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  )
}
