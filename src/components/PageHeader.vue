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
  padding: var(--header-top-pad) 16px calc(8px * var(--ui-density, 1));
  flex-shrink: 0;
  background: var(--header-bg);
  border-bottom: 1px solid var(--hairline);
}

.back-btn { justify-self: start; }

.back-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
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
  color: var(--text);
  text-align: center;
  letter-spacing: 0.2px;
}

.right-slot {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
}
</style>
