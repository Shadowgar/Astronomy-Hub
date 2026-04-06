import { useCallback, useMemo, useState } from 'react'

import type { SkyEngineSceneObject } from './types'

export type SkyEngineSelectionStatus = 'idle' | 'active' | 'hidden'

interface SkyEngineSelectionSnapshot {
  objectId: string
  objectName: string
}

export function useSkyEngineSelection(objects: readonly SkyEngineSceneObject[]) {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [selectionSnapshot, setSelectionSnapshot] = useState<SkyEngineSelectionSnapshot | null>(null)

  const selectedObject = useMemo(
    () => objects.find((object) => object.id === selectedObjectId) ?? null,
    [objects, selectedObjectId],
  )

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