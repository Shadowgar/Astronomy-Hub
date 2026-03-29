import { useEffect, useState } from 'react'

const MODE_OPTIONS = ['Light', 'Dark', 'Red']
const THEME_CLASSES = ['theme-light', 'theme-light-hc', 'theme-dark', 'theme-dark-hc', 'theme-red']

function mapModeToThemeClass(mode) {
  if (mode === 'Light') return 'theme-light'
  if (mode === 'Dark') return 'theme-dark'
  if (mode === 'Red') return 'theme-red'
  return 'theme-light'
}

function mapThemeClassToBase(themeClass) {
  if (!themeClass) return 'Light'
  if (themeClass === 'theme-red') return 'Red'
  if (themeClass.startsWith('theme-light')) return 'Light'
  if (themeClass.startsWith('theme-dark')) return 'Dark'
  return 'Light'
}

export function useDisplayModeState() {
  const [mode, setMode] = useState(() => {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const stored = globalThis.localStorage.getItem('astronomyHub.mode')
      if (MODE_OPTIONS.includes(stored)) return stored
      if (typeof stored === 'string') return mapThemeClassToBase(stored)
    }
    return 'Light'
  })

  useEffect(() => {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const currentStored = globalThis.localStorage.getItem('astronomyHub.mode')
      if (!(THEME_CLASSES.includes(currentStored) && mapThemeClassToBase(currentStored) === mode)) {
        globalThis.localStorage.setItem('astronomyHub.mode', mode)
      }
    }
  }, [mode])

  useEffect(() => {
    let themeClass = mapModeToThemeClass(mode)
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const stored = globalThis.localStorage.getItem('astronomyHub.mode')
      if (THEME_CLASSES.includes(stored)) {
        themeClass = stored
      }
    }

    const root = (typeof document !== 'undefined' && (document.documentElement || document.body))
    if (root) {
      THEME_CLASSES.forEach((c) => root.classList.remove(c))
      root.classList.add(themeClass)
    }
  }, [mode])

  return {
    mode,
    setMode,
    MODES: MODE_OPTIONS,
  }
}

export default useDisplayModeState
