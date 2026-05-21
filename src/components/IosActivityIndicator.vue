<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
  }>(),
  { size: 36 },
)
</script>

<template>
  <div
    class="ios-spinner"
    role="status"
    aria-label="Загрузка"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <span
      v-for="i in 12"
      :key="i"
      class="ios-spinner__blade"
      :style="{
        '--blade-index': i - 1,
        '--spinner-size': `${size}px`,
      }"
    />
  </div>
</template>

<style scoped>
.ios-spinner {
  position: relative;
  flex-shrink: 0;
}

.ios-spinner__blade {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2.5px;
  height: calc(var(--spinner-size) * 0.22);
  margin-left: -1.25px;
  margin-top: calc(var(--spinner-size) * -0.36);
  border-radius: 2px;
  background: #8e8e93;
  transform: rotate(calc(var(--blade-index) * 30deg));
  transform-origin: center calc(var(--spinner-size) * 0.36);
  animation: ios-spinner-blade 1s linear infinite;
  animation-delay: calc(var(--blade-index) * -1s / 12);
}

@keyframes ios-spinner-blade {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}
</style>
