import type { SkyEngineObserver } from '../../../types'

export class SkyObserverService {
  private observer: SkyEngineObserver

  constructor(initialObserver: SkyEngineObserver) {
    this.observer = initialObserver
  }

  syncObserver(observer: SkyEngineObserver) {
    this.observer = observer
  }

  /**
   * Placeholder for Stellarium `observer_update` (ERFA / refraction / mount internals).
   * Props-driven fields are applied in `syncObserver`; this hook is for future parity.
   */
  frameTick() {}

  getObserver() {
    return this.observer
  }
}
