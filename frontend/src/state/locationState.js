import { useState, useCallback } from 'react'

// Minimal in-memory location state hook for Phase 2 Step 2D.D3.
// Keeps an `activeLocation` and a `pendingLocation` in React state.
export default function useLocationState(initialActive) {
  const [activeLocation, setActiveLocation] = useState(initialActive)
  const [pendingLocation, setPendingLocation] = useState(null)

  const setPending = useCallback((loc) => {
    setPendingLocation(loc)
  }, [])

  const confirmPending = useCallback(() => {
    setActiveLocation((_) => pendingLocation)
    setPendingLocation(null)
  }, [pendingLocation])

  const clearPending = useCallback(() => setPendingLocation(null), [])

  return {
    activeLocation,
    setActiveLocation,
    pendingLocation,
    setPending,
    confirmPending,
    clearPending,
  }
}
