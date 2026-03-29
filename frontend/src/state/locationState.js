import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

let locationStore

function ensureLocationStore(initialActive) {
  if (!locationStore) {
    locationStore = createStore((set, get) => ({
      activeLocation: initialActive || null,
      pendingLocation: null,
      setActiveLocation: (loc) => set({ activeLocation: loc }),
      setPending: (loc) => set({ pendingLocation: loc }),
      confirmPending: () => {
        const pending = get().pendingLocation
        if (!pending) return
        set({ activeLocation: pending, pendingLocation: null })
      },
      clearPending: () => set({ pendingLocation: null }),
    }))
  }
  return locationStore
}

export default function useLocationState(initialActive) {
  const store = ensureLocationStore(initialActive)
  const activeLocation = useStore(store, (s) => s.activeLocation)
  const pendingLocation = useStore(store, (s) => s.pendingLocation)
  const setActiveLocation = useStore(store, (s) => s.setActiveLocation)
  const setPending = useStore(store, (s) => s.setPending)
  const confirmPending = useStore(store, (s) => s.confirmPending)
  const clearPending = useStore(store, (s) => s.clearPending)

  return {
    activeLocation,
    setActiveLocation,
    pendingLocation,
    setPending,
    confirmPending,
    clearPending,
  }
}
