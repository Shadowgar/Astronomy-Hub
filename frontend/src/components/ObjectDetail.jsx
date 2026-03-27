/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'

function _slugify(name) {
  try {
    return String(name).trim().toLowerCase().split(/\s+/).join('-').split('/').join('-').split("'").join('')
  } catch (e) {
    return String(name || '')
  }
}

export default function ObjectDetail({ objectId, objectName }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setDetail(null)

    const id = objectId || _slugify(objectName)
    fetch(`/api/object/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json) => {
        if (!cancelled && json && json.data) setDetail(json.data)
      })
      .catch((err) => {
        if (!cancelled) setError(String(err || 'error'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [objectId, objectName])

  if (loading) return <div className="small">Loading detail…</div>
  if (error) return <div className="small error">Error loading detail: {error}</div>
  if (!detail) return <div className="small">No detail available</div>

  return (
    <div className="object-detail">
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        {detail.media && detail.media.length > 0 ? (
          <img src={detail.media[0].url} alt={detail.name} style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6 }} />
        ) : null}
        <div>
          <div><strong>{detail.name}</strong> · <span className="small muted-meta">{detail.type}</span></div>
          <div className="small">{detail.summary}</div>
        </div>
      </div>
      <p style={{ marginTop: 'var(--space-2)' }}>{detail.description}</p>
    </div>
  )
}
