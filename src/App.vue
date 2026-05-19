<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="stage">
    <div class="phone">
      <div class="phone-frame">
        <div class="phone-screen">
          <div class="dynamic-island" />
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
html, body {
  background-color: #0a0a0a;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  touch-action: manipulation;
  overscroll-behavior: none;
}
#app {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}
* {
  box-sizing: border-box;
}

.stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 50% 50%, #1a1a1a 0%, #050505 100%);
}

/* iPhone 17 Pro frame — 393x852 logical screen */
.phone {
  --screen-w: 393px;
  --screen-h: 852px;
  --bezel: 12px;
  --radius-outer: 62px;
  --radius-inner: 50px;

  width: calc(var(--screen-w) + var(--bezel) * 2);
  height: calc(var(--screen-h) + var(--bezel) * 2);
  position: relative;
  flex-shrink: 0;
}

.phone-frame {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-outer);
  background: linear-gradient(145deg, #2a2a2c 0%, #161618 50%, #2a2a2c 100%);
  padding: var(--bezel);
  box-shadow:
    0 0 0 1.5px #0a0a0a inset,
    0 0 0 3px #3a3a3c inset,
    0 30px 80px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

.phone-screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-inner);
  overflow: hidden;
  background: #000;
  isolation: isolate;
}

.dynamic-island {
  position: absolute;
  top: 11px;
  left: 50%;
  transform: translateX(-50%);
  width: 124px;
  height: 36px;
  background: #000;
  border-radius: 999px;
  z-index: 100;
  pointer-events: none;
}

/* Scale the phone down when viewport can't fit it */
@media (max-height: 900px) {
  .phone {
    transform: scale(calc((100vh - 40px) / 876));
    transform-origin: center center;
  }
}
@media (max-width: 440px) {
  .phone {
    transform: scale(calc((100vw - 20px) / 417));
    transform-origin: center center;
  }
}
</style>
