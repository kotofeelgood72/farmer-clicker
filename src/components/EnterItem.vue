<script setup lang="ts">
import { computed } from 'vue'
import { enterStagger } from '@/composables/useEnterStagger'

const props = withDefaults(
  defineProps<{
    /** Явный порядок (приоритет над index) */
    order?: number
    /** Индекс в списке — задержка через enterStagger */
    index?: number
    base?: number
    cap?: number
    tag?: string
    /** Вне .page-enter (редко) */
    solo?: boolean
  }>(),
  {
    base: 0,
    cap: 5,
    tag: 'div',
  },
)

const enterIndex = computed(() => {
  if (props.order !== undefined) return props.order
  if (props.index !== undefined) return enterStagger(props.index, props.base, props.cap)
  return props.base
})

const enterStyle = computed(() => ({ '--enter-i': enterIndex.value }))
</script>

<template>
  <component
    :is="tag"
    class="enter-item"
    :class="{ 'enter-item--solo': solo }"
    :style="enterStyle"
  >
    <slot />
  </component>
</template>

<style scoped>
.enter-item {
  width: 100%;
  min-width: 0;
}
</style>
