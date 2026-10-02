// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.

<template>
  <div style="position: relative;" v-click-outside="resetSearch">
    <v-text-field prepend-icon="mdi-magnify" :label="$t('Search...')" v-model="searchText" @keyup.native.esc="resetSearch()" hide-details single-line></v-text-field>
    <v-list dense v-if="showList" two-line :style="listStyle">
      <v-list-item v-for="source in autoCompleteChoices" :key="source.names[0]" @click="sourceClicked(source)">
        <v-list-item-action>
          <img :src="iconForSkySource(source)"/>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>{{ nameForSkySource(source) }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ subtitleForSkySource(source) }}
            <v-chip v-if="source.catalog" x-small outlined class="ml-1">{{ source.catalog }}</v-chip>
            <v-chip v-if="source.pack_id || source.source_attribution" x-small color="cyan darken-3" text-color="white" class="ml-1">ORAS Enhanced</v-chip>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import swh from '@/assets/sw_helpers.js'
import vClickOutside from 'v-click-outside'
import _ from 'lodash'

export default {
  data: function () {
    return {
      autoCompleteChoices: [],
      searchText: '',
      lastQuery: undefined
    }
  },
  props: ['value', 'floatingList'],
  watch: {
    searchText: function () {
      if (this.searchText === '') {
        this.autoCompleteChoices = []
        this.lastQuery = undefined
        return
      }
      this.refresh()
    }
  },
  computed: {
    listStyle: function () {
      return this.floatingList ? 'position: absolute; z-index: 1000; margin-top: 8px' : ''
    },
    showList: function () {
      return this.searchText.trim() !== ''
    }
  },
  methods: {
    sourceClicked: function (val) {
      this.$emit('input', val)
      this.resetSearch()
    },
    resetSearch: function () {
      this.searchText = ''
    },
    refresh: _.debounce(function () {
      var that = this
      const rawQuery = that.searchText.trim()
      if (!rawQuery) {
        that.autoCompleteChoices = []
        that.lastQuery = undefined
        return
      }
      if (this.lastQuery === rawQuery) {
        return
      }
      this.lastQuery = rawQuery
      swh.querySkySources(rawQuery, 10).then(results => {
        if (rawQuery !== that.lastQuery) {
          console.log('Cancelled query: ' + rawQuery)
          return
        }
        that.autoCompleteChoices = results
      }, err => { console.log(err) })
    }, 200),
    nameForSkySource: function (s) {
      const cn = swh.cleanupOneSkySourceName(s.match)
      const n = swh.nameForSkySource(s)
      if (cn === n) {
        return n
      } else {
        return cn + ' (' + n + ')'
      }
    },
    typeToName: function (t) {
      return swh.nameForSkySourceType(t)
    },
    subtitleForSkySource: function (s) {
      if (s && s.status === 'not_indexed') {
        return 'Not indexed in local ORAS catalog yet'
      }
      return this.typeToName(s.types[0])
    },
    iconForSkySource: function (s) {
      return swh.iconForSkySource(s)
    }
  },
  mounted: function () {
    var that = this
    const onClick = e => {
      if (that.searchText !== '') {
        that.searchText = ''
      }
    }
    const guiParent = document.querySelector('stel') || document.body
    guiParent.addEventListener('click', onClick, false)
    this.guiParent = guiParent
    this.guiParentClickHandler = onClick
  },
  beforeDestroy: function () {
    if (this.guiParent && this.guiParentClickHandler) {
      this.guiParent.removeEventListener('click', this.guiParentClickHandler, false)
    }
    this.guiParent = undefined
    this.guiParentClickHandler = undefined
  },
  directives: {
    clickOutside: vClickOutside.directive
  }
}
</script>

<style>

</style>
