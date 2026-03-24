import React, { useEffect, useRef } from 'react'

// Starfield/nebula overlay component
// Usage: <Starfield /> mounted inside the root `.app-shell` so dark-mode CSS controls visibility
export default function Starfield() {
  const nebulaRef = useRef(null)
  const starRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const nebulaCanvas = nebulaRef.current
    const starCanvas = starRef.current
    if (!nebulaCanvas || !starCanvas) return

    const nebCtx = nebulaCanvas.getContext('2d')
    const starCtx = starCanvas.getContext('2d')

    let nebulaBlobs = []
    let layers = []
    const TOTAL_LAYERS = 3
    const TOTAL_STARS = 2500
    const shootingStars = []

    function resize() {
      const dpr = window.devicePixelRatio || 1
      ;[nebulaCanvas, starCanvas].forEach((c) => {
        c.width = Math.floor(window.innerWidth * dpr)
        c.height = Math.floor(window.innerHeight * dpr)
        c.style.width = window.innerWidth + 'px'
        c.style.height = window.innerHeight + 'px'
        const ctx = c.getContext('2d')
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
      })
    }

    function hexToRgb(hex) {
      hex = (hex || '#ffffff').replace('#', '')
      const bigint = Number.parseInt(hex, 16)
      const r = (bigint >> 16) & 255
      const g = (bigint >> 8) & 255
      const b = bigint & 255
      return `${r},${g},${b}`
    }

    function createNebula() {
      nebulaBlobs = []
      const w = window.innerWidth
      const h = window.innerHeight
      const nebulaColors = [
        'rgba(180,150,255,0.04)',
        'rgba(120,180,255,0.035)',
        'rgba(80,140,200,0.03)'
      ]
      for (let i = 0; i < 8; i++) {
        nebulaBlobs.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: 160 + Math.random() * 300,
          color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
          dx: (Math.random() - 0.5) * 0.12,
          dy: (Math.random() - 0.5) * 0.12
        })
      }
    }

    function drawNebula() {
      nebCtx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (const blob of nebulaBlobs) {
        const gradient = nebCtx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius)
        gradient.addColorStop(0, blob.color)
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
        nebCtx.fillStyle = gradient
        nebCtx.beginPath()
        nebCtx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
        nebCtx.fill()

        blob.x += blob.dx
        blob.y += blob.dy
        if (blob.x < -blob.radius) blob.x = window.innerWidth + blob.radius
        if (blob.x > window.innerWidth + blob.radius) blob.x = -blob.radius
        if (blob.y < -blob.radius) blob.y = window.innerHeight + blob.radius
        if (blob.y > window.innerHeight + blob.radius) blob.y = -blob.radius
      }
    }

    function createStars() {
      layers = []
      const w = window.innerWidth
      const h = window.innerHeight
      for (let l = 0; l < TOTAL_LAYERS; l++) {
        const layerStars = []
        const layerCount = Math.floor(TOTAL_STARS / TOTAL_LAYERS)
        for (let i = 0; i < layerCount; i++) {
          const baseColor = Math.random() < 0.02 ? '#ffccaa' : '#ffffff'
          const radius = (Math.random() ** 2.2) * (0.9 + l * 0.2) + 0.08
          layerStars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            radius,
            color: baseColor,
            baseOpacity: Math.random() * 0.35 + 0.12,
            twinkleSpeed: Math.random() * 0.6 + 0.1,
            phase: Math.random() * Math.PI * 2,
            depth: 1 + l
          })
        }
        layers.push(layerStars)
      }
    }

    function createShootingStar() {
      const w = window.innerWidth
      const h = window.innerHeight
      shootingStars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.4,
        length: 80 + Math.random() * 60,
        speed: 600 + Math.random() * 600,
        angle: Math.random() * Math.PI / 6 + Math.PI / 12,
        life: 0
      })
    }

    function drawStars(t) {
      starCtx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const h = window.innerHeight
      for (const layer of layers) {
        for (const s of layer) {
          let y = s.y % h
          let opacity = s.baseOpacity + Math.sin(t * s.twinkleSpeed + s.phase) * 0.06
          opacity = Math.max(0.08, Math.min(opacity, 0.6))
          starCtx.beginPath()
          starCtx.arc(s.x, y, s.radius, 0, Math.PI * 2)
          starCtx.fillStyle = `rgba(${hexToRgb(s.color)},${opacity})`
          starCtx.fill()
        }
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i]
        star.life += 16 / 1000
        const dx = Math.cos(star.angle) * star.speed * 0.016
        const dy = Math.sin(star.angle) * star.speed * 0.016
        star.x += dx
        star.y += dy
        starCtx.beginPath()
        starCtx.moveTo(star.x, star.y)
        starCtx.lineTo(star.x - dx * 3, star.y - dy * 3)
        starCtx.strokeStyle = `rgba(255,255,255,0.85)`
        starCtx.lineWidth = 1.2
        starCtx.stroke()
        if (star.x > window.innerWidth || star.y > window.innerHeight) shootingStars.splice(i, 1)
      }
    }

    function animate(time) {
      drawNebula()
      drawStars(time * 0.001)
      if (Math.random() < 0.0015) createShootingStar()
      rafRef.current = requestAnimationFrame(animate)
    }

    function init() {
      resize()
      createNebula()
      createStars()
      rafRef.current = requestAnimationFrame(animate)
    }

    const onResize = () => {
      clearTimeout(globalThis._starResize)
      globalThis._starResize = setTimeout(() => {
        resize()
        createNebula()
        createStars()
      }, 120)
    }

    window.addEventListener('resize', onResize)
    init()

    return () => {
      window.removeEventListener('resize', onResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <canvas id="nebula-canvas" ref={nebulaRef} className="starfield-canvas nebula-canvas" tabIndex={-1} aria-hidden="true" />
      <canvas id="star-canvas" ref={starRef} className="starfield-canvas star-canvas" tabIndex={-1} aria-hidden="true" />
    </>
  )
}
