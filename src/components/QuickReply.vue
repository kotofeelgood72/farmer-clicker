<script setup lang="ts">
import diamondIcon from '@/assets/ui/stone.png'

defineProps<{
  text: string
  /** Стоимость сообщения в алмазах. */
  cost: number
}>()

defineEmits<{
  (e: 'pick'): void
}>()
</script>

<template>
  <button class="reply" type="button" @click="$emit('pick')">
    <span class="reply-text">{{ text }}</span>
    <span v-if="cost > 0" class="reply-cost">
      {{ cost }}
      <img :src="diamondIcon" alt="алмазы" class="reply-diamond" />
    </span>
  </button>
</template>

<style scoped>
.reply {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  outline: none;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: var(--lh-ui);
  text-align: left;
  cursor: pointer;
  transition: transform 0.1s ease, background 0.15s ease, box-shadow 0.15s ease;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  width: 100%;
}

.reply:hover { background: var(--surface-soft); }

.reply:active { transform: scale(0.98); }

.reply-cost {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  font-size: 12px;
  color: var(--accent);
}

.reply-diamond {
  width: 18px;
  height: 18px;
  object-fit: contain;
  -webkit-user-drag: none;
}
</style>
