<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { IMAGE_SLOT_PX, type ImageSlotKey } from '@/constants/imageSlots'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
    /** CSS aspect-ratio, например `3 / 4` */
    aspectRatio?: string
    fit?: 'cover' | 'contain'
    position?: string
    /** Заполнить родителя (position: absolute; inset: 0) */
    fill?: boolean
    /** Подсказка браузеру о реальном размере файла (из imageSlots) */
    imageSlot?: ImageSlotKey
  }>(),
  {
    alt: '',
    fit: 'cover',
    position: 'center',
    fill: false,
  },
)

const attrs = useAttrs()

const frameStyle = computed(() => {
  if (!props.aspectRatio) return undefined
  return { aspectRatio: props.aspectRatio }
})

const intrinsicSize = computed(() => {
  if (!props.imageSlot) return undefined
  const px = IMAGE_SLOT_PX[props.imageSlot]
  if (px.fit === 'inside') {
    return { width: px.width, height: px.maxHeight ?? px.width }
  }
  return { width: px.width, height: px.height }
})
</script>

<template>
  <div
    class="cover-image"
    :class="[attrs.class, { 'cover-image--fill': fill }]"
    :style="frameStyle"
  >
    <img
      class="cover-image__img"
      :src="src"
      :alt="alt"
      draggable="false"
      decoding="async"
      :width="intrinsicSize?.width"
      :height="intrinsicSize?.height"
      :style="{ objectFit: fit, objectPosition: position }"
    />
  </div>
</template>

<style scoped>
.cover-image {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.cover-image--fill {
  position: absolute;
  inset: 0;
  height: 100%;
}

.cover-image__img {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  -webkit-user-drag: none;
  user-select: none;
}
</style>
