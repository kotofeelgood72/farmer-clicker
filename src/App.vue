<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
html, body {
  background: #0d0805;
  margin: 0;
  padding: 0;
  height: 100vh;
  /* dvh handles mobile browser chrome (URL bar) correctly */
  height: 100dvh;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  touch-action: manipulation;
  overscroll-behavior: none;
}
#app {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}
* {
  box-sizing: border-box;
}
</style>
