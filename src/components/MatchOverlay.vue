<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import swipeBgUrl from '@/assets/ui/swipe-bg.png'
import { useUserAvatar } from '@/composables/useUserAvatar'

const { selectedAvatar } = useUserAvatar()

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
      <div
        v-if="show"
        class="match-overlay phone-modal-overlay"
        :style="{ '--swipe-bg': `url(${swipeBgUrl})` }"
      >
        <div class="content">
          <div class="hero">
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
                <img
                  v-if="selectedAvatar"
                  :src="selectedAvatar"
                  alt="Вы"
                  class="avatar-img"
                />
                <span v-else>{{ myLetter || 'Я' }}</span>
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
  background-color: var(--bg);
  background-image: var(--swipe-bg);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
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
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatars {
  display: flex;
  align-items: center;
}

.avatar {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  border: 4px solid var(--surface);
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
  margin: 0 0 14px;
  font-size: 32px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: 0.3px;
}

.subtitle {
  margin: 0 0 32px;
  font-size: 18px;
  color: var(--text-muted);
  line-height: 1.45;
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
