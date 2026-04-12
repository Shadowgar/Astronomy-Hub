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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function toViewportPlanePosition(entry: DirectProjectedObjectEntry, viewportWidth: number, viewportHeight: number) {
  return new Vector3(
    entry.screenX - viewportWidth * 0.5,
    viewportHeight * 0.5 - entry.screenY,
    clamp(entry.depth * 0.01, 0, 0.01),
  )
}

function buildPlanetTextureSignature(entry: DirectProjectedObjectEntry) {
  return [entry.object.id, entry.object.colorHex].join(':')
}

function buildPlanetSurfaceTexture(name: string, colorHex: string) {
  const texture = new DynamicTexture(name, { width: 192, height: 192 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const color = Color3.FromHexString(colorHex)
  const red = Math.round(color.r * 255)
  const green = Math.round(color.g * 255)
  const blue = Math.round(color.b * 255)
  const base = context.createRadialGradient(96, 96, 24, 96, 96, 84)

  base.addColorStop(0, `rgba(${Math.min(255, red + 30)}, ${Math.min(255, green + 24)}, ${Math.min(255, blue + 24)}, 0.98)`)
  base.addColorStop(1, `rgba(${Math.max(0, red - 18)}, ${Math.max(0, green - 20)}, ${Math.max(0, blue - 22)}, 0.98)`)
  context.clearRect(0, 0, 192, 192)
  context.fillStyle = base
  context.beginPath()
  context.arc(96, 96, 82, 0, Math.PI * 2)
  context.fill()

  context.strokeStyle = `rgba(${Math.max(0, red - 42)}, ${Math.max(0, green - 38)}, ${Math.max(0, blue - 34)}, 0.24)`
  context.lineWidth = 8
  ;[72, 96, 120].forEach((yPosition) => {
    context.beginPath()
    context.moveTo(36, yPosition)
    context.quadraticCurveTo(96, yPosition - 10, 156, yPosition)
    context.stroke()
  })
  texture.update()

  return texture
}

function createPlanetEntry(scene: Scene, entry: DirectProjectedObjectEntry): PlanetRenderEntry {
  const texture = buildPlanetSurfaceTexture(`sky-engine-planet-surface-${entry.object.id}`, entry.object.colorHex)
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
    signature: buildPlanetTextureSignature(entry),
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
        let entry = entries.get(projectedPlanet.object.id)

        if (!entry) {
          entry = createPlanetEntry(scene, projectedPlanet)
          entries.set(projectedPlanet.object.id, entry)
        }

        const nextSignature = buildPlanetTextureSignature(projectedPlanet)
        if (entry.signature !== nextSignature) {
          entry.texture.dispose()
          entry.texture = buildPlanetSurfaceTexture(
            `sky-engine-planet-surface-${projectedPlanet.object.id}`,
            projectedPlanet.object.colorHex,
          )
          entry.texture.hasAlpha = true
          entry.material.diffuseTexture = entry.texture
          entry.material.opacityTexture = entry.texture
          entry.signature = nextSignature
        }

        const isSelected = projectedPlanet.object.id === selectedObjectId
        const diameter = Math.max(8, projectedPlanet.markerRadiusPx * 2.15 + 2)

        entry.mesh.position.copyFrom(toViewportPlanePosition(projectedPlanet, viewportWidth, viewportHeight))
        entry.mesh.scaling.set(diameter * (isSelected ? 1.14 : 1), diameter * (isSelected ? 1.14 : 1), 1)
        entry.mesh.isVisible = projectedPlanet.renderAlpha > 0.001
        entry.material.emissiveColor = Color3.FromHexString(projectedPlanet.object.colorHex).scale(isSelected ? 1.05 : 0.94)
        entry.material.alpha = clamp(projectedPlanet.renderAlpha + (isSelected ? 0.08 : 0), 0, 1)

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
