import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

const UI_STATE_STORAGE_KEY = 'astronomyHub.globalUiState'

function readPersistedUiState() {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) return {}
  try {
    const raw = globalThis.localStorage.getItem(UI_STATE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return {
      activeScope: parsed.activeScope ?? null,
      activeEngine: parsed.activeEngine ?? null,
      activeFilter: parsed.activeFilter ?? null,
      selectedObjectId: parsed.selectedObjectId ?? null,
      activeSceneState: parsed.activeSceneState ?? { status: 'idle' },
    }
  } catch {
    return {}
  }
}

function persistUiState(state) {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) return
  const payload = {
    activeScope: state.activeScope ?? null,
    activeEngine: state.activeEngine ?? null,
    activeFilter: state.activeFilter ?? null,
    selectedObjectId: state.selectedObjectId ?? null,
    activeSceneState: state.activeSceneState ?? { status: 'idle' },
  }
  try {
    globalThis.localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore persistence errors (quota/privacy mode)
  }
}

const persistedState = readPersistedUiState()

const globalUiStore = createStore((set) => ({
  activeScope: persistedState.activeScope ?? null,
  activeEngine: persistedState.activeEngine ?? null,
  activeFilter: persistedState.activeFilter ?? null,
  selectedObjectId: persistedState.selectedObjectId ?? null,
  activeSceneState: persistedState.activeSceneState ?? { status: 'idle' },
  uiToggles: {},
  setActiveScope: (activeScope) => set({ activeScope }),
  setActiveEngine: (activeEngine) => set({ activeEngine }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setSelectedObjectId: (selectedObjectId) => set({ selectedObjectId }),
  setActiveSceneState: (activeSceneState) => set({ activeSceneState }),
  setUiToggle: (key, value) =>
    set((state) => ({
      uiToggles: {
        ...state.uiToggles,
        [key]: value,
      },
    })),
}))

globalUiStore.subscribe((state) => {
  persistUiState(state)
})

export default function useGlobalUiState() {
  const activeScope = useStore(globalUiStore, (s) => s.activeScope)
  const activeEngine = useStore(globalUiStore, (s) => s.activeEngine)
  const activeFilter = useStore(globalUiStore, (s) => s.activeFilter)
  const selectedObjectId = useStore(globalUiStore, (s) => s.selectedObjectId)
  const activeSceneState = useStore(globalUiStore, (s) => s.activeSceneState)
  const uiToggles = useStore(globalUiStore, (s) => s.uiToggles)
  const setActiveScope = useStore(globalUiStore, (s) => s.setActiveScope)
  const setActiveEngine = useStore(globalUiStore, (s) => s.setActiveEngine)
  const setActiveFilter = useStore(globalUiStore, (s) => s.setActiveFilter)
  const setSelectedObjectId = useStore(globalUiStore, (s) => s.setSelectedObjectId)
  const setActiveSceneState = useStore(globalUiStore, (s) => s.setActiveSceneState)
  const setUiToggle = useStore(globalUiStore, (s) => s.setUiToggle)

  return {
    activeScope,
    activeEngine,
    activeFilter,
    selectedObjectId,
    activeSceneState,
    uiToggles,
    setActiveScope,
    setActiveEngine,
    setActiveFilter,
    setSelectedObjectId,
    setActiveSceneState,
    setUiToggle,
  }
}
