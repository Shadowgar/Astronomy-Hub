import { useCallback, useMemo, useState } from 'react'

import type { SkyEngineSceneObject } from './types'

export function useSkyEngineSelection(objects: readonly SkyEngineSceneObject[]) {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)

  const selectedObject = useMemo(
    () => objects.find((object) => object.id === selectedObjectId) ?? null,
    [objects, selectedObjectId],
  )

  const selectObject = useCallback((objectId: string | null) => {
    setSelectedObjectId(objectId)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedObjectId(null)
  }, [])

  return {
    selectedObjectId,
    selectedObject,
    selectObject,
    clearSelection,
  }
}