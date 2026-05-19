<script setup lang="ts" generic="T extends string | number">
defineProps<{
  modelValue: T
  options: { value: T; label: string }[]
  layout?: 'scroll' | 'grid'
}>()

defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()
</script>

<template>
  <div :class="['app-tabs', layout === 'grid' ? 'app-tabs--grid' : 'app-tabs--scroll']">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      :class="['app-tab', { active: modelValue === opt.value }]"
      type="button"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.app-tabs {
  display: flex;
  gap: 8px;
}

.app-tabs--scroll {
  overflow-x: auto;
  scrollbar-width: none;
  padding: 2px 0;
}
.app-tabs--scroll::-webkit-scrollbar { display: none; }

.app-tabs--grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
}

.app-tab {
  flex-shrink: 0;
  padding: 9px 16px;
  border-radius: 999px;
  border: none;
  outline: none;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.app-tab.active {
  background: linear-gradient(135deg, #b14bff 0%, #6e3df0 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(177, 75, 255, 0.28);
}
</style>
