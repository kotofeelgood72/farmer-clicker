<script setup lang="ts">
import heartIcon from '@/assets/ui/heart-default.png'

defineProps<{
  text: string
  affinity: number
}>()

defineEmits<{
  (e: 'pick'): void
}>()
</script>

<template>
  <button
    :class="['reply', affinity > 0 ? 'reply--pos' : 'reply--neg']"
    type="button"
    @click="$emit('pick')"
  >
    <span class="reply-text">{{ text }}</span>
    <span class="reply-aff">
      {{ affinity > 0 ? `+${affinity}` : affinity }}
      <img :src="heartIcon" alt="❤" class="reply-heart" />
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
  background: transparent;
  color: #e7c4e2;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: transform 0.1s ease, background 0.15s ease;
  border: 1px solid #221846;
  width: 100%;
}

.reply:active { transform: scale(0.98); }

.reply-aff {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  font-weight: 700;
  font-size: 12px;
}

.reply--pos .reply-aff { color: rgba(255, 255, 255, 0.85); }
.reply--neg .reply-aff { color: #a796ff; }

.reply-heart {
  width: 16px;
  height: 16px;
  object-fit: contain;
  margin-left: 4px;
  vertical-align: -3px;
  -webkit-user-drag: none;
}
</style>
