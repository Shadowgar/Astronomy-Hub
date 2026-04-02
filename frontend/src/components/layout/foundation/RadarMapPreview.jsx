import React, { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = { lat: 41.321903, lon: -79.585394 }

function parseFloatSafe(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseBoundsFromRadarUrl(imageUrl, center) {
  if (typeof imageUrl === 'string' && imageUrl.trim()) {
    try {
      const url = new URL(imageUrl)
      const bbox = url.searchParams.get('bbox')
      if (bbox) {
        const [lonMin, latMin, lonMax, latMax] = bbox.split(',').map(parseFloatSafe)
        if ([lonMin, latMin, lonMax, latMax].every((v) => v !== null)) {
          return [[latMin, lonMin], [latMax, lonMax]]
        }
      }
    } catch (error) {
      // Ignore malformed URLs and use fallback bounds.
    }
  }

  const lat = parseFloatSafe(center?.lat) ?? DEFAULT_CENTER.lat
  const lon = parseFloatSafe(center?.lon) ?? DEFAULT_CENTER.lon
  return [[lat - 2, lon - 2], [lat + 2, lon + 2]]
}

export default function RadarMapPreview({ imageUrl, center }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const overlayRef = useRef(null)

  const bounds = useMemo(
    () => parseBoundsFromRadarUrl(imageUrl, center),
    [imageUrl, center?.lat, center?.lon],
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined

    const lat = parseFloatSafe(center?.lat) ?? DEFAULT_CENTER.lat
    const lon = parseFloatSafe(center?.lon) ?? DEFAULT_CENTER.lon

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    }).setView([lat, lon], 7)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    mapRef.current = map
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 8, animate: false })
    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current)
        overlayRef.current = null
      }
      map.remove()
      mapRef.current = null
    }
  }, [bounds, center?.lat, center?.lon])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !imageUrl) return

    if (overlayRef.current) {
      map.removeLayer(overlayRef.current)
      overlayRef.current = null
    }

    overlayRef.current = L.imageOverlay(imageUrl, bounds, {
      opacity: 0.82,
      interactive: false,
      crossOrigin: true,
    })
    overlayRef.current.addTo(map)
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 8, animate: false })
  }, [imageUrl, bounds])

  return (
    <div className="foundation-modal-radar-map-shell">
      <div
        ref={containerRef}
        className="foundation-modal-radar-map"
        aria-label="Interactive local radar map"
      />
    </div>
  )
}
