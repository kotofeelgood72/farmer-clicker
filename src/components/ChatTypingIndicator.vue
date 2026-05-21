<script setup lang="ts">
defineProps<{
  avatarUrl?: string
  avatarColor?: string
  letter?: string
}>()
</script>

<template>
  <div class="typing" aria-label="печатает">
    <div class="typing__avatar" :style="{ background: avatarColor || '#3a3a48' }">
      <img v-if="avatarUrl" :src="avatarUrl" :alt="letter || ''" class="typing__avatar-img" />
      <span v-else-if="letter" class="typing__letter">{{ letter }}</span>
    </div>
    <div class="typing__bubble">
      <span class="typing__dot" />
      <span class="typing__dot" />
      <span class="typing__dot" />
    </div>
  </div>
</template>

<style scoped>
.typing {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 78%;
}

.typing__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.typing__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.typing__letter {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

.typing__bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 12px 16px;
  background: var(--bubble-them-bg);
  border-radius: 18px;
  border-bottom-left-radius: 6px;
  box-shadow: var(--shadow-sm);
}

.typing__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: typing-bounce 1.1s ease-in-out infinite;
}

.typing__dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing__dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-5px);
    opacity: 1;
  }
}
</style>
