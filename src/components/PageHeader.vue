<script setup lang="ts">
import IconArrowLeft from '~icons/solar/arrow-left-linear'

defineProps<{
  title: string
}>()

defineEmits<{
  (e: 'back'): void
}>()
</script>

<template>
  <header class="page-header">
    <button class="back-btn" aria-label="назад" @click="$emit('back')">
      <IconArrowLeft class="back-icon" />
    </button>

    <h1 class="page-title">{{ title }}</h1>

    <div class="right-slot">
      <slot name="right" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 56px 16px 10px;
  background: #14141f;
  border-bottom: 1px solid #ffffff0c;
}

.back-btn { justify-self: start; }

.back-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.back-icon {
  width: 20px;
  height: 20px;
}

.page-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  letter-spacing: 0.2px;
}

.right-slot {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
</style>
