import React, { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = { lat: 41.321903, lon: -79.585394 }

function parseFloatSafe(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseBoundsFromImageUrl(imageUrl, centerPoint) {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) return null
  try {
    const parsed = new URL(imageUrl)
    const bbox = parsed.searchParams.get('bbox')
    if (!bbox) return null
    const values = bbox.split(',').map((value) => Number(value))
    if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) return null
    const [lonMin, latMin, lonMax, latMax] = values
    if (latMin >= latMax || lonMin >= lonMax) return null
    return [
      [latMin, lonMin],
      [latMax, lonMax],
    ]
  } catch (error) {
    return [
      [centerPoint.lat - 2, centerPoint.lon - 2],
      [centerPoint.lat + 2, centerPoint.lon + 2],
    ]
  }
}

export default function RadarMapPreview({
  imageUrl,
  center,
  isOpen = false,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const radarOverlayRef = useRef(null)
  const centerPoint = useMemo(() => {
    const lat = parseFloatSafe(center?.lat) ?? DEFAULT_CENTER.lat
    const lon = parseFloatSafe(center?.lon) ?? DEFAULT_CENTER.lon
    return { lat, lon }
  }, [center?.lat, center?.lon])

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
    map.setView([centerPoint.lat, centerPoint.lon], 8, { animate: false })
    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      if (radarOverlayRef.current) {
        map.removeLayer(radarOverlayRef.current)
        radarOverlayRef.current = null
      }
      map.remove()
      mapRef.current = null
    }
  }, [centerPoint.lat, centerPoint.lon])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setView([centerPoint.lat, centerPoint.lon], Math.max(map.getZoom(), 8), { animate: false })
  }, [centerPoint.lat, centerPoint.lon])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (radarOverlayRef.current) {
      map.removeLayer(radarOverlayRef.current)
      radarOverlayRef.current = null
    }
    if (!imageUrl) return
    const bounds = parseBoundsFromImageUrl(imageUrl, centerPoint)
    if (!bounds) return
    radarOverlayRef.current = L.imageOverlay(imageUrl, bounds, {
      opacity: 0.78,
      zIndex: 450,
      crossOrigin: true,
    })
    radarOverlayRef.current.addTo(map)
    map.setView([centerPoint.lat, centerPoint.lon], Math.max(map.getZoom(), 8), { animate: false })
  }, [imageUrl, centerPoint.lat, centerPoint.lon])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isOpen) return
    window.setTimeout(() => map.invalidateSize(), 0)
  }, [isOpen])

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
