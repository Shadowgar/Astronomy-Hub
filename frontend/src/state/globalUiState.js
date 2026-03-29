import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

const globalUiStore = createStore((set) => ({
  activeScope: null,
  activeEngine: null,
  activeFilter: null,
  selectedObjectId: null,
  activeSceneState: { status: 'idle' },
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
