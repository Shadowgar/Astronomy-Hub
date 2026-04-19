import { useCallback, useEffect, useMemo, useState } from 'react'

import type { SkyEngineSceneObject } from './types'

export type SkyEngineSelectionStatus = 'idle' | 'active' | 'hidden'

interface SkyEngineSelectionSnapshot {
  objectId: string
  objectName: string
  detailRoute?: string
}

export function resolveSelectedObjectWithDetailRoute(
  objects: readonly SkyEngineSceneObject[],
  selectedObjectId: string | null,
  selectionSnapshot: SkyEngineSelectionSnapshot | null,
): SkyEngineSceneObject | null {
  if (!selectedObjectId) {
    return null
  }

  const directMatch = objects.find((object) => object.id === selectedObjectId) ?? null
  if (directMatch) {
    return directMatch
  }

  const snapshotRoute = selectionSnapshot?.detailRoute
  if (!snapshotRoute) {
    return null
  }

  return objects.find((object) => object.detailRoute === snapshotRoute) ?? null
}

export function useSkyEngineSelection(objects: readonly SkyEngineSceneObject[]) {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [selectionSnapshot, setSelectionSnapshot] = useState<SkyEngineSelectionSnapshot | null>(null)

  const selectedObject = useMemo(
    () => resolveSelectedObjectWithDetailRoute(objects, selectedObjectId, selectionSnapshot),
    [objects, selectedObjectId, selectionSnapshot],
  )

  useEffect(() => {
    if (selectedObject && selectedObjectId && selectedObject.id !== selectedObjectId) {
      setSelectedObjectId(selectedObject.id)
    }
  }, [selectedObject, selectedObjectId])

  let selectionStatus: SkyEngineSelectionStatus = 'idle'

  if (selectedObject) {
    selectionStatus = 'active'
  } else if (selectedObjectId && selectionSnapshot) {
    selectionStatus = 'hidden'
  }

  const selectObject = useCallback((objectId: string | null) => {
    setSelectedObjectId(objectId)

    if (!objectId) {
      setSelectionSnapshot(null)
      return
    }

    const nextObject = objects.find((object) => object.id === objectId)

    if (nextObject) {
      setSelectionSnapshot({
        objectId: nextObject.id,
        objectName: nextObject.name,
        detailRoute: nextObject.detailRoute,
      })
    }
  }, [objects])

  const clearSelection = useCallback(() => {
    setSelectedObjectId(null)
    setSelectionSnapshot(null)
  }, [])

  return {
    selectedObjectId,
    selectedObject,
    selectionStatus,
    hiddenSelectionName: selectionSnapshot?.objectName ?? null,
    selectObject,
    clearSelection,
  }
}