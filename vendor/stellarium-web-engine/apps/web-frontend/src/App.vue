// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.

<template>

<v-app>
  <v-navigation-drawer v-model="nav" app stateless width="300">
    <v-layout column fill-height>
      <v-list dense>
        <template v-for="(item,i) in menuItems">
          <template v-if="$store.state[item.store_show_menu_item] === false"></template>
          <v-subheader v-else-if="item.header" v-text="item.header" class="grey--text text--darken-1" :key="i"/>
          <v-divider class="divider_menu" v-else-if="item.divider" :key="i"/>
          <v-list-item v-else-if="item.switch" @click.stop="toggleStoreValue(item.store_var_name)" :key="i">
            <v-list-item-action>
              <v-switch value :input-value="getStoreValue(item.store_var_name)" label=""></v-switch>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <template v-else>
            <v-list-item v-if='item.link' target="_blank" rel="noopener" :href='item.link' :key="i">
              <v-list-item-icon><v-icon>{{ item.icon }}</v-icon></v-list-item-icon>
              <v-list-item-title v-text="item.title"/>
              <v-icon disabled>mdi-open-in-new</v-icon>
            </v-list-item>
            <v-list-item v-else-if='item.footer===undefined' @click.stop="handleMenuItemClick(item)" :key="i">
              <v-list-item-icon><v-icon>{{ item.icon }}</v-icon></v-list-item-icon>
              <v-list-item-title v-text="item.title"/>
            </v-list-item>
          </template>
        </template>
      </v-list>
      <template v-for="(item,i) in menuComponents">
        <component :is="item" :key="i"></component>
      </template>
      <v-spacer></v-spacer>
      <v-list dense>
        <v-divider class="divider_menu"/>
        <template v-for="(item,i) in menuItems">
          <v-list-item v-if='item.footer' @click.stop="toggleStoreValue(item.store_var_name)" :key="i">
            <v-list-item-icon><v-icon>{{ item.icon }}</v-icon></v-list-item-icon>
            <v-list-item-title v-text="item.title"/>
          </v-list-item>
        </template>
      </v-list>
    </v-layout>
  </v-navigation-drawer>

  <v-main>
    <v-container class="fill-height" fluid style="padding: 0">
      <div id="stel" v-bind:class="{ right_panel: $store.state.showSidePanel }">
        <div style="position: relative; width: 100%; height: 100%">
          <component v-bind:is="guiComponent"></component>
          <canvas id="stel-canvas" ref='stelCanvas'></canvas>
        </div>
      </div>
    </v-container>
  </v-main>

</v-app>

</template>

<script>

import _ from 'lodash'
import Gui from '@/components/gui.vue'
import GuiLoader from '@/components/gui-loader.vue'
import { ORAS_BUNDLED_GAIA_SURVEY_ROOT, listOrasPackRoots, resolveOrasDssSurveyUrl, withOrasRouteIdentityFallback } from '@/assets/oras_data_config.js'
import swh from '@/assets/sw_helpers.js'
import Moment from 'moment'

export default {
  data (context) {
    return {
      menuItems: [
        { title: this.$t('Hub Frontpage'), icon: 'mdi-home-variant-outline', action: 'hubFrontpage' },
        { title: this.$t('Recheck Runtime'), icon: 'mdi-refresh', action: 'recheckRuntime' },
        { title: this.$t('Open Standalone Runtime'), icon: 'mdi-open-in-new', action: 'openStandaloneRuntime' },
        { title: this.$t('View Settings'), icon: 'mdi-settings', store_var_name: 'showViewSettingsDialog', store_show_menu_item: 'showViewSettingsMenuItem' },
        { title: this.$t('Planets Tonight'), icon: 'mdi-panorama-fisheye', store_var_name: 'showPlanetsVisibilityDialog', store_show_menu_item: 'showPlanetsVisibilityMenuItem' },
        { divider: true }
      ].concat(this.getPluginsMenuItems()).concat([
        { title: this.$t('Data Credits'), footer: true, icon: 'mdi-copyright', store_var_name: 'showDataCreditsDialog' }
      ]),
      menuComponents: [].concat(this.getPluginsMenuComponents()),
      guiComponent: 'GuiLoader',
      startTimeIsSet: false,
      initDone: false,
      dataSourceInitDone: false
    }
  },
  components: { Gui, GuiLoader },
  methods: {
    getPluginsMenuItems: function () {
      let res = []
      for (const i in this.$stellariumWebPlugins()) {
        const plugin = this.$stellariumWebPlugins()[i]
        if (plugin.menuItems) {
          res = res.concat(plugin.menuItems)
        }
      }
      return res
    },
    getPluginsMenuComponents: function () {
      let res = []
      for (const i in this.$stellariumWebPlugins()) {
        const plugin = this.$stellariumWebPlugins()[i]
        if (plugin.menuComponents) {
          res = res.concat(plugin.menuComponents)
        }
      }
      return res
    },
    toggleStoreValue: function (storeVarName) {
      this.$store.commit('toggleBool', storeVarName)
    },
    handleMenuItemClick: function (item) {
      if (item.action === 'hubFrontpage') {
        this.navigateHubFrontpage()
        return
      }
      if (item.action === 'recheckRuntime') {
        this.recheckRuntime()
        return
      }
      if (item.action === 'openStandaloneRuntime') {
        this.openStandaloneRuntime()
        return
      }
      if (item.store_var_name) {
        this.toggleStoreValue(item.store_var_name)
      }
    },
    getStoreValue: function (storeVarName) {
      return _.get(this.$store.state, storeVarName)
    },
    getParentAppOrigin: function () {
      try {
        if (document.referrer) {
          return new URL(document.referrer).origin
        }
      } catch (error) {
        console.log(error)
      }

      return '*'
    },
    closeNavigationDrawer: function () {
      if (this.$store.state.showNavigationDrawer) {
        this.$store.commit('toggleBool', 'showNavigationDrawer')
      }
    },
    postRuntimeAction: function (action) {
      const parentOrigin = this.getParentAppOrigin()

      try {
        if (window.top && window.top !== window) {
          window.top.postMessage(action, parentOrigin)
          return true
        }
      } catch (error) {
        console.log(error)
      }

      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(action, parentOrigin)
          return true
        }
      } catch (error) {
        console.log(error)
      }

      return false
    },
    navigateHubFrontpage: function () {
      this.closeNavigationDrawer()

      let hubUrl = '/'

      try {
        if (document.referrer) {
          hubUrl = new URL('/', document.referrer).href
        }
      } catch (error) {
        console.log(error)
      }

      try {
        if (window.top && window.top !== window) {
          window.top.location.href = hubUrl
          return
        }
      } catch (error) {
        console.log(error)
      }

      try {
        if (window.parent && window.parent !== window) {
          window.parent.location.href = hubUrl
          return
        }
      } catch (error) {
        console.log(error)
      }

      window.location.href = hubUrl
    },
    recheckRuntime: function () {
      this.closeNavigationDrawer()

      if (this.postRuntimeAction('oras-sky-engine:recheck-runtime')) {
        return
      }

      window.location.reload()
    },
    openStandaloneRuntime: function () {
      this.closeNavigationDrawer()

      if (this.postRuntimeAction('oras-sky-engine:open-standalone-runtime')) {
        return
      }

      window.open(window.location.href, '_blank', 'noopener,noreferrer')
    },
    setStateFromQueryArgs: function () {
      // Check whether the observing panel must be displayed
      this.$store.commit('setValue', { varName: 'showSidePanel', newValue: this.$route.path.startsWith('/p/') })

      // Set the core's state from URL query arguments such
      // as date, location, view direction & fov
      var that = this

      if (!this.initDone) {
        this.$stel.core.time_speed = 1
        let d = new Date()
        if (this.$route.query.date) {
          d = new Moment(this.$route.query.date).toDate()
          this.$stel.core.observer.utc = d.getMJD()
          this.startTimeIsSet = true
        }

        if (this.$route.query.lng && this.$route.query.lat) {
          const pos = { lat: Number(this.$route.query.lat), lng: Number(this.$route.query.lng), alt: this.$route.query.elev ? Number(this.$route.query.elev) : 0, accuracy: 1 }
          swh.geoCodePosition(pos, that).then((loc) => {
            that.$store.commit('setCurrentLocation', loc)
          }, (error) => { console.log(error) })
        }

        this.$stel.core.observer.yaw = this.$route.query.az ? Number(this.$route.query.az) * Math.PI / 180 : 0
        this.$stel.core.observer.pitch = this.$route.query.alt ? Number(this.$route.query.alt) * Math.PI / 180 : 30 * Math.PI / 180
        this.$stel.core.fov = this.$route.query.fov ? Number(this.$route.query.fov) * Math.PI / 180 : 120 * Math.PI / 180

        this.initDone = true
      }

      if (this.$route.path.startsWith('/skysource/')) {
        const name = decodeURIComponent(this.$route.path.substring(11))
        console.log('Will select object: ' + name)
        const routeIdentity = this.skySourceRouteIdentity()
        if (routeIdentity) {
          return this.selectSkySourceRouteTargetByIdentity(routeIdentity)
        }
        return this.selectSkySourceRouteTarget(name)
      }
    },

    skySourceRouteIdentity: function () {
      const catalog = typeof this.$route.query.catalog === 'string' ? this.$route.query.catalog.trim() : ''
      const sourceId = typeof this.$route.query.source_id === 'string' ? this.$route.query.source_id.trim() : ''
      const model = typeof this.$route.query.model === 'string' ? this.$route.query.model.trim() : ''
      const ra = this.$route.query.ra == null ? null : Number(this.$route.query.ra)
      const dec = this.$route.query.dec == null ? null : Number(this.$route.query.dec)
      const time = typeof this.$route.query.date === 'string' ? this.$route.query.date.trim() : ''
      const lat = this.$route.query.lat == null ? null : Number(this.$route.query.lat)
      const lng = this.$route.query.lng == null ? null : Number(this.$route.query.lng)
      const elev = this.$route.query.elev == null ? null : Number(this.$route.query.elev)

      if (!catalog || !sourceId || !model) {
        return undefined
      }

      return {
        catalog,
        sourceId,
        model,
        ra: Number.isFinite(ra) ? ra : null,
        dec: Number.isFinite(dec) ? dec : null,
        time: time || null,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        elev: Number.isFinite(elev) ? elev : null
      }
    },

    selectSkySourceRouteTarget: function (name, attempt = 0) {
      const retryDelayMs = 250
      const maxAttempts = 80
      const lookup = attempt === 0
        ? swh.lookupSkySourceByName(name)
        : Promise.resolve(swh.lookupSkySourceLocallyByName(name)).then(ss => {
          if (ss) {
            return ss
          }
          throw new Error('Local sky source not found')
        })

      return lookup.then(ss => {
        if (!ss) {
          return
        }
        let obj = swh.skySource2SweObj(ss)
        if (!obj) {
          obj = this.$stel.createObj(ss.model, ss)
          this.$selectionLayer.add(obj)
        }
        if (!obj) {
          console.warning("Can't find object in SWE: " + ss.names[0])
        }
        swh.setSweObjAsSelection(obj)
      }, err => {
        if (attempt < maxAttempts) {
          return new Promise(resolve => setTimeout(resolve, retryDelayMs))
            .then(() => this.selectSkySourceRouteTarget(name, attempt + 1))
        }
        console.log(err)
        console.log("Couldn't find skysource for name: " + name)
      })
    },

    selectSkySourceRouteTargetByIdentity: function (identity, attempt = 0) {
      const retryDelayMs = 250
      const maxAttempts = 80

      return swh.fetchOrasSkySourceByIdentity(identity).then(ss => {
        ss = withOrasRouteIdentityFallback(ss, identity)
        if (!ss || !swh.skySourceMatchesIdentity(ss, identity)) {
          throw new Error('Resolved sky source did not match requested identity')
        }

        let obj = swh.skySource2SweObj(ss)
        if (!obj) {
          const fallbackObj = this.$stel.createObj(ss.model, ss)
          if (!fallbackObj) {
            throw new Error('Exact sky source target is not ready yet')
          }
          obj = fallbackObj
          this.$selectionLayer.add(obj)
        }
        obj.__orasSkySourceData = ss
        swh.setSweObjAsSelection(obj, ss)
      }, err => {
        if (attempt < maxAttempts) {
          return new Promise(resolve => setTimeout(resolve, retryDelayMs))
            .then(() => this.selectSkySourceRouteTargetByIdentity(identity, attempt + 1))
        }
        const fallback = Object.assign({
          match: identity.sourceId,
          names: [identity.sourceId],
          types: [identity.model === 'dso' ? 'dso' : '*'],
          model: identity.model,
          model_data: identity.model === 'dso' && identity.ra != null && identity.dec != null
            ? { ra: identity.ra, de: identity.dec, source_id: identity.sourceId }
            : {},
          catalog: identity.catalog,
          source_id: identity.sourceId,
          display_name: identity.sourceId,
          ra: identity.ra,
          dec: identity.dec
        }, {
          ra: identity.ra,
          dec: identity.dec
        })
        const fallbackObj = this.$stel.createObj(fallback.model, fallback)
        if (fallbackObj) {
          this.$selectionLayer.add(fallbackObj)
          swh.setSweObjAsSelection(fallbackObj)
          return
        }
        console.log(err)
        console.log("Couldn't find skysource for identity: " + identity.catalog + ' ' + identity.sourceId)
      })
    }
  },
  computed: {
    nav: {
      get: function () {
        return this.$store.state.showNavigationDrawer
      },
      set: function (v) {
        if (this.$store.state.showNavigationDrawer !== v) {
          this.$store.commit('toggleBool', 'showNavigationDrawer')
        }
      }
    },
    storeCurrentLocation: function () {
      return this.$store.state.currentLocation
    }
  },
  watch: {
    storeCurrentLocation: function (loc) {
      const DD2R = Math.PI / 180
      this.$stel.core.observer.latitude = loc.lat * DD2R
      this.$stel.core.observer.longitude = loc.lng * DD2R
      this.$stel.core.observer.elevation = loc.alt

      // At startup, we need to wait for the location to be set before deciding which
      // startup time to set so that it's night time.
      if (!this.startTimeIsSet) {
        this.$stel.core.observer.utc = swh.getTimeAfterSunset(this.$stel)
        this.startTimeIsSet = true
      }
      // Init of time and date is complete
      this.$store.commit('setValue', { varName: 'initComplete', newValue: true })
    },
    $route: function () {
      // react to route changes...
      this.setStateFromQueryArgs()
    }
  },
  mounted: function () {
    var that = this

    for (const i in this.$stellariumWebPlugins()) {
      const plugin = this.$stellariumWebPlugins()[i]
      if (plugin.onAppMounted) {
        plugin.onAppMounted(that)
      }
    }

    import('@/assets/js/stellarium-web-engine.wasm').then(f => {
      // Initialize the StelWebEngine viewer singleton
      // After this call, the StelWebEngine state will always be available in vuex store
      // in the $store.stel object in a reactive way (useful for vue components).
      // To modify the state of the StelWebEngine, it's enough to call/set values directly on the $stel object
      try {
        swh.initStelWebEngine(that.$store, f.default, that.$refs.stelCanvas, function () {
          // Start auto location detection (even if we don't use it)
          swh.getGeolocation().then(p => swh.geoCodePosition(p, that)).then((loc) => {
            that.$store.commit('setAutoDetectedLocation', loc)
          }, (error) => { console.log(error) })

          that.$stel.setFont('regular', process.env.BASE_URL + 'fonts/Roboto-Regular.ttf', 1.38)
          that.$stel.setFont('bold', process.env.BASE_URL + 'fonts/Roboto-Bold.ttf', 1.38)
          that.$stel.core.constellations.show_only_pointed = false

          that.setStateFromQueryArgs()
          that.guiComponent = 'Gui'
          for (const i in that.$stellariumWebPlugins()) {
            const plugin = that.$stellariumWebPlugins()[i]
            if (plugin.onEngineReady) {
              plugin.onEngineReady(that)
            }
          }

          if (!that.dataSourceInitDone) {
            // Set all default data sources
            const core = that.$stel.core
            const bundledDataBase = process.env.BASE_URL + 'skydata'
            // Match Stellarium-Web DSO behavior with bounded packs only:
            // keep legacy root /dso disabled and load base + extended packs.
            core.dsos.addDataSource({ url: bundledDataBase + '/packs/base/dso' })
            core.dsos.addDataSource({ url: bundledDataBase + '/packs/extended/dso' })
            listOrasPackRoots().forEach((packRoot) => {
              core.stars.addDataSource({ url: packRoot + '/stars' })
            })
            core.stars.addDataSource({ url: ORAS_BUNDLED_GAIA_SURVEY_ROOT, key: 'gaia' })

            // Allow to specify a custom path for sky culture data
            if (that.$route.query.sc) {
              const key = that.$route.query.sc.substring(that.$route.query.sc.lastIndexOf('/') + 1)
              core.skycultures.addDataSource({ url: that.$route.query.sc, key: key })
              core.skycultures.current_id = key
            } else {
              core.skycultures.addDataSource({ url: process.env.BASE_URL + 'skydata/skycultures/western', key: 'western' })
            }

            resolveOrasDssSurveyUrl(that.$route.query.hips).then(dssSurveyUrl => {
              if (dssSurveyUrl) {
                core.dss.addDataSource({ url: dssSurveyUrl })
              }
            }, error => {
              console.warn('Failed to resolve ORAS DSS survey source', error)
            })
            core.landscapes.addDataSource({ url: bundledDataBase + '/landscapes/guereins', key: 'guereins' })
            core.milkyway.addDataSource({ url: bundledDataBase + '/surveys/milkyway' })
            core.minor_planets.addDataSource({ url: bundledDataBase + '/mpcorb.dat', key: 'mpc_asteroids' })
            const localPlanetSurveyBase = bundledDataBase + '/surveys/sso'
            const planetSurveySources = [
              ['moon', localPlanetSurveyBase + '/moon'],
              ['sun', localPlanetSurveyBase + '/sun'],
              ['mercury', localPlanetSurveyBase + '/mercury'],
              ['venus', localPlanetSurveyBase + '/venus'],
              ['mars', localPlanetSurveyBase + '/mars'],
              ['jupiter', localPlanetSurveyBase + '/jupiter'],
              ['saturn', localPlanetSurveyBase + '/saturn'],
              ['uranus', localPlanetSurveyBase + '/uranus'],
              ['neptune', localPlanetSurveyBase + '/neptune']
            ]
            planetSurveySources.forEach(([key, url]) => core.planets.addDataSource({ url, key }))
            core.comets.addDataSource({ url: bundledDataBase + '/CometEls.txt', key: 'mpc_comets' })
            core.satellites.addDataSource({ url: bundledDataBase + '/tle_satellite.jsonl.gz', key: 'jsonl/sat' })
            core.satellites.hints_mag_offset = 2
            that.dataSourceInitDone = true
          }
        })
      } catch (e) {
        console.error(e)
        this.$store.commit('setValue', { varName: 'wasmSupport', newValue: false })
      }
    })
  }
}
</script>

<style>

a {
  color: #82b1ff;
}

a:link {
  text-decoration-line: none;
}

.divider_menu {
  margin-top: 8px;
  margin-bottom: 8px;
}

html {
  overflow-y: visible;
}

html, body, #app {
  overflow-y: visible!important;
  overflow-x: visible;
  position: fixed!important;
  width: 100%;
  height: 100%;
  padding: 0!important;
  font-size: 14px;
}

.fullscreen {
  overflow-y: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
  padding: 0!important;
}

.click-through {
  pointer-events: none;
}

.get-click {
  pointer-events: all;
}

.dialog {
  background: transparent;
}

.menu__content {
  background-color: transparent!important;
}

#stel {height: 100%; width: 100%; position: absolute;}
#stel-canvas {z-index: -10; width: 100%; height: 100%;}

.right_panel {
  padding-right: 400px;
}

.v-btn {
  margin-left: 8px;
  margin-right: 8px;
  margin-top: 6px;
  margin-bottom: 6px;
}

.v-application--wrap {
  min-height: 100%!important;
}

</style>
