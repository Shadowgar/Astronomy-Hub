// Qualified SWE extension hook. All scientific/scene work remains inside this frame.
import swh from '@/assets/sw_helpers.js'
import TargetSearch from '@/components/target-search.vue'
import BottomBar from '@/components/bottom-bar.vue'
import { installNativeWheel } from './native-wheel.mjs'
export default {
  guiComponents: [
    { name: 'oras-workspace-search', computed: { embedded () { return this.$store.state.orasEmbeddedPresentation } }, render (h) { return this.embedded ? h('div', { class: 'oras-workspace-search' }, [h(TargetSearch)]) : null } },
    {
      name: 'oras-workspace-bottom',
      extends: BottomBar,
      watch: { panel (value) { window.dispatchEvent(new CustomEvent('oras-sky-panel', { detail: !!value })) } },
      data () { return { panel: null, panelLauncher: null, fullscreenError: '' } },
      mounted () {
        this.fullscreenDocument = window.parent === window ? document : window.parent.document
        this.fullscreenChanged = () => this.onFullscreenChange(!!this.fullscreenDocument.fullscreenElement)
        // Cached pages retain their one listener; resume also seeds changes made while frozen.
        this.fullscreenPagehide = event => { if (!event.persisted) this.releaseFullscreen() }
        this.fullscreenDocument.addEventListener('fullscreenchange', this.fullscreenChanged)
        this.fullscreenChanged()
        window.addEventListener('pageshow', this.fullscreenChanged)
        window.addEventListener('oras-sky-dispose', this.releaseFullscreen)
        window.addEventListener('pagehide', this.fullscreenPagehide)
      },
      beforeDestroy () { this.releaseFullscreen() },
      computed: { embedded () { return this.$store.state.orasEmbeddedPresentation } },
      methods: {
        releaseFullscreen () { this.fullscreenDocument.removeEventListener('fullscreenchange', this.fullscreenChanged); window.removeEventListener('pageshow', this.fullscreenChanged); window.removeEventListener('oras-sky-dispose', this.releaseFullscreen); window.removeEventListener('pagehide', this.fullscreenPagehide) },
        async toggleFullscreen () {
          this.fullscreenError = ''
          if (window.parent === window) { this.setFullscreen(!this.$store.state.fullscreen); return }
          // Same-origin embedded presentation must keep the Hub Explore chrome visible.
          // Native SWE's store callback still owns the actual fullscreen state.
          try { const owner = this.fullscreenDocument; if (owner.fullscreenElement) await owner.exitFullscreen(); else await owner.documentElement.requestFullscreen() } catch (error) { this.fullscreenError = 'Fullscreen is unavailable in this browser.' }
        },
        dismiss () { if (!this.panel) return; this.panel = null; const launcher = this.panelLauncher; this.panelLauncher = null; this.$nextTick(() => { if (launcher && launcher.isConnected)launcher.focus() }) },
        openPanel (name, event) { if (this.panel === name) { this.dismiss(); return } this.panelLauncher = event.currentTarget; this.panel = name; this.$nextTick(() => this.$refs.close.focus()) }
      },
      render (h) {
        if (!this.embedded) return null
        const core = this.$stel.core; const state = this.$store.state.stel
        const toggle = (id, label, value, apply) => h('button', { class: 'as-control', attrs: { type: 'button', 'data-sky-control': id, 'aria-pressed': String(!!value) }, on: { click: () => apply(!value) } }, [h('span', [label]), h('span', { class: 'as-switch', attrs: { 'aria-hidden': 'true' } })])
        const titles = { constellations: 'Constellations', observing: 'Observing tools', display: 'Display' }
        const symbols = { constellations: '✧', observing: '◎', display: '◐' }
        let controls = []
        if (this.panel === 'constellations') {
          controls = [
            toggle('constellations', 'Constellations', state.constellations.lines_visible, b => { core.constellations.lines_visible = b; core.constellations.labels_visible = b }),
            toggle('art', 'Constellation Art', state.constellations.images_visible, b => { core.constellations.images_visible = b })]
        }
        if (this.panel === 'observing') {
          controls = [
            toggle('atmosphere', 'Atmosphere', state.atmosphere.visible, b => { core.atmosphere.visible = b }),
            toggle('landscape', 'Landscape', state.landscapes.visible, b => { core.landscapes.visible = b }),
            toggle('azimuthal', 'Azimuthal Grid', state.lines.azimuthal.visible, b => { core.lines.azimuthal.visible = b }),
            toggle('equatorial', 'Equatorial Grid', state.lines.equatorial_jnow.visible, b => { core.lines.equatorial_jnow.visible = b }),
            toggle('dsos', 'Deep Sky Objects', state.dsos.visible, b => { core.dsos.visible = b }),
            h('details', [h('summary', ['Advanced observing']), toggle('j2000', 'Equatorial J2000 Grid', state.lines.equatorial.visible, b => { core.lines.equatorial.visible = b }), h('button', { class: 'as-control', on: { click: () => this.$store.commit('setValue', { varName: 'showViewSettingsDialog', newValue: true }) } }, ['More native Sky settings'])])]
        }
        if (this.panel === 'display') {
          controls = [toggle('night', 'Night Mode', this.$store.state.nightmode, b => this.setNightMode(b)),
            h('button', { class: 'as-control', attrs: { type: 'button', 'data-sky-action': 'fullscreen' }, on: { click: this.toggleFullscreen } }, [this.$store.state.fullscreen ? 'Exit fullscreen' : 'Fullscreen', h('span', { attrs: { 'aria-hidden': 'true' } }, ['↗'])]), this.fullscreenError ? h('p', { attrs: { role: 'status' } }, [this.fullscreenError]) : null]
        }
        return h('div', { class: 'oras-workspace-bottom', on: { keydown: event => { if (event.key === 'Escape' && this.panel) { event.stopPropagation(); this.dismiss() } } } }, [
          h('nav', { class: 'as-native-rail as-glass', attrs: { 'aria-label': 'Sky observing tools' } }, Object.keys(titles).map(id => h('button', { attrs: { type: 'button', 'aria-label': titles[id], 'aria-expanded': String(this.panel === id), 'aria-controls': 'as-native-panel' }, on: { click: event => this.openPanel(id, event) } }, [h('span', { attrs: { 'aria-hidden': 'true' } }, [symbols[id]]), h('span', { class: 'as-tool-tip' }, [titles[id]])]))),
          this.panel ? h('section', { class: 'as-native-panel as-glass', attrs: { id: 'as-native-panel', 'aria-label': titles[this.panel] } }, [
            h('div', { class: 'as-native-heading' }, [h('div', [h('small', ['SKY VIEW']), h('h2', [titles[this.panel]])]), h('button', { ref: 'close', attrs: { type: 'button', 'aria-label': 'Close ' + titles[this.panel] }, on: { click: this.dismiss } }, ['×'])]), ...controls]) : null
        ])
      }
    },
    { name: 'oras-workspace-source', computed: { embedded () { return this.$store.state.orasEmbeddedPresentation } }, render (h) { return this.embedded ? h('button', { class: 'oras-workspace-source', attrs: { 'aria-label': 'Sky sources and survey credits' }, on: { click: () => this.$store.commit('setValue', { varName: 'showDataCreditsDialog', newValue: true }) } }, [h('span', { class: 'oras-credits-full' }, ['Illustrative Pennsylvania · not surveyed · Stellarium credits']), h('span', { class: 'oras-credits-compact' }, ['Illustrative Pennsylvania · not surveyed · credits'])]) : null } }
  ],
  onEngineReady (app) {
    let disposed = false; let selectionGeneration = 0; let nativeLandscape = null; let hasLandscape = false
    const set = (key, value) => app.$store.commit('setValue', { varName: key, newValue: value })
    const landscapeId = 'pennsylvania-woodland-v1'
    const neutral = () => {
      if (!app.$store.state.orasEmbeddedPresentation)return
      if (!hasLandscape) { app.$stel.core.landscapes.addDataSource({ url: '/oras-sky-engine/landscapes/' + landscapeId, key: landscapeId }); hasLandscape = true }
      app.$stel.core.landscapes.current_id = landscapeId
    }
    const presentation = (embedded, creditsAtTop = false) => {
      if (embedded && !app.$store.state.orasEmbeddedPresentation)nativeLandscape = app.$stel.core.landscapes.current_id
      document.documentElement.classList.toggle('oras-workspace-embedded', embedded)
      document.documentElement.classList.toggle('oras-credits-top', creditsAtTop)
      set('orasEmbeddedPresentation', embedded)
      if (embedded)neutral()
      else if (nativeLandscape && app.$stel.core.landscapes.current_id === landscapeId)app.$stel.core.landscapes.current_id = nativeLandscape
      for (const key of ['showMainToolBar', 'showLocationButton', 'showTimeButtons', 'showObservingPanelTabsButtons', 'showSelectedInfoButtons'])set(key, !embedded)
      if (embedded) { set('showSidePanel', false); set('showNavigationDrawer', false) }
    }
    const style = document.createElement('style')
    style.textContent = ".oras-workspace-embedded #toolbar-image,.oras-workspace-embedded #time-controls,.oras-workspace-embedded #location-button,.oras-workspace-embedded #selected-object-info,.oras-workspace-embedded .bottom-toolbar{display:none!important}\n.oras-workspace-embedded #stel{width:100%!important}.oras-workspace-embedded .v-main{padding:0!important}\n.oras-workspace-search,.oras-workspace-bottom,.oras-workspace-source{font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;color:#f4f5f7;pointer-events:auto}\n.as-glass,.oras-workspace-search{background:rgba(22,25,30,.88);border:1px solid rgba(228,235,244,.15);border-radius:18px;box-shadow:0 10px 32px #0003,inset 0 1px #ffffff08;backdrop-filter:blur(22px)}\n.oras-workspace-search{position:absolute;top:26px;left:50%;transform:translateX(-50%);width:min(440px,calc(100% - 540px));z-index:5;padding:0 16px;border-radius:16px;min-height:52px}\n.oras-workspace-search .v-input{padding-top:0;margin-top:0}.oras-workspace-search .v-input__slot{margin-bottom:0;min-height:50px}.oras-workspace-search .v-text-field__details{display:none}.oras-workspace-search input{font-size:13px;max-height:none}.oras-workspace-search .v-list{max-height:min(360px,40vh);overflow:auto;width:100%}\n.oras-workspace-bottom{z-index:4}.as-native-rail{position:absolute;right:28px;top:50%;transform:translateY(-50%);padding:6px;display:grid;gap:3px}\n.oras-workspace-bottom button{color:#f4f5f7;font:inherit;background:transparent;border:0;border-radius:10px;min-width:44px;min-height:44px;cursor:pointer}\n.as-native-rail button{width:48px;height:48px;font-size:23px}.as-native-rail button[aria-expanded=true]{color:#b9dcd4;background:#b9dcd413}.oras-workspace-bottom button:hover{background:#ffffff0d}\n.oras-workspace-bottom button:focus-visible,.oras-workspace-bottom summary:focus-visible,.oras-workspace-source:focus-visible{outline:2px solid #b9dcd4;outline-offset:3px}\n.as-tool-tip{position:absolute;right:66px;white-space:nowrap;padding:7px 12px;background:#16191e;border-radius:8px;font-size:12px;opacity:0;pointer-events:none}.as-native-rail button:hover .as-tool-tip,.as-native-rail button:focus-visible .as-tool-tip{opacity:1}\n.as-native-panel{position:absolute;right:100px;top:122px;width:320px;max-height:calc(100% - 205px);padding:22px;overflow:auto;overscroll-behavior:contain;z-index:6}.as-native-heading{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:17px}.as-native-heading small{font-size:10px;letter-spacing:.16em;color:#bac1cb}.as-native-heading h2{font-size:22px;letter-spacing:-.035em;font-weight:550;margin:4px 0 0}.as-native-heading button{font-size:24px;margin:-10px -10px 0 0}\n.as-control{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:10px 0;text-align:left;font-size:13px!important}.as-switch{width:30px;height:18px;border-radius:12px;background:#515966;position:relative;flex-shrink:0}.as-switch:after{content:'';position:absolute;width:12px;height:12px;background:#e8ecf2;border-radius:50%;left:3px;top:3px}[aria-pressed=true] .as-switch{background:#82b8ab}[aria-pressed=true] .as-switch:after{left:15px;background:#152a27}\n.as-native-panel details{border-top:1px solid #e4ebf426;margin-top:12px;padding-top:8px}.as-native-panel summary{min-height:44px;cursor:pointer;font-size:13px;padding:12px 0}.oras-workspace-source{position:absolute;bottom:16px;left:28px;z-index:4;min-height:44px;background:rgba(22,25,30,.88);border:1px solid #e4ebf426;border-radius:9px;font-size:10px;padding:0 10px;cursor:pointer}.oras-credits-compact{display:none}\n.oras-native-panel-open .oras-workspace-bottom,.oras-native-panel-open .oras-workspace-search,.oras-native-panel-open .oras-workspace-source{visibility:hidden;pointer-events:none}.oras-workspace-embedded .v-dialog .v-btn{min-height:44px;min-width:44px}\n@media(max-width:767px){.oras-workspace-search{top:94px;left:16px;right:16px;transform:none;width:auto;min-height:48px}.as-native-rail{right:16px;padding:4px}.as-native-rail button{width:44px;height:44px}.as-native-panel{top:auto;bottom:0;right:0;left:0;width:auto;max-height:calc(100% - 180px);padding:22px 22px calc(22px + env(safe-area-inset-bottom,0px));border-radius:22px 22px 0 0}.oras-workspace-source{bottom:0;left:16px;min-height:28px;font-size:9px;border:0;background:#16191ecc}.oras-credits-full{display:none}.oras-credits-compact{display:inline}.as-tool-tip{display:none}}\n@media(prefers-reduced-transparency:reduce){.as-glass,.oras-workspace-search{background:#16191e;backdrop-filter:none}}\n"
    style.textContent += '\nhtml.oras-sky-night #app,html.oras-sky-night #app *{color:#e6a19a!important;caret-color:#e6a19a!important;border-color:#71332e!important;outline-color:#e6a19a!important}\nhtml.oras-sky-night .as-glass,html.oras-sky-night .oras-workspace-search,html.oras-sky-night .oras-workspace-source,html.oras-sky-night .as-tool-tip,html.oras-sky-night .v-dialog,html.oras-sky-night .v-card,html.oras-sky-night .v-list,html.oras-sky-night .v-menu__content,html.oras-sky-night .v-tooltip__content,html.oras-sky-night .v-chip,html.oras-sky-night .secondary,html.oras-sky-night .primary,html.oras-sky-night .v-input__slot{background-color:#1c0806!important}\nhtml.oras-sky-night .as-switch{background:#54241f}html.oras-sky-night .as-switch:after{background:#e6a19a}html.oras-sky-night [aria-pressed=true] .as-switch{background:#9c493c}html.oras-sky-night [aria-pressed=true] .as-switch:after{background:#240704}\nhtml.oras-sky-night .as-native-rail button[aria-expanded=true],html.oras-sky-night .oras-workspace-bottom button:hover{background:#4b1712}\n'
    style.textContent += 'html.oras-sky-night #app *::selection{background:#602b22;color:#e6a19a}\n'
    document.head.appendChild(style)
    // Restore through the original native setting before reporting the new instance.
    if (new URLSearchParams(location.search).get('orasNightMode') === '1' && !app.$store.state.nightmode) BottomBar.methods.setNightMode.call(app, true)
    const stopNightWatch = app.$watch(() => !!app.$store.state.nightmode, enabled => { document.documentElement.classList.toggle('oras-sky-night', enabled); window.dispatchEvent(new CustomEvent('oras-sky-night-mode', { detail: enabled })) }, { immediate: true })
    const stopPanelWatch = app.$watch(() => !!(app.$store.state.showViewSettingsDialog || app.$store.state.showDataCreditsDialog), open => { document.documentElement.classList.toggle('oras-native-panel-open', open); window.dispatchEvent(new CustomEvent('oras-sky-panel', { detail: open || !!document.querySelector('.as-native-panel') })) })
    // Embedded scenery is illustrative, never a measured local horizon. Standalone keeps native choices.
    const stopLandscapeWatch = app.$watch(() => app.$store.state.stel.landscapes.current_id, id => {
      if (app.$store.state.orasEmbeddedPresentation && id && id !== landscapeId) { if (!nativeLandscape)nativeLandscape = id; neutral() }
    })
    const removeWheel = installNativeWheel(document.querySelector('#stel-canvas'), app.$stel, {
      enabled: () => !disposed && app.$store.state.orasEmbeddedPresentation,
      onBoundary: value => window.dispatchEvent(new CustomEvent('oras-navigation-intent', { detail: { target: 'earth', ...value } }))
    })
    const wheelPagehide = event => { removeWheel.reset(); if (!event.persisted)removeWheel() }
    window.addEventListener('pagehide', wheelPagehide)
    presentation(new URLSearchParams(location.search).get('orasEmbedded') === '1')
    window.orasSkyAdapter = {
      observer: app.$stel.core.observer,
      nightMode () { return !!app.$store.state.nightmode },
      tools () { set('showViewSettingsDialog', true); return { ok: true } },
      panelOpen () { return !!(app.$store.state.showViewSettingsDialog || app.$store.state.showDataCreditsDialog) },
      stop () { window.dispatchEvent(new Event('oras-sky-dispose')); stopPanelWatch(); stopNightWatch(); stopLandscapeWatch(); removeWheel(); window.removeEventListener('pagehide', wheelPagehide); disposed = true; ++selectionGeneration; app.$stel.core.time_speed = 0 },
      resetNavigation () { removeWheel.reset(); return { ok: true } },
      navigation () {
        const core = app.$stel.core; const o = core.observer; const observer = { lat: o.latitude * 180 / Math.PI, lon: o.longitude * 180 / Math.PI, elevationM: o.elevation }
        const source = new URLSearchParams(location.search).get('elevationSource')
        const elevationSource = source === 'unavailable-zero' ? source : Math.abs(observer.lat - 41.321903) < 1e-6 && Math.abs(observer.lon + 79.585394) < 1e-6 && observer.elevationM === 432.816 ? 'oras-site' : 'provided'
        return { mode: 'sky', observer, elevationSource, utc: new Date(Math.round((o.utc - 40587) * 86400000)).toISOString(), live: core.time_speed !== 0, camera: { projection: core.projection, fovRad: core.fov, yawRad: o.yaw, pitchRad: o.pitch, rollRad: o.roll, landscapeVisible: core.landscapes.visible } }
      },
      restoreView (camera) { const core = app.$stel.core; core.projection = camera.projection; core.fov = camera.fovRad; core.observer.yaw = camera.yawRad; core.observer.pitch = camera.pitchRad; core.observer.roll = camera.rollRad; core.landscapes.visible = camera.landscapeVisible; neutral(); removeWheel.reset(); return { ok: true } },
      setLive (live) { app.$stel.core.time_speed = live ? 1 : 0 },
      presentation,
      async select (entity) {
        const generation = ++selectionGeneration
        const identity = { catalog: entity.catalog, sourceId: entity.source_id, model: entity.model, ra: entity.ra, dec: entity.dec, time: new Date(Math.round((app.$stel.core.observer.utc - 40587) * 86400000)).toISOString(), lat: app.$stel.core.observer.latitude * 180 / Math.PI, lng: app.$stel.core.observer.longitude * 180 / Math.PI, elev: app.$stel.core.observer.elevation }
        const source = await swh.fetchOrasSkySourceByIdentity(identity)
        if (disposed || generation !== selectionGeneration) return { ok: false, error: 'Selection superseded' }
        if (!source || source.status === 'not_indexed' || !swh.skySourceMatchesIdentity(source, identity)) return { ok: false, error: 'Object unavailable in this catalog' }
        let obj = entity.model === 'star' ? await swh.resolveCanonicalStar(source) : swh.skySource2SweObj(source)
        if (disposed || generation !== selectionGeneration) { if (obj && obj.__orasOwnedLookup)obj.destroy(); return { ok: false, error: 'Selection superseded' } }
        if (!obj) { obj = app.$stel.createObj(source.model, source); if (obj)app.$selectionLayer.add(obj) }
        if (!obj) return { ok: false, error: 'Object could not be materialized' }
        obj.__orasSkySourceData = source; swh.exactSkySourceSelection = source; app.$stel.core.selection = obj; app.$store.commit('setSelectedObject', source)
        if (obj.__orasOwnedLookup) { obj.__orasOwnedLookup = false; obj.destroy() }
        return { ok: true }
      },
      clear () { ++selectionGeneration; app.$stel.core.selection = 0; swh.exactSkySourceSelection = undefined; app.$store.commit('setSelectedObject', 0); return { ok: true } },
      focus () { const obj = app.$stel.core.selection; if (!obj) return { ok: false, error: 'No available selection' }; app.$stel.pointAndLock(obj, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1); return { ok: true } },
      snapshot () {
        const ss = app.$store.state.selectedObject
        let selection = null
        if (ss && ss.catalog && ss.source_id != null && ss.model) {
          const facts = []; for (const [label, value] of [['Catalog', ss.catalog], ['Source ID', ss.source_id], ['Type', ss.object_type], ['Magnitude', ss.magnitude], ['Spectral type', ss.model_data && ss.model_data.spect_t]]) if (value != null)facts.push({ label, value: String(value).slice(0, 256) })
          const query = new URLSearchParams({ catalog: ss.catalog, source_id: String(ss.source_id), model: ss.model, date: new Date(Math.round((app.$stel.core.observer.utc - 40587) * 86400000)).toISOString(), lat: String(app.$stel.core.observer.latitude * 180 / Math.PI), lng: String(app.$stel.core.observer.longitude * 180 / Math.PI), elev: String(app.$stel.core.observer.elevation) })
          const coords = {}; for (const key of ['ra', 'dec']) if (Number.isFinite(ss[key])) { coords[key] = ss[key]; query.set(key, String(ss[key])) }
          selection = { id: [ss.catalog, ss.source_id, ss.model].join(':').slice(0, 256), name: String(ss.display_name || (ss.names && ss.names[0]) || ss.source_id).slice(0, 256), ...(typeof ss.description === 'string' ? { detail: ss.description.slice(0, 1500) } : {}), kind: ss.model === 'tle_satellite' ? 'satellite' : ['dso', 'star', 'planet', 'moon'].includes(ss.model) ? ss.model : 'object', catalog: ss.catalog, source_id: String(ss.source_id), model: ss.model, ...coords, facts, available: true, focusable: true, trackable: false, link: '/oras-sky-engine/skysource/' + encodeURIComponent(ss.display_name || ss.source_id) + '?' + query }
        }
        return { selection, layers: [], tracking: false }
      }
    }
    window.dispatchEvent(new Event('oras-sky-ready'))
  }
}
