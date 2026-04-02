import React, { useEffect, useMemo, useState } from 'react'
import PlaceholderItemRow from './PlaceholderItemRow'
import useGlobalUiState from '../../../state/globalUiState'
import { useObjectDetailDataQuery } from '../../../features/objects/queries'
import { parseLocationQuery } from '../../../features/shared/locationQuery'

function valueOrUnknown(value) {
  if (value === null || value === undefined || value === '') return 'Unknown'
  return String(value)
}

function boolLabel(value) {
  if (value === true) return 'Visible now'
  if (value === false) return 'Not visible now'
  return 'Unknown'
}

function formatPosition(detail) {
  const position = detail && typeof detail === 'object' ? detail.position : null
  const visibility = detail && typeof detail === 'object' ? detail.visibility : null
  const items = []

  if (position && typeof position === 'object') {
    if (position.azimuth !== undefined) {
      items.push({
        name: 'Azimuth',
        reason: `${position.azimuth}°`,
      })
    }
    if (position.elevation !== undefined) {
      items.push({
        name: 'Elevation',
        reason: `${position.elevation}°`,
      })
    }
  }

  if (visibility && typeof visibility === 'object') {
    items.push({
      name: 'Visibility',
      reason: boolLabel(visibility.is_visible),
    })
    if (visibility.visibility_window_start || visibility.visibility_window_end) {
      items.push({
        name: 'Visibility window',
        reason: `${valueOrUnknown(visibility.visibility_window_start)} to ${valueOrUnknown(visibility.visibility_window_end)}`,
      })
    }
  }

  return items.length > 0
    ? items
    : [{ name: 'Sky position', reason: 'No live position fields were provided for this object.' }]
}

function formatMedia(detail) {
  const media = Array.isArray(detail?.media) ? detail.media : []
  if (media.length === 0) {
    return [{ name: 'Images', reason: 'No media available for this object yet.' }]
  }
  return media.slice(0, 4).map((item, index) => ({
    name: `${valueOrUnknown(item.type)} ${index + 1}`,
    reason: valueOrUnknown(item.source),
    url: typeof item.url === 'string' ? item.url : '',
  }))
}

function formatRelated(detail) {
  const related = Array.isArray(detail?.related_objects) ? detail.related_objects : []
  if (related.length === 0) {
    return [{ name: 'Data', reason: 'No related live records available.' }]
  }
  return related.slice(0, 5).map((item) => ({
    name: valueOrUnknown(item.title || item.id),
    reason: valueOrUnknown(item.summary),
  }))
}

export default function DetailPanelShell() {
  const { selectedObjectId, setSelectedObjectId } = useGlobalUiState()
  const locationQuery = typeof window !== 'undefined' ? window.location.search : ''
  const queryParams = parseLocationQuery(locationQuery)
  const objectId = selectedObjectId === null || selectedObjectId === undefined ? null : String(selectedObjectId)
  const detailQuery = useObjectDetailDataQuery(objectId || undefined, queryParams)
  const liveDetail = detailQuery.data && typeof detailQuery.data === 'object' ? detailQuery.data : null
  const [activeTabName, setActiveTabName] = useState('')
  const detailProfile = useMemo(() => {
    if (!liveDetail || !objectId) return null
    const sections = [
      {
        name: 'Overview',
        items: [
          { name: 'Summary', reason: valueOrUnknown(liveDetail.summary) },
          { name: 'Description', reason: valueOrUnknown(liveDetail.description) },
          { name: 'Engine', reason: valueOrUnknown(liveDetail.engine) },
          { name: 'Provider', reason: valueOrUnknown(liveDetail.provider_source) },
        ],
      },
      { name: 'Sky Position', items: formatPosition(liveDetail) },
      { name: 'Images', items: formatMedia(liveDetail) },
      { name: 'Data', items: formatRelated(liveDetail) },
    ]
    return {
      objectName: valueOrUnknown(liveDetail.name || objectId),
      objectMeta: `Type: ${valueOrUnknown(liveDetail.type)} · Engine: ${valueOrUnknown(liveDetail.engine)}`,
      whyItMatters: valueOrUnknown(
        liveDetail.description || liveDetail.summary || 'Live object detail from active scene context.',
      ),
      sections,
    }
  }, [liveDetail, objectId])

  useEffect(() => {
    if (!detailProfile) {
      setActiveTabName('')
      return
    }
    const firstSection = Array.isArray(detailProfile.sections) ? detailProfile.sections[0] : null
    setActiveTabName(firstSection?.name || '')
  }, [detailProfile])

  if (!objectId) {
    return (
      <section className="module-shell detail-panel-shell">
        <div className="module-shell-header detail-panel-shell__header">
          <div className="detail-panel-shell__identity">
            <h3>Detail Panel</h3>
            <p className="detail-panel-shell__object-meta">Select an object from the hub to inspect details.</p>
          </div>
          <button type="button" className="detail-panel-shell__back" disabled>
            Back
          </button>
        </div>
      </section>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <section className="module-shell detail-panel-shell">
        <div className="module-shell-header detail-panel-shell__header">
          <div className="detail-panel-shell__identity">
            <h3>Detail Panel</h3>
            <p className="detail-panel-shell__object-name">Object: {objectId}</p>
            <p className="detail-panel-shell__object-meta">Loading live object detail...</p>
          </div>
          <button type="button" className="detail-panel-shell__back" onClick={() => setSelectedObjectId(null)}>
            Back
          </button>
        </div>
      </section>
    )
  }

  if (detailQuery.isError || !detailProfile) {
    return (
      <section className="module-shell detail-panel-shell">
        <div className="module-shell-header detail-panel-shell__header">
          <div className="detail-panel-shell__identity">
            <h3>Detail Panel</h3>
            <p className="detail-panel-shell__object-name">Object: {objectId}</p>
            <p className="detail-panel-shell__object-meta">Live detail is unavailable for this object.</p>
          </div>
          <button type="button" className="detail-panel-shell__back" onClick={() => setSelectedObjectId(null)}>
            Back
          </button>
        </div>
      </section>
    )
  }

  const sections = Array.isArray(detailProfile.sections) ? detailProfile.sections : []
  const activeSection = sections.find((section) => section.name === activeTabName) || sections[0] || null

  return (
    <section className="module-shell detail-panel-shell">
      <div className="module-shell-header detail-panel-shell__header">
        <div className="detail-panel-shell__identity">
          <h3>Detail Panel</h3>
          <p className="detail-panel-shell__object-name">Object: {detailProfile.objectName}</p>
          <p className="detail-panel-shell__object-meta">{detailProfile.objectMeta}</p>
        </div>
        <button
          type="button"
          className="detail-panel-shell__back"
          onClick={() => setSelectedObjectId(null)}
        >
          Back
        </button>
      </div>

      <div className="module-shell-body detail-panel-shell__body">
        <section className="detail-panel-shell__why">
          <h4>Why it matters</h4>
          <p>{detailProfile.whyItMatters}</p>
        </section>

        <nav className="detail-panel-shell__tabs" aria-label="Detail sections placeholder">
          {sections.map((section) => (
            <button
              key={section.name}
              type="button"
              className={`detail-panel-shell__tab${section.name === activeSection?.name ? ' detail-panel-shell__tab--active' : ''}`}
              onClick={() => setActiveTabName(section.name)}
            >
              {section.name}
            </button>
          ))}
        </nav>

        {activeSection ? (
          <div className="detail-panel-shell__sections">
            <section key={activeSection.name} className="detail-panel-shell__section">
              <h4>{activeSection.name}</h4>
              {activeSection.name === 'Images' ? (
                <div className="detail-panel-shell__media-grid">
                  {activeSection.items.map((item) => (
                    <article key={`${activeSection.name}-${item.name}`} className="detail-panel-shell__media-card">
                      <h5>{item.name}</h5>
                      {item.url ? (
                        <img
                          src={item.url}
                          alt={`${detailProfile.objectName} ${item.name}`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : null}
                      <p className="detail-panel-shell__media-source">{item.reason}</p>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noreferrer">
                          Open source image
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <ul className="foundation-list">
                  {activeSection.items.map((item) => (
                    <PlaceholderItemRow key={`${activeSection.name}-${item.name}`} name={item.name} reason={item.reason} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </section>
  )
}
