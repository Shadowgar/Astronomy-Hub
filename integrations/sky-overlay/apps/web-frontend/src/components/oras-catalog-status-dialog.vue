<template>
  <v-dialog :value="value" max-width="760" @input="$emit('input', $event)">
    <v-card class="oras-catalog-status">
      <v-card-title>
        ORAS Catalog Packs
        <v-spacer></v-spacer>
        <v-chip small :color="statusColor" text-color="white">{{ statusLabel }}</v-chip>
      </v-card-title>
      <v-card-subtitle>
        Release {{ snapshot.releaseVersion || 'not mounted' }} ·
        Loaded objects {{ snapshot.objectCount.toLocaleString() }}
      </v-card-subtitle>
      <v-card-text>
        <v-alert v-if="!snapshot.mounted" type="info" text>
          No generated catalog release is mounted. The standard Stellarium catalogs remain available.
        </v-alert>
        <v-simple-table v-else dense>
          <thead>
            <tr>
              <th>Pack</th>
              <th>Status</th>
              <th>Loaded objects</th>
              <th>Data source</th>
              <th>Generated</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pack in snapshot.packs" :key="pack.packId">
              <td><strong>{{ pack.label }}</strong><br><small>{{ pack.version }}</small></td>
              <td><v-chip x-small :color="pack.status === 'loaded' ? 'green' : 'red'" text-color="white">{{ pack.status }}</v-chip></td>
              <td>{{ pack.loadedObjectCount.toLocaleString() }}</td>
              <td>{{ sourceNames(pack) }}</td>
              <td>{{ pack.generatedAt || 'Unavailable' }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="refresh">Refresh</v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="$emit('input', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { orasCatalogPacks } from '@/assets/oras_catalog_packs.js'

export default {
  name: 'OrasCatalogStatusDialog',
  props: {
    value: { type: Boolean, default: false }
  },
  data: function () {
    return {
      snapshot: orasCatalogPacks.getSnapshot(),
      unsubscribe: undefined
    }
  },
  computed: {
    statusLabel: function () {
      return this.snapshot.phase.replace('-', ' ')
    },
    statusColor: function () {
      if (this.snapshot.phase === 'loaded') return 'green'
      if (this.snapshot.phase === 'degraded' || this.snapshot.phase === 'failed') return 'orange'
      return 'blue-grey'
    }
  },
  created: function () {
    this.unsubscribe = orasCatalogPacks.subscribe(snapshot => { this.snapshot = snapshot })
  },
  beforeDestroy: function () {
    if (this.unsubscribe) this.unsubscribe()
  },
  methods: {
    refresh: function () {
      orasCatalogPacks.load()
    },
    sourceNames: function (pack) {
      const names = (pack.sources || []).map(source => source.name).filter(Boolean)
      return names.length ? names.join(', ') : 'Unavailable'
    }
  }
}
</script>

<style scoped>
.oras-catalog-status {
  background: rgba(20, 27, 42, 0.98);
}
</style>
