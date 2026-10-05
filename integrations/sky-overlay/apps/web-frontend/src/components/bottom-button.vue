// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.

<template>
  <div v-if="!embedded || img_alt !== 'Fullscreen Button'" class="bottom-button" :class="{on: toggled, 'oras-control': embedded}" :data-control="embedded && icon ? icon.id : null">
    <button type="button" @click="clicked" :aria-label="label" :aria-pressed="toggled ? 'true' : 'false'" :title="label">
      <svg v-if="embedded && icon" class="oras-control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <path v-for="(d, index) in icon.paths" :key="index" :d="d"/>
      </svg>
      <img v-else :src="img" :alt="img_alt"/>
    </button>
    <div class="hint">{{label}}</div>
  </div>
</template>

<style>
  .bottom-button {
    width: 44px;
    height: 44px;
    position: relative;
    display: inline-block;
    user-select: none;
  }
  .bottom-button button { width:44px; height:44px; padding:0; border:0; background:transparent; cursor:pointer; }
  .bottom-button button:focus-visible { outline:2px solid #9BE4F2; outline-offset:-2px; }
  .bottom-button img {
    width: 100%;
    height: 100%;
    filter: opacity(0.5);
  }
  .bottom-button.on img {
    filter: opacity(1);
  }
  .bottom-button .hint {
    display: none;
    position: absolute;
    bottom: 100%;
    color: white;
    width: 200px;
  }
  .bottom-button:hover .hint {
    display: block;
  }
  .oras-control button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 4px;
    color: #B9C7D7;
  }
  .oras-control .oras-control-icon { width: 24px; height: 24px; }
  .oras-control button:hover { background: #233447; color: #F1F5F9; }
  .oras-control.on button { background: #182535; border-color: #72859C; color: #9BE4F2; }
  .oras-control.on button::after {
    content: ''; position: absolute; bottom: 3px; width: 8px; height: 2px;
    border-radius: 1px; background: currentColor;
  }
  .oras-control button:focus-visible { outline: 2px solid #9BE4F2; outline-offset: 2px; }
</style>

<script>
import orasControlIcons from '@/assets/oras_control_icons.js'

export default {
  name: 'bottom-button',
  props: ['label', 'img', 'toggled', 'img_alt'],
  computed: {
    embedded () { return !!this.$store.state.orasEmbeddedPresentation },
    icon () { return orasControlIcons[this.img_alt] }
  },
  methods: {
    clicked: function () {
      var b = !this.toggled
      this.$emit('clicked', b)
    }
  }
}
</script>
