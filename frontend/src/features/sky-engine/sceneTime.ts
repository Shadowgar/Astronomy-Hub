import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

export const SKY_ENGINE_LOCAL_TIME_ZONE = 'America/New_York'
export const SKY_ENGINE_MAX_SCENE_OFFSET_SECONDS = 14 * 24 * 60 * 60

export const SKY_ENGINE_TIME_SCALE_OPTIONS = [
  { id: 'seconds', label: 'Seconds', shortLabel: 'sec', stepSeconds: 1 },
  { id: 'minutes', label: 'Minutes', shortLabel: 'min', stepSeconds: 60 },
  { id: 'hours', label: 'Hours', shortLabel: 'hr', stepSeconds: 60 * 60 },
  { id: 'days', label: 'Days', shortLabel: 'day', stepSeconds: 24 * 60 * 60 },
] as const

export const SKY_ENGINE_PLAYBACK_RATE_OPTIONS = [
  { value: -3600, label: '-1h/s' },
  { value: -60, label: '-1m/s' },
  { value: 0, label: 'Pause' },
  { value: 1, label: '1x' },
  { value: 60, label: '+1m/s' },
  { value: 3600, label: '+1h/s' },
] as const

export type SkyEngineTimeScaleId = (typeof SKY_ENGINE_TIME_SCALE_OPTIONS)[number]['id']

function clampSceneOffsetSeconds(value: number) {
  return Math.max(-SKY_ENGINE_MAX_SCENE_OFFSET_SECONDS, Math.min(SKY_ENGINE_MAX_SCENE_OFFSET_SECONDS, value))
}

function formatOffsetUnit(value: number, suffix: string) {
  return `${value >= 0 ? '+' : '-'}${Math.abs(value)}${suffix}`
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

export function formatSceneOffset(offsetSeconds: number) {
  const roundedOffsetSeconds = Math.round(offsetSeconds)

  if (roundedOffsetSeconds === 0) {
    return 'Now'
  }

  const sign = roundedOffsetSeconds > 0 ? '+' : '-'
  const absoluteSeconds = Math.abs(roundedOffsetSeconds)
  const days = Math.floor(absoluteSeconds / 86400)
  const hours = Math.floor((absoluteSeconds % 86400) / 3600)
  const minutes = Math.floor((absoluteSeconds % 3600) / 60)
  const seconds = absoluteSeconds % 60
  const parts: string[] = []

  if (days > 0) {
    parts.push(`${days}d`)
  }

  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`)
  }

  if (minutes > 0 || days > 0 || hours > 0) {
    parts.push(`${minutes}m`)
  }

  if (seconds > 0 && days === 0) {
    parts.push(`${seconds}s`)
  }

  return `${sign}${parts.join(' ')}`
}

export function formatSceneScaleOffset(offsetSeconds: number, scaleId: SkyEngineTimeScaleId) {
  const roundedOffsetSeconds = Math.round(offsetSeconds)

  if (scaleId === 'seconds') {
    return formatOffsetUnit(roundedOffsetSeconds, 's')
  }

  if (scaleId === 'minutes') {
    return formatOffsetUnit(Math.round(roundedOffsetSeconds / 60), 'm')
  }

  if (scaleId === 'hours') {
    return formatOffsetUnit(Number((roundedOffsetSeconds / 3600).toFixed(1)), 'h')
  }

  return formatOffsetUnit(Number((roundedOffsetSeconds / 86400).toFixed(1)), 'd')
}

export function getPlaybackRateLabel(playbackRate: number) {
  const playbackOption = SKY_ENGINE_PLAYBACK_RATE_OPTIONS.find((option) => option.value === playbackRate)
  return playbackOption?.label ?? `${playbackRate > 0 ? '+' : ''}${playbackRate}x`
}

function toSceneTimestampIso(timestampMs: number) {
  return new Date(timestampMs).toISOString()
}

export function useSkyEngineSceneTime() {
  const [sceneBaseTimestampMs, setSceneBaseTimestampMs] = useState(() => Date.now())
  const [sceneOffsetSeconds, setSceneOffsetSecondsInternal] = useReducer(
    (currentValue: number, nextValue: number | ((currentValue: number) => number)) => {
      const resolvedValue = typeof nextValue === 'function' ? nextValue(currentValue) : nextValue
      return clampSceneOffsetSeconds(resolvedValue)
    },
    0,
  )
  const [timeScaleId, setTimeScaleId] = useState<SkyEngineTimeScaleId>('minutes')
  const [playbackRate, setPlaybackRate] = useState(1)
  const lastNonZeroPlaybackRate = useRef(1)
  const lastAnimationTimestampRef = useRef<number | null>(null)

  useEffect(() => {
    if (playbackRate !== 0) {
      lastNonZeroPlaybackRate.current = playbackRate
    }
  }, [playbackRate])

  useEffect(() => {
    if (playbackRate === 0) {
      lastAnimationTimestampRef.current = null
      return undefined
    }

    let frameHandle = 0
    const animate = (timestamp: number) => {
      const lastTimestamp = lastAnimationTimestampRef.current ?? timestamp
      const elapsedSeconds = (timestamp - lastTimestamp) / 1000
      lastAnimationTimestampRef.current = timestamp

      setSceneOffsetSecondsInternal((currentValue) => {
        const nextValue = clampSceneOffsetSeconds(currentValue + elapsedSeconds * playbackRate)

        if (Math.abs(nextValue) >= SKY_ENGINE_MAX_SCENE_OFFSET_SECONDS) {
          setPlaybackRate(0)
        }

        return nextValue
      })

      frameHandle = globalThis.requestAnimationFrame(animate)
    }

    frameHandle = globalThis.requestAnimationFrame(animate)

    return () => {
      globalThis.cancelAnimationFrame(frameHandle)
      lastAnimationTimestampRef.current = null
    }
  }, [playbackRate])

  const selectedTimeScale = useMemo(
    () => SKY_ENGINE_TIME_SCALE_OPTIONS.find((option) => option.id === timeScaleId) ?? SKY_ENGINE_TIME_SCALE_OPTIONS[1],
    [timeScaleId],
  )

  const sceneTimestampIso = useMemo(
    () => toSceneTimestampIso(sceneBaseTimestampMs + sceneOffsetSeconds * 1000),
    [sceneBaseTimestampMs, sceneOffsetSeconds],
  )

  const formattedSceneLocalTimestamp = useMemo(
    () => formatSceneLocalTimestamp(sceneTimestampIso),
    [sceneTimestampIso],
  )

  const formattedSceneUtcTimestamp = useMemo(
    () => formatSceneUtcTimestamp(sceneTimestampIso),
    [sceneTimestampIso],
  )

  const formattedSceneOffset = useMemo(
    () => formatSceneOffset(sceneOffsetSeconds),
    [sceneOffsetSeconds],
  )

  const formattedScaleOffset = useMemo(
    () => formatSceneScaleOffset(sceneOffsetSeconds, timeScaleId),
    [sceneOffsetSeconds, timeScaleId],
  )

  const playbackRateLabel = useMemo(
    () => getPlaybackRateLabel(playbackRate),
    [playbackRate],
  )

  const setSceneOffsetSeconds = useCallback((nextValue: number) => {
    setSceneOffsetSecondsInternal(nextValue)
  }, [])

  const nudgeSceneOffset = useCallback((deltaSeconds: number) => {
    setSceneOffsetSecondsInternal((currentValue) => currentValue + deltaSeconds)
  }, [])

  const togglePlayback = useCallback(() => {
    setPlaybackRate((currentRate) => {
      if (currentRate === 0) {
        return lastNonZeroPlaybackRate.current
      }

      return 0
    })
  }, [])

  const resetSceneTime = useCallback(() => {
    setSceneBaseTimestampMs(Date.now())
    setPlaybackRate(1)
    setSceneOffsetSecondsInternal(0)
  }, [])

  return {
    sceneTimestampIso,
    sceneOffsetSeconds,
    formattedSceneLocalTimestamp,
    formattedSceneUtcTimestamp,
    formattedSceneOffset,
    formattedScaleOffset,
    sliderMin: -SKY_ENGINE_MAX_SCENE_OFFSET_SECONDS,
    sliderMax: SKY_ENGINE_MAX_SCENE_OFFSET_SECONDS,
    sliderStep: selectedTimeScale.stepSeconds,
    timeScaleId,
    selectedTimeScale,
    playbackRate,
    playbackRateLabel,
    isPlaying: playbackRate !== 0,
    setTimeScaleId,
    setPlaybackRate,
    setSceneOffsetSeconds,
    nudgeSceneOffset,
    togglePlayback,
    resetSceneTime,
  }
}