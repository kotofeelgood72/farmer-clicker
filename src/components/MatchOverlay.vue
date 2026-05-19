<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'

defineProps<{
  show: boolean
  myColor?: string
  myLetter?: string
  theirName: string
  theirColor?: string
  theirLetter?: string
  theirImage?: string
}>()

const emit = defineEmits<{
  (e: 'message'): void
  (e: 'close'): void
}>()

function onMessage() { emit('message') }
function onClose() { emit('close') }
</script>

<template>
  <Teleport to=".phone-screen">
    <Transition name="match-fade">
      <div v-if="show" class="match-overlay">
        <div class="content">
          <div class="hero">
            <svg class="hero-heart" viewBox="0 0 220 200" fill="none" aria-hidden="true">
              <path
                d="M110 188 C 50 150, 10 110, 10 65 C 10 35, 35 12, 65 12 C 85 12, 100 25, 110 42 C 120 25, 135 12, 155 12 C 185 12, 210 35, 210 65 C 210 110, 170 150, 110 188 Z"
                stroke="url(#heartGrad)"
                stroke-width="3"
                fill="none"
                filter="url(#heartGlow)"
              />
              <defs>
                <linearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#ff3d8a" />
                  <stop offset="100%" stop-color="#b14bff" />
                </linearGradient>
                <filter id="heartGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>

            <div class="avatars">
              <div class="avatar avatar--them" :style="{ background: theirColor || '#7d5a3a' }">
                <img
                  v-if="theirImage"
                  :src="theirImage"
                  :alt="theirName"
                  class="avatar-img"
                />
                <span v-else>{{ theirLetter || theirName.charAt(0) }}</span>
              </div>
              <div class="avatar avatar--me" :style="{ background: myColor || '#4a3550' }">
                <span>{{ myLetter || 'Я' }}</span>
              </div>
            </div>
          </div>

          <h2 class="title">Это совпадение!</h2>
          <p class="subtitle">Вы и {{ theirName }} поставили лайки<br />друг другу</p>

          <div class="match-actions">
            <AppButton variant="primary" @click="onMessage">Написать ей</AppButton>
            <AppButton variant="secondary" @click="onClose">Продолжить знакомство</AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.match-overlay {
  position: absolute;
  inset: 0;
  z-index: 500;
  pointer-events: auto;
  background: rgba(8, 6, 16, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}

.content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  pointer-events: auto;
}

.hero {
  position: relative;
  width: 260px;
  height: 220px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-heart {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 20px rgba(255, 61, 138, 0.45));
  animation: heartbeat 2.4s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

.avatars {
  position: relative;
  display: flex;
  align-items: center;
  z-index: 1;
}

.avatar {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  border: 4px solid #14141f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.75);
  overflow: hidden;
  box-shadow: 0 0 30px rgba(255, 61, 138, 0.35);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar--them { transform: translateX(14px); }
.avatar--me { transform: translateX(-14px); }

.title {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.3px;
}

.subtitle {
  margin: 0 0 32px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.5;
}

.match-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 320px;
  position: relative;
  z-index: 2;
}

/* enter/leave */
.match-fade-enter-active,
.match-fade-leave-active {
  transition: opacity 0.25s ease;
}
.match-fade-enter-from,
.match-fade-leave-to { opacity: 0; }
.match-fade-enter-active .content,
.match-fade-leave-active .content {
  transition: transform 0.35s cubic-bezier(.4, 1.6, .6, 1);
}
.match-fade-enter-from .content { transform: scale(0.88); }
.match-fade-leave-to .content { transform: scale(0.94); }
</style>
