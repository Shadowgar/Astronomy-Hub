// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.

<template>
  <div class="tsearch">
    <skysource-search v-model="obsSkySource" floatingList="true"></skysource-search>
  </div>
</template>

<script>
import SkysourceSearch from '@/components/skysource-search.vue'
import swh from '@/assets/sw_helpers.js'

export default {
  data: function () {
    return {
      obsSkySource: undefined
    }
  },
  watch: {
    obsSkySource: function (ss) {
      if (!ss) {
        return
      }
      let obj = swh.skySource2SweObj(ss)
      if (!obj) {
        obj = this.$stel.createObj(ss.model, ss)
        if (obj) {
          this.$selectionLayer.add(obj)
        }
      }
      if (!obj) {
        const label = Array.isArray(ss.names) && ss.names.length
          ? ss.names[0]
          : (ss.display_name || String(ss.source_id || 'unknown'))
        console.warn("Can't find object in SWE: " + label)
        return
      }
      obj.__orasSkySourceData = ss
      swh.setSweObjAsSelection(obj, ss)
    }
  },
  components: { SkysourceSearch }
}
</script>

<style>
@media all and (min-width: 600px) {
  .tsearch {
    z-index: 2;
  }
}
</style>
