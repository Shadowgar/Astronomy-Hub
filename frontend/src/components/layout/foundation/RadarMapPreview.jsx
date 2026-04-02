import React, { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = { lat: 41.321903, lon: -79.585394 }

function parseFloatSafe(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function RadarMapPreview({
  imageUrl,
  center,
  frameIndex = 0,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const overlayRef = useRef(null)
  const centerPoint = useMemo(() => {
    const lat = parseFloatSafe(center?.lat) ?? DEFAULT_CENTER.lat
    const lon = parseFloatSafe(center?.lon) ?? DEFAULT_CENTER.lon
    return { lat, lon }
  }, [center?.lat, center?.lon])

  const overlayBounds = useMemo(() => {
    if (typeof imageUrl === 'string' && imageUrl.trim()) {
      try {
        const parsed = new URL(imageUrl)
        const bbox = parsed.searchParams.get('bbox')
        if (bbox) {
          const [lonMin, latMin, lonMax, latMax] = bbox.split(',').map(parseFloatSafe)
          if ([lonMin, latMin, lonMax, latMax].every((v) => v !== null)) {
            return [[latMin, lonMin], [latMax, lonMax]]
          }
        }
      } catch (error) {
        // Fall back to center-derived bounds when URL parsing fails.
      }
    }
    return [[centerPoint.lat - 2, centerPoint.lon - 2], [centerPoint.lat + 2, centerPoint.lon + 2]]
  }, [imageUrl, centerPoint.lat, centerPoint.lon])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    }).setView([centerPoint.lat, centerPoint.lon], 8)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    mapRef.current = map
    map.fitBounds(overlayBounds, { padding: [16, 16], maxZoom: 8, animate: false })
    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current)
        overlayRef.current = null
      }
      map.remove()
      mapRef.current = null
    }
  }, [centerPoint.lat, centerPoint.lon, overlayBounds])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setView([centerPoint.lat, centerPoint.lon], Math.max(map.getZoom(), 8), { animate: false })
  }, [centerPoint.lat, centerPoint.lon])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !imageUrl) return

    if (overlayRef.current) {
      map.removeLayer(overlayRef.current)
      overlayRef.current = null
    }

    overlayRef.current = L.imageOverlay(imageUrl, overlayBounds, {
      opacity: 0.82,
      interactive: false,
      crossOrigin: true,
      className: 'foundation-radar-frame-overlay',
    })
    overlayRef.current.addTo(map)
  }, [imageUrl, overlayBounds, frameIndex])

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
