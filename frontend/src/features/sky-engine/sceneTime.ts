import { useCallback, useMemo, useState } from 'react'

export const SKY_ENGINE_MIN_SCENE_HOUR_OFFSET = -24
export const SKY_ENGINE_MAX_SCENE_HOUR_OFFSET = 24
export const SKY_ENGINE_SCENE_HOUR_STEP = 1

export function buildSceneTimestampFromHourOffset(baseTimestampIso: string, hourOffset: number) {
  return new Date(new Date(baseTimestampIso).getTime() + hourOffset * 60 * 60 * 1000).toISOString()
}

export function formatSceneTimestamp(timestampIso: string) {
  return new Date(timestampIso).toUTCString()
}

export function formatSceneHourOffset(hourOffset: number) {
  if (hourOffset === 0) {
    return 'Base time'
  }

  return `${hourOffset > 0 ? '+' : ''}${hourOffset}h`
}

export function useSkyEngineSceneTime(initialTimestampIso: string) {
  const [sceneHourOffset, setSceneHourOffset] = useState(0)

  const sceneTimestampIso = useMemo(
    () => buildSceneTimestampFromHourOffset(initialTimestampIso, sceneHourOffset),
    [initialTimestampIso, sceneHourOffset],
  )

  const formattedSceneTimestamp = useMemo(
    () => formatSceneTimestamp(sceneTimestampIso),
    [sceneTimestampIso],
  )

  const formattedSceneHourOffset = useMemo(
    () => formatSceneHourOffset(sceneHourOffset),
    [sceneHourOffset],
  )

  const resetSceneTime = useCallback(() => {
    setSceneHourOffset(0)
  }, [])

  return {
    sceneTimestampIso,
    sceneHourOffset,
    formattedSceneTimestamp,
    formattedSceneHourOffset,
    setSceneHourOffset,
    resetSceneTime,
  }
}