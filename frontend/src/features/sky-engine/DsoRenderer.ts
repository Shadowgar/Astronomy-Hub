import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import type { DirectProjectedObjectEntry } from './directObjectLayer'
import { getDeepSkyMarkerDimensionsPx, resolveDeepSkyVisualClass } from './dsoVisuals'
import { buildSelectionRingTexture } from './objectClassRenderer'
import type { SkyEngineDeepSkyClass } from './types'

interface DsoRenderEntry {
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

function buildDsoTextureSignature(entry: DirectProjectedObjectEntry) {
  return [entry.object.id, entry.object.colorHex, entry.object.source, resolveDeepSkyVisualClass(entry.object)].join(':')
}

function drawSoftGlow(
  context: CanvasRenderingContext2D,
  red: number,
  green: number,
  blue: number,
  outerRadius: number,
  scaleX = 1,
  scaleY = 1,
) {
  context.save()
  context.translate(96, 96)
  context.scale(scaleX, scaleY)
  const haze = context.createRadialGradient(0, 0, 18, 0, 0, outerRadius)
  haze.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.34)`)
  haze.addColorStop(0.55, `rgba(${red}, ${green}, ${blue}, 0.14)`)
  haze.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
  context.fillStyle = haze
  context.beginPath()
  context.arc(0, 0, outerRadius, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawGalaxyTexture(context: CanvasRenderingContext2D, red: number, green: number, blue: number) {
  drawSoftGlow(context, red, green, blue, 64, 1.34, 0.82)

  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.88)`
  context.lineWidth = 6
  context.beginPath()
  context.ellipse(96, 96, 62, 38, 0, 0, Math.PI * 2)
  context.stroke()

  context.lineWidth = 3
  context.beginPath()
  context.ellipse(96, 96, 42, 24, 0, 0, Math.PI * 2)
  context.stroke()

  context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.92)`
  context.beginPath()
  context.arc(96, 96, 14, 0, Math.PI * 2)
  context.fill()

  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.24)`
  context.lineWidth = 4
  context.beginPath()
  context.moveTo(48, 102)
  context.lineTo(144, 92)
  context.stroke()
}

function drawNebulaTexture(context: CanvasRenderingContext2D, red: number, green: number, blue: number) {
  drawSoftGlow(context, red, green, blue, 70, 1.08, 1.02)

  context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.22)`
  context.beginPath()
  context.moveTo(42, 102)
  context.bezierCurveTo(52, 58, 84, 38, 124, 46)
  context.bezierCurveTo(154, 54, 168, 84, 152, 120)
  context.bezierCurveTo(138, 154, 92, 166, 58, 144)
  context.bezierCurveTo(36, 130, 30, 118, 42, 102)
  context.closePath()
  context.fill()

  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.84)`
  context.lineWidth = 5
  context.beginPath()
  context.moveTo(42, 102)
  context.bezierCurveTo(52, 58, 84, 38, 124, 46)
  context.bezierCurveTo(154, 54, 168, 84, 152, 120)
  context.bezierCurveTo(138, 154, 92, 166, 58, 144)
  context.bezierCurveTo(36, 130, 30, 118, 42, 102)
  context.closePath()
  context.stroke()

  context.lineWidth = 3
  context.beginPath()
  context.moveTo(64, 70)
  context.lineTo(128, 70)
  context.moveTo(54, 124)
  context.lineTo(122, 136)
  context.stroke()
}

function drawClusterTexture(context: CanvasRenderingContext2D, red: number, green: number, blue: number) {
  drawSoftGlow(context, red, green, blue, 62)

  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.88)`
  context.lineWidth = 5
  context.strokeRect(46, 46, 100, 100)

  context.beginPath()
  context.arc(96, 96, 34, 0, Math.PI * 2)
  context.stroke()

  context.lineWidth = 4
  context.beginPath()
  context.moveTo(96, 58)
  context.lineTo(96, 134)
  context.moveTo(58, 96)
  context.lineTo(134, 96)
  context.stroke()

  context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.94)`
  ;[
    [72, 78, 4],
    [116, 74, 3.5],
    [128, 106, 4],
    [84, 118, 3.5],
    [104, 96, 4.5],
  ].forEach(([x, y, radius]) => {
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  })
}

function drawGenericTexture(context: CanvasRenderingContext2D, red: number, green: number, blue: number) {
  drawSoftGlow(context, red, green, blue, 64)

  context.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.88)`
  context.lineWidth = 6
  context.beginPath()
  context.moveTo(96, 24)
  context.lineTo(148, 96)
  context.lineTo(96, 168)
  context.lineTo(44, 96)
  context.closePath()
  context.stroke()

  context.beginPath()
  context.arc(96, 96, 28, 0, Math.PI * 2)
  context.stroke()
}

function buildDsoTexture(name: string, colorHex: string, visualClass: SkyEngineDeepSkyClass) {
  const texture = new DynamicTexture(name, { width: 192, height: 192 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const color = Color3.FromHexString(colorHex)
  const red = Math.round(color.r * 255)
  const green = Math.round(color.g * 255)
  const blue = Math.round(color.b * 255)
  context.clearRect(0, 0, 192, 192)

  if (visualClass === 'galaxy') {
    drawGalaxyTexture(context, red, green, blue)
  } else if (visualClass === 'nebula') {
    drawNebulaTexture(context, red, green, blue)
  } else if (visualClass === 'cluster') {
    drawClusterTexture(context, red, green, blue)
  } else {
    drawGenericTexture(context, red, green, blue)
  }

  texture.update()

  return texture
}

function createDsoEntry(scene: Scene, entry: DirectProjectedObjectEntry): DsoRenderEntry {
  const texture = buildDsoTexture(
    `sky-engine-dso-${entry.object.id}`,
    entry.object.colorHex,
    resolveDeepSkyVisualClass(entry.object),
  )
  texture.hasAlpha = true

  const mesh = MeshBuilder.CreatePlane(`sky-engine-dso-mesh-${entry.object.id}`, { width: 1, height: 1 }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = 1

  const material = new StandardMaterial(`sky-engine-dso-material-${entry.object.id}`, scene)
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
    signature: buildDsoTextureSignature(entry),
  }
}

function createSelectionRing(scene: Scene): SelectionRingEntry {
  const texture = buildSelectionRingTexture('sky-engine-dso-selection-ring', '#d8c4ff', 0.9, 0.24)
  texture.hasAlpha = true

  const mesh = MeshBuilder.CreatePlane('sky-engine-dso-selection-ring-mesh', { width: 1, height: 1 }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = 2

  const material = new StandardMaterial('sky-engine-dso-selection-ring-material', scene)
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

function disposeDsoEntry(entry: DsoRenderEntry) {
  entry.mesh.dispose()
  entry.material.dispose()
  entry.texture.dispose()
}

export function createDsoRenderer(scene: Scene) {
  const entries = new Map<string, DsoRenderEntry>()
  const selectionRing = createSelectionRing(scene)

  return {
    sync(
      projectedDsos: readonly DirectProjectedObjectEntry[],
      viewportWidth: number,
      viewportHeight: number,
      selectedObjectId: string | null,
    ) {
      if (projectedDsos.length === 0 && entries.size === 0) {
        selectionRing.mesh.isVisible = false
        return
      }

      const nextIds = new Set(projectedDsos.map((entry) => entry.object.id))

      Array.from(entries.keys()).forEach((objectId) => {
        if (nextIds.has(objectId)) {
          return
        }

        const entry = entries.get(objectId)

        if (!entry) {
          return
        }

        disposeDsoEntry(entry)
        entries.delete(objectId)
      })

      let selectedEntry: DirectProjectedObjectEntry | null = null

      projectedDsos.forEach((projectedDso) => {
        let entry = entries.get(projectedDso.object.id)

        if (!entry) {
          entry = createDsoEntry(scene, projectedDso)
          entries.set(projectedDso.object.id, entry)
        }

        const nextSignature = buildDsoTextureSignature(projectedDso)
        if (entry.signature !== nextSignature) {
          entry.texture.dispose()
          entry.texture = buildDsoTexture(
            `sky-engine-dso-${projectedDso.object.id}`,
            projectedDso.object.colorHex,
            resolveDeepSkyVisualClass(projectedDso.object),
          )
          entry.texture.hasAlpha = true
          entry.material.diffuseTexture = entry.texture
          entry.material.opacityTexture = entry.texture
          entry.signature = nextSignature
        }

        const isSelected = projectedDso.object.id === selectedObjectId
        const markerDimensions = getDeepSkyMarkerDimensionsPx(projectedDso.object, projectedDso.markerRadiusPx)
        const widthPx = markerDimensions.widthPx * (isSelected ? 1.12 : 1)
        const heightPx = markerDimensions.heightPx * (isSelected ? 1.12 : 1)

        entry.mesh.position.copyFrom(toViewportPlanePosition(projectedDso, viewportWidth, viewportHeight))
        entry.mesh.scaling.set(widthPx, heightPx, 1)
        entry.mesh.isVisible = projectedDso.renderAlpha > 0.001
        entry.material.emissiveColor = Color3.FromHexString(projectedDso.object.colorHex).scale(isSelected ? 1.04 : 0.92)
        entry.material.alpha = clamp(projectedDso.renderAlpha + (isSelected ? 0.08 : 0), 0, 1)

        if (isSelected) {
          selectedEntry = projectedDso
        }
      })

      if (!selectedEntry) {
        selectionRing.mesh.isVisible = false
        return
      }

      const finalSelectedEntry = selectedEntry as DirectProjectedObjectEntry
      selectionRing.mesh.isVisible = true
      selectionRing.mesh.position.copyFrom(toViewportPlanePosition(finalSelectedEntry, viewportWidth, viewportHeight))
      const markerDimensions = getDeepSkyMarkerDimensionsPx(finalSelectedEntry.object, finalSelectedEntry.markerRadiusPx)
      const selectionDiameter = Math.max(28, Math.max(markerDimensions.widthPx, markerDimensions.heightPx) + 20)
      selectionRing.mesh.scaling.set(selectionDiameter, selectionDiameter, 1)
      selectionRing.material.alpha = clamp(0.68 + finalSelectedEntry.renderAlpha * 0.2, 0, 0.94)
    },

    dispose() {
      entries.forEach((entry) => {
        disposeDsoEntry(entry)
      })
      entries.clear()
      selectionRing.mesh.dispose()
      selectionRing.material.dispose()
      selectionRing.texture.dispose()
    },
  }
}
