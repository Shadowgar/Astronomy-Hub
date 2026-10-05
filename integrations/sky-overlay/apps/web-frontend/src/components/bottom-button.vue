// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.

<template>
  <div class="bottom-button" :class="{on: toggled}">
    <button type="button" @click="clicked" :aria-label="label" :aria-pressed="!!toggled" :title="label">
      <img :src="img" :alt="img_alt"/>
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
</style>

<script>
export default {
  name: 'bottom-button',
  props: ['label', 'img', 'toggled', 'img_alt'],
  methods: {
    clicked: function () {
      var b = !this.toggled
      this.$emit('clicked', b)
    }
  }
}
</script>
