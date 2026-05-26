<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import bgFull from '@/assets/full-bg.png'

onMounted(() => {
  document.body.style.backgroundImage = `url(${bgFull})`
})
</script>

<template>
  <RouterView />
</template>

<style>
html, body {
  background-color: #1a1208;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh;
  /* dvh handles mobile browser chrome (URL bar) correctly */
  height: 100dvh;
  position: fixed;
  inset: 0;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  touch-action: none;
  overscroll-behavior: none;
}
body {
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  /* background-attachment: fixed triggers rubber-band scroll on iOS Safari */
}
#app {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: none;
}
* {
  box-sizing: border-box;
}
</style>
