import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  isOpen = false,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const radarTileLayerRef = useRef(null)
  const [rainViewerTileUrl, setRainViewerTileUrl] = useState('')
  const centerPoint = useMemo(() => {
    const lat = parseFloatSafe(center?.lat) ?? DEFAULT_CENTER.lat
    const lon = parseFloatSafe(center?.lon) ?? DEFAULT_CENTER.lon
    return { lat, lon }
  }, [center?.lat, center?.lon])

  useEffect(() => {
    let cancelled = false

    async function loadRainViewerMetadata() {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json')
        if (!response.ok) return
        const data = await response.json()
        const host = typeof data?.host === 'string' ? data.host : ''
        const past = Array.isArray(data?.radar?.past) ? data.radar.past : []
        const latestPast = past.length > 0 ? past[past.length - 1] : null
        const path = typeof latestPast?.path === 'string' ? latestPast.path : ''
        if (!host || !path || cancelled) return
        setRainViewerTileUrl(`${host}${path}/256/{z}/{x}/{y}/2/1_1.png`)
      } catch (error) {
        // Keep map usable with just basemap if RainViewer metadata fails.
      }
    }

    loadRainViewerMetadata()

    return () => {
      cancelled = true
    }
  }, [])

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
      if (radarTileLayerRef.current) {
        map.removeLayer(radarTileLayerRef.current)
        radarTileLayerRef.current = null
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
    if (!map || !rainViewerTileUrl) return

    if (radarTileLayerRef.current) {
      map.removeLayer(radarTileLayerRef.current)
      radarTileLayerRef.current = null
    }

    radarTileLayerRef.current = L.tileLayer(rainViewerTileUrl, {
      opacity: 0.82,
      zIndex: 450,
      attribution: 'RainViewer',
    })
    radarTileLayerRef.current.addTo(map)
  }, [rainViewerTileUrl])

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
