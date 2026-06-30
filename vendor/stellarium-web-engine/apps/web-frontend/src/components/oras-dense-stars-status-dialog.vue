<template>
  <v-dialog :value="value" max-width="760" @input="$emit('input', $event)">
    <v-card class="oras-dense-stars-status">
      <v-card-title>
        ORAS Dense Stars
        <v-spacer></v-spacer>
        <v-chip small :color="statusColor" text-color="white">{{ statusLabel }}</v-chip>
      </v-card-title>
      <v-card-subtitle>
        Native path: native SWE star tiles · Release {{ snapshot.releaseVersion || 'not mounted' }}
      </v-card-subtitle>
      <v-card-text>
        <v-alert v-if="!snapshot.mounted" type="info" text>
          Dense Stars is degraded: missing generated dense star release. Standard Stellarium star surveys remain available.
        </v-alert>
        <v-alert v-else-if="!snapshot.enabled" type="warning" text>
          ORAS dense star rendering is off. Toggle it on and recheck the runtime to register the mounted native survey.
        </v-alert>
        <v-alert v-else type="success" text>
          ORAS dense stars are loaded through native SWE star tiles. The browser loads the manifest first; tile payloads are requested by Stellarium as needed.
        </v-alert>

        <v-simple-table dense>
          <tbody>
            <tr>
              <td><strong>Rendering path</strong></td>
              <td>{{ snapshot.renderingPath || 'Unavailable' }}</td>
            </tr>
            <tr>
              <td><strong>Stars</strong></td>
              <td>{{ snapshot.starCount.toLocaleString() }}</td>
            </tr>
            <tr>
              <td><strong>Tiles</strong></td>
              <td>{{ snapshot.tileCount.toLocaleString() }}</td>
            </tr>
            <tr>
              <td><strong>Magnitude limit</strong></td>
              <td>{{ snapshot.magnitudeLimit == null ? 'Unavailable' : snapshot.magnitudeLimit }}</td>
            </tr>
            <tr>
              <td><strong>Tile order</strong></td>
              <td>{{ snapshot.tileOrder == null ? 'Unavailable' : snapshot.tileOrder }}</td>
            </tr>
            <tr>
              <td><strong>Sources</strong></td>
              <td>{{ sourceCatalogSummary }}</td>
            </tr>
            <tr v-if="snapshot.error">
              <td><strong>Error</strong></td>
              <td>{{ snapshot.error }}</td>
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
import { orasDenseStars } from '@/assets/oras_dense_stars.js'

export default {
  name: 'OrasDenseStarsStatusDialog',
  props: {
    value: { type: Boolean, default: false }
  },
  data: function () {
    return {
      snapshot: orasDenseStars.getSnapshot(),
      unsubscribe: undefined
    }
  },
  computed: {
    statusLabel: function () {
      return this.snapshot.phase.replace('-', ' ')
    },
    statusColor: function () {
      if (this.snapshot.phase === 'loaded') return 'green'
      if (this.snapshot.phase === 'failed' || this.snapshot.phase === 'degraded') return 'orange'
      if (this.snapshot.phase === 'off') return 'blue-grey'
      return 'blue-grey'
    },
    sourceCatalogSummary: function () {
      const entries = Object.entries(this.snapshot.sourceCatalogs || {})
      return entries.length ? entries.map(([name, count]) => name + ': ' + Number(count).toLocaleString()).join(', ') : 'Unavailable'
    }
  },
  created: function () {
    this.unsubscribe = orasDenseStars.subscribe(snapshot => { this.snapshot = snapshot })
  },
  beforeDestroy: function () {
    if (this.unsubscribe) this.unsubscribe()
  },
  methods: {
    refresh: function () {
      orasDenseStars.load()
    }
  }
}
</script>

<style scoped>
.oras-dense-stars-status {
  background: rgba(20, 27, 42, 0.98);
}
</style>
