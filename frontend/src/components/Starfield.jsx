import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

const STAR_COUNT = 800
const STAR_FIELD_RADIUS = 3

function createStarPositions(count, radius) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3
    positions[i3] = (Math.random() - 0.5) * radius * 2
    positions[i3 + 1] = (Math.random() - 0.5) * radius * 2
    positions[i3 + 2] = (Math.random() - 0.5) * radius * 2
  }
  return positions
}

export default function Starfield({ className = '' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    camera.position.z = 2.6

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    container.appendChild(renderer.domElement)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(createStarPositions(STAR_COUNT, STAR_FIELD_RADIUS), 3)
    )

    const material = new THREE.PointsMaterial({
      color: 0xd7e6ff,
      size: 0.02,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
    })

    const stars = new THREE.Points(geometry, material)
    scene.add(stars)

    const handleResize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    let rafId = 0
    const animate = () => {
      stars.rotation.y += 0.00015
      stars.rotation.x += 0.00004
      renderer.render(scene, camera)
      rafId = window.requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div className={['starfield', className].filter(Boolean).join(' ')} ref={containerRef} aria-hidden="true" />
}
