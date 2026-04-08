import type { SkyEngineObserver } from '../../../types'

export class SkyObserverService {
  private observer: SkyEngineObserver

  constructor(initialObserver: SkyEngineObserver) {
    this.observer = initialObserver
  }

  syncObserver(observer: SkyEngineObserver) {
    this.observer = observer
  }

  getObserver() {
    return this.observer
  }
}
