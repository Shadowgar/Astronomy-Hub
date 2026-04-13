import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import type { DirectProjectedObjectEntry } from './directObjectLayer'
import { buildSelectionRingTexture } from './objectClassRenderer'

interface PlanetRenderEntry {
  readonly mesh: Mesh
  readonly material: StandardMaterial
  texture: DynamicTexture
  signature: string
}

interface SelectionRingEntry {
  readonly mesh: Mesh
  readonly material: StandardMaterial
  readonly texture: DynamicTexture
}

interface RgbColor {
  readonly red: number
  readonly green: number
  readonly blue: number
}

interface PhaseVisualState {
  readonly illuminationFraction: number
  readonly sunDirectionX: number
  readonly sunDirectionY: number
  readonly sunDirectionZ: number
}

interface SaturnVisualState {
  readonly ringOpening: number
  readonly ringTiltAngle: number
  readonly ringBrightnessGain: number
}

interface PlanetVisualState {
  readonly textureSignature: string
  readonly phaseVisual: PhaseVisualState | null
  readonly saturnVisual: SaturnVisualState | null
}

const TEXTURE_SIZE = 256
const TEXTURE_CENTER = TEXTURE_SIZE * 0.5
const DEFAULT_DISC_RADIUS = 86
const SATURN_DISC_RADIUS = 52
const SATURN_RING_INNER_RADIUS_SCALE = 1.24
const SATURN_RING_OUTER_RADIUS_SCALE = 2.27
const SATURN_MAX_RING_BRIGHTNESS_GAIN = Math.pow(10, -0.4 * (-1.35))
const PHASE_TEXTURE_PLANET_IDS = new Set(['sky-planet-mercury', 'sky-planet-venus'])

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function clamp01(value: number) {
  return clamp(value, 0, 1)
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI
}

function parseColor(colorHex: string): RgbColor {
  return {
    red: Number.parseInt(colorHex.slice(1, 3), 16),
    green: Number.parseInt(colorHex.slice(3, 5), 16),
    blue: Number.parseInt(colorHex.slice(5, 7), 16),
  }
}

function scaleColor(color: RgbColor, amount: number): RgbColor {
  return {
    red: Math.round(clamp(color.red * amount, 0, 255)),
    green: Math.round(clamp(color.green * amount, 0, 255)),
    blue: Math.round(clamp(color.blue * amount, 0, 255)),
  }
}

function mixColor(color: RgbColor, other: RgbColor, amount: number): RgbColor {
  const mixAmount = clamp01(amount)

  return {
    red: Math.round(color.red + (other.red - color.red) * mixAmount),
    green: Math.round(color.green + (other.green - color.green) * mixAmount),
    blue: Math.round(color.blue + (other.blue - color.blue) * mixAmount),
  }
}

function toRgba(color: RgbColor, alpha: number) {
  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${clamp01(alpha)})`
}

function resolvePhaseVisualState(entry: DirectProjectedObjectEntry): PhaseVisualState | null {
  if (!PHASE_TEXTURE_PLANET_IDS.has(entry.object.id)) {
    return null
  }

  if (
    entry.object.illuminationFraction == null ||
    entry.object.phaseAngle == null ||
    entry.object.brightLimbAngleDeg == null
  ) {
    return null
  }

  const phaseSin = Math.sin(entry.object.phaseAngle)
  const brightLimbAngleRad = degreesToRadians(entry.object.brightLimbAngleDeg)

  return {
    illuminationFraction: entry.object.illuminationFraction,
    sunDirectionX: Math.sin(brightLimbAngleRad) * phaseSin,
    sunDirectionY: -Math.cos(brightLimbAngleRad) * phaseSin,
    sunDirectionZ: Math.cos(entry.object.phaseAngle),
  }
}

function resolveSaturnVisualState(entry: DirectProjectedObjectEntry): SaturnVisualState | null {
  if (
    entry.object.id !== 'sky-planet-saturn' ||
    entry.object.ringOpening == null ||
    entry.object.ringTiltAngle == null ||
    entry.object.ringBrightnessGain == null
  ) {
    return null
  }

  return {
    ringOpening: entry.object.ringOpening,
    ringTiltAngle: entry.object.ringTiltAngle,
    ringBrightnessGain: entry.object.ringBrightnessGain,
  }
}

function resolvePlanetVisualState(entry: DirectProjectedObjectEntry): PlanetVisualState {
  const phaseVisual = resolvePhaseVisualState(entry)
  const saturnVisual = resolveSaturnVisualState(entry)

  return {
    phaseVisual,
    saturnVisual,
    textureSignature: [
      phaseVisual && entry.object.brightLimbAngleDeg != null
        ? `phase:${Math.round(phaseVisual.illuminationFraction * 1000)}:${Math.round(entry.object.brightLimbAngleDeg)}`
        : 'phase:none',
      saturnVisual ? `saturn:${Math.round(saturnVisual.ringOpening * 1000)}:${Math.round(radiansToDegrees(saturnVisual.ringTiltAngle))}` : 'saturn:none',
    ].join(':'),
  }
}

function toViewportPlanePosition(entry: DirectProjectedObjectEntry, viewportWidth: number, viewportHeight: number) {
  return new Vector3(
    entry.screenX - viewportWidth * 0.5,
    viewportHeight * 0.5 - entry.screenY,
    clamp(entry.depth * 0.01, 0, 0.01),
  )
}

function buildPlanetTextureSignature(entry: DirectProjectedObjectEntry, visualState: PlanetVisualState) {
  return [entry.object.id, entry.object.colorHex, visualState.textureSignature].join(':')
}

function drawPlanetGlow(
  context: CanvasRenderingContext2D,
  color: RgbColor,
  radius: number,
  alpha: number,
) {
  const glow = context.createRadialGradient(TEXTURE_CENTER, TEXTURE_CENTER, radius * 0.28, TEXTURE_CENTER, TEXTURE_CENTER, radius * 1.45)
  glow.addColorStop(0, toRgba(scaleColor(color, 1.18), alpha * 0.52))
  glow.addColorStop(0.7, toRgba(color, alpha * 0.12))
  glow.addColorStop(1, toRgba(color, 0))
  context.fillStyle = glow
  context.beginPath()
  context.arc(TEXTURE_CENTER, TEXTURE_CENTER, radius * 1.45, 0, Math.PI * 2)
  context.fill()
}

function drawGenericPlanetDisc(context: CanvasRenderingContext2D, color: RgbColor, radius: number) {
  const highlight = scaleColor(color, 1.18)
  const midtone = color
  const shadow = scaleColor(color, 0.7)
  const base = context.createRadialGradient(
    TEXTURE_CENTER - radius * 0.26,
    TEXTURE_CENTER - radius * 0.3,
    radius * 0.18,
    TEXTURE_CENTER,
    TEXTURE_CENTER,
    radius,
  )

  base.addColorStop(0, toRgba(highlight, 0.98))
  base.addColorStop(0.62, toRgba(midtone, 0.98))
  base.addColorStop(1, toRgba(shadow, 0.98))

  context.fillStyle = base
  context.beginPath()
  context.arc(TEXTURE_CENTER, TEXTURE_CENTER, radius, 0, Math.PI * 2)
  context.fill()

  context.strokeStyle = toRgba(scaleColor(color, 0.62), 0.24)
  context.lineWidth = Math.max(4, radius * 0.09)
  ;[-0.28, 0, 0.28].forEach((bandOffset) => {
    const yPosition = TEXTURE_CENTER + radius * bandOffset
    context.beginPath()
    context.moveTo(TEXTURE_CENTER - radius * 0.74, yPosition)
    context.quadraticCurveTo(TEXTURE_CENTER, yPosition - radius * 0.12, TEXTURE_CENTER + radius * 0.74, yPosition)
    context.stroke()
  })
}

function drawPhasePlanetDisc(
  context: CanvasRenderingContext2D,
  color: RgbColor,
  radius: number,
  phaseVisual: PhaseVisualState,
) {
  const imageData = context.createImageData(TEXTURE_SIZE, TEXTURE_SIZE)

  for (let pixelY = 0; pixelY < TEXTURE_SIZE; pixelY += 1) {
    for (let pixelX = 0; pixelX < TEXTURE_SIZE; pixelX += 1) {
      const normalizedX = (pixelX - TEXTURE_CENTER) / radius
      const normalizedY = (pixelY - TEXTURE_CENTER) / radius
      const radiusSquared = normalizedX * normalizedX + normalizedY * normalizedY

      if (radiusSquared > 1) {
        continue
      }

      const normalizedZ = Math.sqrt(1 - radiusSquared)
      const light = Math.max(
        0,
        normalizedX * phaseVisual.sunDirectionX +
          normalizedY * phaseVisual.sunDirectionY +
          normalizedZ * phaseVisual.sunDirectionZ,
      )

      if (light <= 0.0025) {
        continue
      }

      const rim = 1 - Math.sqrt(radiusSquared)
      const brightness = clamp(0.14 + light * 0.8 + rim * 0.06, 0, 1)
      const index = (pixelY * TEXTURE_SIZE + pixelX) * 4
      imageData.data[index] = Math.round(clamp(color.red * (0.72 + brightness * 0.46), 0, 255))
      imageData.data[index + 1] = Math.round(clamp(color.green * (0.72 + brightness * 0.42), 0, 255))
      imageData.data[index + 2] = Math.round(clamp(color.blue * (0.72 + brightness * 0.38), 0, 255))
      imageData.data[index + 3] = Math.round(clamp(light * 1.18 + rim * 0.08, 0, 1) * 255)
    }
  }

  context.putImageData(imageData, 0, 0)
}

function drawSaturnRings(context: CanvasRenderingContext2D, color: RgbColor, saturnVisual: SaturnVisualState, discRadius: number) {
  const outerRadius = discRadius * SATURN_RING_OUTER_RADIUS_SCALE
  const innerRadius = discRadius * SATURN_RING_INNER_RADIUS_SCALE
  const outerMinorRadius = Math.max(outerRadius * saturnVisual.ringOpening, 1.2)
  const innerMinorRadius = Math.max(innerRadius * saturnVisual.ringOpening, 0.8)
  const ringBrightness = clamp01((saturnVisual.ringBrightnessGain - 1) / (SATURN_MAX_RING_BRIGHTNESS_GAIN - 1))
  const ringColor = mixColor(color, { red: 247, green: 238, blue: 210 }, 0.5 + ringBrightness * 0.28)

  context.save()
  context.translate(TEXTURE_CENTER, TEXTURE_CENTER)
  context.rotate(saturnVisual.ringTiltAngle)

  const fill = context.createLinearGradient(-outerRadius, 0, outerRadius, 0)
  fill.addColorStop(0, toRgba(ringColor, 0.06 + ringBrightness * 0.12))
  fill.addColorStop(0.5, toRgba(ringColor, 0.22 + ringBrightness * 0.46))
  fill.addColorStop(1, toRgba(ringColor, 0.06 + ringBrightness * 0.12))
  context.fillStyle = fill
  context.beginPath()
  context.ellipse(0, 0, outerRadius, outerMinorRadius, 0, 0, Math.PI * 2)
  context.fill()

  context.globalCompositeOperation = 'destination-out'
  context.beginPath()
  context.ellipse(0, 0, innerRadius, innerMinorRadius, 0, 0, Math.PI * 2)
  context.fill()
  context.globalCompositeOperation = 'source-over'

  context.strokeStyle = toRgba(scaleColor(ringColor, 0.88), 0.12 + ringBrightness * 0.22)
  context.lineWidth = 2.4
  context.beginPath()
  context.ellipse(0, 0, outerRadius, outerMinorRadius, 0, 0, Math.PI * 2)
  context.stroke()

  context.restore()
}

function buildPlanetSurfaceTexture(name: string, entry: DirectProjectedObjectEntry, visualState: PlanetVisualState) {
  const texture = new DynamicTexture(name, { width: TEXTURE_SIZE, height: TEXTURE_SIZE }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const color = parseColor(entry.object.colorHex)
  const discRadius = visualState.saturnVisual ? SATURN_DISC_RADIUS : DEFAULT_DISC_RADIUS

  context.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  drawPlanetGlow(context, color, visualState.saturnVisual ? discRadius * SATURN_RING_OUTER_RADIUS_SCALE : discRadius, 0.18)

  if (visualState.saturnVisual) {
    drawSaturnRings(context, color, visualState.saturnVisual, discRadius)
  }

  if (visualState.phaseVisual) {
    drawPhasePlanetDisc(context, color, discRadius, visualState.phaseVisual)
  } else {
    drawGenericPlanetDisc(context, color, discRadius)
  }

  texture.update()

  return texture
}

function createPlanetEntry(scene: Scene, entry: DirectProjectedObjectEntry, visualState: PlanetVisualState): PlanetRenderEntry {
  const texture = buildPlanetSurfaceTexture(`sky-engine-planet-surface-${entry.object.id}`, entry, visualState)
  texture.hasAlpha = true

  const mesh = MeshBuilder.CreatePlane(`sky-engine-planet-mesh-${entry.object.id}`, { width: 1, height: 1 }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = 1

  const material = new StandardMaterial(`sky-engine-planet-material-${entry.object.id}`, scene)
  material.disableLighting = true
  material.backFaceCulling = false
  material.diffuseTexture = texture
  material.opacityTexture = texture
  material.useAlphaFromDiffuseTexture = true
  mesh.material = material

  return {
    mesh,
    material,
    texture,
    signature: buildPlanetTextureSignature(entry, visualState),
  }
}

function createSelectionRing(scene: Scene): SelectionRingEntry {
  const texture = buildSelectionRingTexture('sky-engine-planet-selection-ring')
  texture.hasAlpha = true

  const mesh = MeshBuilder.CreatePlane('sky-engine-planet-selection-ring-mesh', { width: 1, height: 1 }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = 2

  const material = new StandardMaterial('sky-engine-planet-selection-ring-material', scene)
  material.disableLighting = true
  material.backFaceCulling = false
  material.diffuseTexture = texture
  material.opacityTexture = texture
  material.useAlphaFromDiffuseTexture = true
  material.emissiveColor = Color3.White()
  mesh.material = material

  return {
    mesh,
    material,
    texture,
  }
}

function disposePlanetEntry(entry: PlanetRenderEntry) {
  entry.mesh.dispose()
  entry.material.dispose()
  entry.texture.dispose()
}

export function createPlanetRenderer(scene: Scene) {
  const entries = new Map<string, PlanetRenderEntry>()
  const selectionRing = createSelectionRing(scene)

  return {
    sync(
      projectedPlanets: readonly DirectProjectedObjectEntry[],
      viewportWidth: number,
      viewportHeight: number,
      selectedObjectId: string | null,
    ) {
      if (projectedPlanets.length === 0 && entries.size === 0) {
        selectionRing.mesh.isVisible = false
        return
      }

      const nextIds = new Set(projectedPlanets.map((entry) => entry.object.id))

      Array.from(entries.keys()).forEach((objectId) => {
        if (nextIds.has(objectId)) {
          return
        }

        const entry = entries.get(objectId)

        if (!entry) {
          return
        }

        disposePlanetEntry(entry)
        entries.delete(objectId)
      })

      let selectedEntry: DirectProjectedObjectEntry | null = null

      projectedPlanets.forEach((projectedPlanet) => {
        const visualState = resolvePlanetVisualState(projectedPlanet)
        let entry = entries.get(projectedPlanet.object.id)

        if (!entry) {
          entry = createPlanetEntry(scene, projectedPlanet, visualState)
          entries.set(projectedPlanet.object.id, entry)
        }

        const nextSignature = buildPlanetTextureSignature(projectedPlanet, visualState)
        if (entry.signature !== nextSignature) {
          entry.texture.dispose()
          entry.texture = buildPlanetSurfaceTexture(
            `sky-engine-planet-surface-${projectedPlanet.object.id}`,
            projectedPlanet,
            visualState,
          )
          entry.texture.hasAlpha = true
          entry.material.diffuseTexture = entry.texture
          entry.material.opacityTexture = entry.texture
          entry.signature = nextSignature
        }

        const isSelected = projectedPlanet.object.id === selectedObjectId
        const diameter = Math.max(2.2, projectedPlanet.markerRadiusPx * 2.08 + 0.9)
        const pointToDiscBlend = clamp((projectedPlanet.markerRadiusPx - 1.05) / 2.6, 0, 1)

        entry.mesh.position.copyFrom(toViewportPlanePosition(projectedPlanet, viewportWidth, viewportHeight))
        entry.mesh.scaling.set(diameter * (isSelected ? 1.14 : 1), diameter * (isSelected ? 1.14 : 1), 1)
        entry.mesh.isVisible = projectedPlanet.renderAlpha > 0.001
        const emissiveBoost = visualState.saturnVisual
          ? Math.pow(visualState.saturnVisual.ringBrightnessGain, 0.18)
          : 1
        entry.material.emissiveColor = Color3.FromHexString(projectedPlanet.object.colorHex).scale((isSelected ? 1.05 : 0.94) * emissiveBoost)
        entry.material.alpha = clamp(projectedPlanet.renderAlpha * (0.82 + pointToDiscBlend * 0.18) + (isSelected ? 0.08 : 0), 0, 1)

        if (isSelected) {
          selectedEntry = projectedPlanet
        }
      })

      if (!selectedEntry) {
        selectionRing.mesh.isVisible = false
        return
      }

      const finalSelectedEntry = selectedEntry as DirectProjectedObjectEntry

      selectionRing.mesh.isVisible = true
      selectionRing.mesh.position.copyFrom(toViewportPlanePosition(finalSelectedEntry, viewportWidth, viewportHeight))
      const selectionDiameter = Math.max(24, finalSelectedEntry.markerRadiusPx * 2.4 + 18)
      selectionRing.mesh.scaling.set(selectionDiameter, selectionDiameter, 1)
      selectionRing.material.alpha = clamp(0.72 + finalSelectedEntry.renderAlpha * 0.18, 0, 0.94)
    },

    dispose() {
      entries.forEach(disposePlanetEntry)
      entries.clear()
      selectionRing.mesh.dispose()
      selectionRing.material.dispose()
      selectionRing.texture.dispose()
    },
  }
}
