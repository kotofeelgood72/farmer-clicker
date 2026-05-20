<script setup lang="ts">
defineProps<{
  name: string
  status: string
  statusAccent?: boolean
  badge?: number
  letter?: string
  imageSrc?: string
  accentColor?: string
  /** Одна большая карточка на главной */
  featured?: boolean
}>()

defineEmits<{
  (e: 'open'): void
}>()
</script>

<template>
  <button
    type="button"
    :class="['chat-card', { 'chat-card--featured': featured }]"
    @click="$emit('open')"
  >
    <div
      class="chat-card__media"
      :style="{ backgroundColor: accentColor ?? '#3a3a48' }"
    >
      <img
        v-if="imageSrc"
        class="chat-card__img"
        :src="imageSrc"
        :alt="name"
        draggable="false"
        decoding="async"
      />
      <span v-if="badge" class="chat-card__badge">{{ badge }}</span>
      <span v-if="letter" class="chat-card__letter">{{ letter }}</span>
      <div class="chat-card__info">
        <div class="chat-card__name">{{ name }}</div>
        <div class="chat-card__status">
          <span class="chat-card__status-text">{{ status }}</span>
          <span
            class="chat-card__dot"
            :class="statusAccent ? 'chat-card__dot--accent' : 'chat-card__dot--online'"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  </button>
</template>

<style scoped>
.chat-card {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-radius: 16px;
  -webkit-tap-highlight-color: transparent;
}

.chat-card:active .chat-card__media {
  transform: scale(0.98);
}

.chat-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4.15;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  transition: transform 0.15s ease;
}

.chat-card__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  pointer-events: none;
  -webkit-user-drag: none;
  user-select: none;
}

.chat-card__letter {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.35);
}

.chat-card__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #ff3d5a;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.chat-card__info {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 28px 10px 10px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 0, 0, 0.55) 40%,
    rgba(0, 0, 0, 0.88) 100%
  );
}

.chat-card__name {
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
}

.chat-card__status {
  margin-top: 2px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
}

.chat-card__status-text {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-card__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chat-card__dot--online {
  background: #3ddc84;
}

.chat-card__dot--accent {
  background: #ff5c8a;
}

/* одна карточка на главной (макет) */
.chat-card--featured .chat-card__media {
  aspect-ratio: 16 / 11;
  border-radius: 18px;
}

.chat-card--featured .chat-card__info {
  padding: 40px 14px 14px;
}

.chat-card--featured .chat-card__name {
  font-size: 18px;
}

.chat-card--featured .chat-card__status {
  margin-top: 4px;
  font-size: 13px;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
