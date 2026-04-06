import { useCallback, useMemo, useState } from 'react'

export type SkyEngineSceneTimeAction = 'now' | 'minus_hour' | 'plus_hour' | 'minus_day' | 'plus_day'

export interface SkyEngineSceneTimeControl {
  action: SkyEngineSceneTimeAction
  label: string
}

export const SKY_ENGINE_SCENE_TIME_CONTROLS: readonly SkyEngineSceneTimeControl[] = [
  { action: 'now', label: 'Now' },
  { action: 'minus_hour', label: '-1 hour' },
  { action: 'plus_hour', label: '+1 hour' },
  { action: 'minus_day', label: '-1 day' },
  { action: 'plus_day', label: '+1 day' },
] as const

function offsetTimestamp(timestampIso: string, offsetMs: number) {
  return new Date(new Date(timestampIso).getTime() + offsetMs).toISOString()
}

export function applySceneTimeAction(
  timestampIso: string,
  action: SkyEngineSceneTimeAction,
  nowProvider: () => Date = () => new Date(),
) {
  switch (action) {
    case 'now':
      return nowProvider().toISOString()
    case 'minus_hour':
      return offsetTimestamp(timestampIso, -60 * 60 * 1000)
    case 'plus_hour':
      return offsetTimestamp(timestampIso, 60 * 60 * 1000)
    case 'minus_day':
      return offsetTimestamp(timestampIso, -24 * 60 * 60 * 1000)
    case 'plus_day':
      return offsetTimestamp(timestampIso, 24 * 60 * 60 * 1000)
    default:
      return timestampIso
  }
}

export function formatSceneTimestamp(timestampIso: string) {
  return new Date(timestampIso).toUTCString()
}

export function useSkyEngineSceneTime(initialTimestampIso: string) {
  const [sceneTimestampIso, setSceneTimestampIso] = useState(initialTimestampIso)

  const applyTimeAction = useCallback((action: SkyEngineSceneTimeAction) => {
    setSceneTimestampIso((currentTimestampIso) => applySceneTimeAction(currentTimestampIso, action))
  }, [])

  const formattedSceneTimestamp = useMemo(
    () => formatSceneTimestamp(sceneTimestampIso),
    [sceneTimestampIso],
  )

  return {
    sceneTimestampIso,
    formattedSceneTimestamp,
    applyTimeAction,
  }
}