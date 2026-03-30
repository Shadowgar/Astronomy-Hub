import React, { useEffect, useRef } from 'react'
import 'cesium/Build/Cesium/Widgets/widgets.css'

const CESIUM_CDN_BASE_URL = 'https://cdn.jsdelivr.net/npm/cesium@1.139.1/Build/Cesium/'

export default function CesiumFoundation({ enabled = false }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!enabled) return undefined
    const container = containerRef.current
    if (!container) return undefined

    let viewer
    let cancelled = false

    const startViewer = async () => {
      try {
        if (typeof window !== 'undefined') {
          window.CESIUM_BASE_URL = window.CESIUM_BASE_URL || CESIUM_CDN_BASE_URL
        }

        const Cesium = await import('cesium')
        if (cancelled || !container) return

        viewer = new Cesium.Viewer(container, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          navigationHelpButton: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          shouldAnimate: false,
        })

        viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-79.585394, 41.321903, 18000000),
        })
      } catch (error) {
        if (typeof console !== 'undefined') {
          console.warn('Cesium foundation failed to initialize', error)
        }
      }
    }

    startViewer()

    return () => {
      cancelled = true
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy()
      }
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <aside className="cesium-foundation" aria-label="Geospatial foundation preview">
      <div className="cesium-foundation__canvas" ref={containerRef} />
    </aside>
  )
}
