import React, { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'esri-leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = { lat: 41.321903, lon: -79.585394 }
const NOAA_EVENTDRIVEN_RADAR_URL =
  'https://mapservices.weather.noaa.gov/eventdriven/rest/services/radar/radar_base_reflectivity_time/ImageServer'

function parseFloatSafe(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function RadarMapPreview({
  imageUrl,
  center,
  frameIndex = 0,
  frameCount = 1,
  frameStepMinutes = 10,
  generatedAt,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const radarLayerRef = useRef(null)
  const fallbackOverlayRef = useRef(null)
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

    // Match AtmosWeather's NOAA event-driven radar map-layer strategy.
    if (L.esri && typeof L.esri.imageMapLayer === 'function') {
      radarLayerRef.current = L.esri.imageMapLayer({
        url: NOAA_EVENTDRIVEN_RADAR_URL,
        opacity: 0.82,
      }).addTo(map)
    }

    mapRef.current = map
    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      if (fallbackOverlayRef.current) {
        map.removeLayer(fallbackOverlayRef.current)
        fallbackOverlayRef.current = null
      }
      if (radarLayerRef.current) {
        map.removeLayer(radarLayerRef.current)
        radarLayerRef.current = null
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

    const radarLayer = radarLayerRef.current
    if (radarLayer && typeof radarLayer.setTimeRange === 'function') {
      const totalFrames = Number.isFinite(frameCount) && frameCount > 0 ? frameCount : 1
      const stepMinutes = Number.isFinite(frameStepMinutes) && frameStepMinutes > 0 ? frameStepMinutes : 10
      const latestTime = Number.isFinite(Date.parse(generatedAt)) ? Date.parse(generatedAt) : Date.now()
      const reverseOffset = Math.max(0, totalFrames - 1 - frameIndex)
      const frameEnd = latestTime - reverseOffset * stepMinutes * 60 * 1000
      const frameStart = frameEnd - stepMinutes * 60 * 1000
      radarLayer.setTimeRange(frameStart, frameEnd)
      return
    }

    // Fallback if Esri layer is unavailable.
    if (!imageUrl) return
    if (fallbackOverlayRef.current) {
      map.removeLayer(fallbackOverlayRef.current)
      fallbackOverlayRef.current = null
    }
    const bounds = [[centerPoint.lat - 2, centerPoint.lon - 2], [centerPoint.lat + 2, centerPoint.lon + 2]]
    fallbackOverlayRef.current = L.imageOverlay(imageUrl, bounds, { opacity: 0.82, interactive: false, crossOrigin: true })
    fallbackOverlayRef.current.addTo(map)
  }, [imageUrl, centerPoint.lat, centerPoint.lon, frameIndex, frameCount, frameStepMinutes, generatedAt])

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
