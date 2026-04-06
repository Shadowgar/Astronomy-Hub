import { useCallback, useMemo, useState } from 'react'

export const SKY_ENGINE_MIN_SCENE_HOUR_OFFSET = -24
export const SKY_ENGINE_MAX_SCENE_HOUR_OFFSET = 24
export const SKY_ENGINE_SCENE_HOUR_STEP = 1
export const SKY_ENGINE_LOCAL_TIME_ZONE = 'America/New_York'

export function buildSceneTimestampFromHourOffset(baseTimestampIso: string, hourOffset: number) {
  return new Date(new Date(baseTimestampIso).getTime() + hourOffset * 60 * 60 * 1000).toISOString()
}

export function formatSceneLocalTimestamp(timestampIso: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: SKY_ENGINE_LOCAL_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(timestampIso))
}

export function formatSceneUtcTimestamp(timestampIso: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).format(new Date(timestampIso))
}

export function formatSceneHourOffset(hourOffset: number) {
  if (hourOffset === 0) {
    return 'Now'
  }

  return `${hourOffset > 0 ? '+' : ''}${hourOffset}h`
}

export function useSkyEngineSceneTime(initialTimestampIso: string) {
  const [sceneHourOffset, setSceneHourOffset] = useState(0)

  const sceneTimestampIso = useMemo(
    () => buildSceneTimestampFromHourOffset(initialTimestampIso, sceneHourOffset),
    [initialTimestampIso, sceneHourOffset],
  )

  const formattedSceneLocalTimestamp = useMemo(
    () => formatSceneLocalTimestamp(sceneTimestampIso),
    [sceneTimestampIso],
  )

  const formattedSceneUtcTimestamp = useMemo(
    () => formatSceneUtcTimestamp(sceneTimestampIso),
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
    formattedSceneLocalTimestamp,
    formattedSceneUtcTimestamp,
    formattedSceneHourOffset,
    setSceneHourOffset,
    resetSceneTime,
  }
}