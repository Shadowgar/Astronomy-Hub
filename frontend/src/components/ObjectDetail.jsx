/* eslint-disable react/prop-types */
import React from 'react'
import { useObjectDetailQuery } from '../features/objects/queries'
import LoadingState from './ui/LoadingState'
import ErrorState from './ui/ErrorState'
import EmptyState from './ui/EmptyState'

function _slugify(name) {
  try {
    return String(name).trim().toLowerCase().split(/\s+/).join('-').split('/').join('-').split("'").join('')
  } catch (e) {
    return String(name || '')
  }
}

export default function ObjectDetail({ objectId, objectName }) {
  const id = objectId || _slugify(objectName)
  const detailQuery = useObjectDetailQuery(id)
  const loading = detailQuery.isLoading
  const error = detailQuery.isError ? String((detailQuery.error && detailQuery.error.message) || 'error') : null
  const detail = (detailQuery.data && detailQuery.data.data) || null

  if (loading) return <LoadingState message="Loading detail…" />
  if (error) return <ErrorState message={`Error loading detail: ${error}`} />
  if (!detail) return <EmptyState message="No detail available" />

  return (
    <div className="object-detail">
      <div className="object-detail-header">
        {detail.media && detail.media.length > 0 ? (
          <img src={detail.media[0].url} alt={detail.name} className="object-detail-thumb" />
        ) : null}
        <div>
          <div><strong>{detail.name}</strong> · <span className="small muted-meta">{detail.type}</span></div>
          <div className="small">{detail.summary}</div>
        </div>
      </div>
      <p className="object-detail-description">{detail.description}</p>
    </div>
  )
}
