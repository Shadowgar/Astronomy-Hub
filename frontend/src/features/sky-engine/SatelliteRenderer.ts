import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import type { DirectProjectedObjectEntry } from './directObjectLayer'
import { buildSelectionRingTexture } from './objectClassRenderer'

interface SatelliteRenderEntry {
  readonly mesh: Mesh
  readonly material: StandardMaterial
  readonly texture: DynamicTexture
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

function buildSatelliteTexture(name: string, colorHex: string) {
  const texture = new DynamicTexture(name, { width: 128, height: 128 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const red = Number.parseInt(colorHex.slice(1, 3), 16)
  const green = Number.parseInt(colorHex.slice(3, 5), 16)
  const blue = Number.parseInt(colorHex.slice(5, 7), 16)

  context.clearRect(0, 0, 128, 128)

  const glow = context.createRadialGradient(64, 64, 4, 64, 64, 24)
  glow.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.98)`)
  glow.addColorStop(0.45, `rgba(${red}, ${green}, ${blue}, 0.46)`)
  glow.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
  context.fillStyle = glow
  context.beginPath()
  context.arc(64, 64, 24, 0, Math.PI * 2)
  context.fill()

  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.92)`
  context.lineWidth = 5
  context.beginPath()
  context.arc(64, 64, 12, 0, Math.PI * 2)
  context.stroke()

  context.lineWidth = 3
  context.beginPath()
  context.moveTo(64, 38)
  context.lineTo(64, 90)
  context.moveTo(38, 64)
  context.lineTo(90, 64)
  context.stroke()

  texture.update()
  return texture
}

function createSatelliteEntry(scene: Scene, entry: DirectProjectedObjectEntry): SatelliteRenderEntry {
  const texture = buildSatelliteTexture(`sky-engine-satellite-${entry.object.id}`, entry.object.colorHex)
  texture.hasAlpha = true

  const mesh = MeshBuilder.CreatePlane(`sky-engine-satellite-mesh-${entry.object.id}`, { width: 1, height: 1 }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = 1

  const material = new StandardMaterial(`sky-engine-satellite-material-${entry.object.id}`, scene)
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

function createSelectionRing(scene: Scene): SelectionRingEntry {
  const texture = buildSelectionRingTexture('sky-engine-satellite-selection-ring', '#8ee7ff', 0.96, 0.28)
  texture.hasAlpha = true

  const mesh = MeshBuilder.CreatePlane('sky-engine-satellite-selection-ring-mesh', { width: 1, height: 1 }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = 2

  const material = new StandardMaterial('sky-engine-satellite-selection-ring-material', scene)
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

function disposeSatelliteEntry(entry: SatelliteRenderEntry) {
  entry.mesh.dispose()
  entry.material.dispose()
  entry.texture.dispose()
}

export function createSatelliteRenderer(scene: Scene) {
  const entries = new Map<string, SatelliteRenderEntry>()
  const selectionRing = createSelectionRing(scene)

  return {
    sync(
      projectedSatellites: readonly DirectProjectedObjectEntry[],
      viewportWidth: number,
      viewportHeight: number,
      selectedObjectId: string | null,
    ) {
      const nextIds = new Set(projectedSatellites.map((entry) => entry.object.id))

      Array.from(entries.keys()).forEach((objectId) => {
        if (nextIds.has(objectId)) {
          return
        }

        const entry = entries.get(objectId)
        if (!entry) {
          return
        }

        disposeSatelliteEntry(entry)
        entries.delete(objectId)
      })

      let selectedEntry: DirectProjectedObjectEntry | null = null

      for (const projectedSatellite of projectedSatellites) {
        let entry = entries.get(projectedSatellite.object.id)

        if (!entry) {
          entry = createSatelliteEntry(scene, projectedSatellite)
          entries.set(projectedSatellite.object.id, entry)
        }

        const isSelected = projectedSatellite.object.id === selectedObjectId
        const position = toViewportPlanePosition(projectedSatellite, viewportWidth, viewportHeight)
        const diameter = Math.max(10, projectedSatellite.markerRadiusPx * 2.2) * (isSelected ? 1.12 : 1)

        entry.mesh.position.copyFrom(position)
        entry.mesh.scaling.set(diameter, diameter, 1)
        entry.mesh.isVisible = projectedSatellite.renderAlpha > 0.001
        entry.material.alpha = clamp(projectedSatellite.renderAlpha + (isSelected ? 0.08 : 0), 0, 1)
        entry.material.emissiveColor = Color3.FromHexString(projectedSatellite.object.colorHex).scale(isSelected ? 1.08 : 0.94)

        if (isSelected) {
          selectedEntry = projectedSatellite
        }
      }

      if (!selectedEntry) {
        selectionRing.mesh.isVisible = false
        return
      }

      const selectionDiameter = Math.max(22, selectedEntry.markerRadiusPx * 4.1)
      selectionRing.mesh.isVisible = true
      selectionRing.mesh.position.copyFrom(toViewportPlanePosition(selectedEntry, viewportWidth, viewportHeight))
      selectionRing.mesh.scaling.set(selectionDiameter, selectionDiameter, 1)
      selectionRing.material.alpha = clamp(selectedEntry.renderAlpha * 0.92, 0.36, 1)
    },
    dispose() {
      entries.forEach((entry) => {
        disposeSatelliteEntry(entry)
      })
      entries.clear()
      selectionRing.mesh.dispose()
      selectionRing.material.dispose()
      selectionRing.texture.dispose()
    },
  }
}