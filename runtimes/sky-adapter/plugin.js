// Qualified existing SWE extension hook. This adapter stays inside its frame.
export default {
  onEngineReady(app) {
    window.orasSkyAdapter = {
      observer: app.$stel.core.observer,
      stop() { app.$stel.core.time_speed = 0 }
    }
    if (new URLSearchParams(location.search).get('orasEmbedded') === '1') {
      const style = document.createElement('style')
      style.textContent = '#toolbar-image .tbtitle{display:none}'
      document.head.appendChild(style)
    }
    window.dispatchEvent(new Event('oras-sky-ready'))
  }
}
