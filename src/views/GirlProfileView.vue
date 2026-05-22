<script setup lang="ts">
import { computed, onActivated, ref } from 'vue'
import { useRoute } from 'vue-router'

import PageHeader from '@/components/PageHeader.vue'
import AppButton from '@/components/AppButton.vue'
import CoverImage from '@/components/CoverImage.vue'
import { IMAGE_ASPECT } from '@/constants/imageSlots'
import IconClose from '~icons/solar/close-circle-bold'
import IconHeart from '~icons/solar/heart-bold'
import IconHeartLine from '~icons/solar/heart-linear'
import IconLock from '~icons/solar/lock-bold'
import { GIRLS } from '@/data/girls'
import { isGirlChatCompleted } from '@/composables/useGirlChat'
import {
  getGirlRelationship,
  getNextRelationshipUnlocks,
} from '@/composables/useRelationshipLevel'
import { useAppNavigation } from '@/composables/useAppNavigation'
import EnterItem from '@/components/EnterItem.vue'

const route = useRoute()
const { pushFrom, back } = useAppNavigation()

const girlId = computed(() => {
  const id = Number(route.params.id)
  return Number.isFinite(id) && id > 0 ? id : 1
})

const girl = computed(() => GIRLS.find((g) => g.id === girlId.value) ?? GIRLS[0]!)

const relTick = ref(0)
const relationship = computed(() => {
  relTick.value
  return getGirlRelationship(girlId.value)
})

const dialogComplete = computed(() => relationship.value.chat.complete)

const nextUnlocks = computed(() => getNextRelationshipUnlocks(relationship.value))

onActivated(() => {
  relTick.value++
})

function onBack() {
  back('/chats')
}

function onOpenChat() {
  void pushFrom(`/chat/${girlId.value}`)
}

const gallery = computed(() => girl.value.gallery)
const photosUnlocked = computed(() => relationship.value.chat.complete)

const showPhoto = ref(false)
const photoSrc = ref<string | null>(null)

function openPhoto() {
  if (girl.value.bgImage) {
    photoSrc.value = girl.value.bgImage
    showPhoto.value = true
  }
}

function openGalleryPhoto(src: string) {
  if (!photosUnlocked.value) return
  photoSrc.value = src
  showPhoto.value = true
}

function closePhoto() {
  showPhoto.value = false
  photoSrc.value = null
}
</script>

<template>
  <div class="rel">
    <EnterItem :order="0" solo>
      <PageHeader :title="girl.name" @back="onBack" />
    </EnterItem>

    <div class="scroll page-enter">
      <!-- Top card: avatar + level -->
      <EnterItem :order="1" tag="section" class="card top-card">
        <button
          v-if="girl.bgImage"
          type="button"
          class="avatar avatar--clickable"
          :style="{ background: girl.color }"
          :aria-label="`Фото ${girl.name}`"
          @click="openPhoto"
        >
          <CoverImage
            :src="girl.avatarImage ?? girl.cardImage ?? girl.bgImage!"
            :alt="girl.name"
            class="avatar-cover"
            image-slot="avatar"
            position="center top"
          />
        </button>
        <div v-else class="avatar" :style="{ background: girl.color }">
          <span class="avatar-letter">{{ girl.name.charAt(0) }}</span>
        </div>
        <div class="top-info">
          <div class="rel-label">Уровень отношений</div>
          <div class="rel-level">Уровень {{ relationship.overallLevel }}</div>
        </div>
      </EnterItem>

      <!-- Уровень 1: переписка -->
      <EnterItem :order="2" tag="section" class="card level-card">
        <div class="level-head">
          <span class="level-tag">Уровень 1</span>
          <span class="level-name">Переписка</span>
          <span v-if="relationship.chat.complete" class="level-done">пройден</span>
        </div>
        <div class="hearts-row">
          <div class="hearts">
            <template v-for="i in 5" :key="`chat-${i}`">
              <IconHeart
                v-if="i <= relationship.chat.heartsFilled"
                class="heart heart--on"
              />
              <IconHeartLine v-else class="heart heart--off" />
            </template>
          </div>
          <div class="xp-text">
            {{ relationship.chat.current }} / {{ relationship.chat.max }}
          </div>
        </div>
        <div class="xp-bar">
          <span class="xp-fill xp-fill--chat" :style="{ width: relationship.chat.percent + '%' }" />
        </div>
      </EnterItem>

      <!-- Уровень 2: свидание -->
      <EnterItem
        :order="3"
        tag="section"
        class="card level-card"
        :class="{ 'level-card--locked': !relationship.date.unlocked }"
      >
        <div class="level-head">
          <span class="level-tag">Уровень 2</span>
          <span class="level-name">Свидание</span>
          <span v-if="relationship.date.complete" class="level-done">пройден</span>
        </div>

        <template v-if="relationship.date.unlocked">
          <div class="hearts-row">
            <div class="hearts">
              <template v-for="i in 5" :key="`date-${i}`">
                <IconHeart
                  v-if="i <= relationship.date.heartsFilled"
                  class="heart heart--on heart--date"
                />
                <IconHeartLine v-else class="heart heart--off" />
              </template>
            </div>
            <div class="xp-text">
              {{ relationship.date.current }} / {{ relationship.date.max }}
            </div>
          </div>
          <div class="xp-bar">
            <span
              class="xp-fill xp-fill--date"
              :style="{ width: relationship.date.percent + '%' }"
            />
          </div>
        </template>

        <div v-else class="level-locked">
          <IconLock class="level-locked__icon" />
          <p class="level-locked__text">Заверши переписку, чтобы открыть свидание</p>
        </div>
      </EnterItem>

      <!-- Галерея -->
      <EnterItem v-if="gallery.length" :order="4" tag="section" class="card gallery-card">
        <h3 class="card-title">Личные фото</h3>
        <div class="gallery-grid" :class="{ 'gallery-grid--locked': !photosUnlocked }">
          <button
            v-for="(photo, index) in gallery"
            :key="index"
            type="button"
            class="gallery-item"
            :disabled="!photosUnlocked"
            :aria-label="photosUnlocked ? `Фото ${index + 1}` : 'Фото заблокировано'"
            @click="openGalleryPhoto(photo.full)"
          >
            <CoverImage
              :src="photo.thumb"
              :alt="`${girl.name} — фото ${index + 1}`"
              :aspect-ratio="IMAGE_ASPECT.PORTRAIT"
              image-slot="gallery"
            />
            <div v-if="!photosUnlocked" class="gallery-item__lock">
              <IconLock class="gallery-item__lock-icon" />
            </div>
          </button>
        </div>
        <p v-if="!photosUnlocked" class="gallery-hint">
          Заверши переписку, чтобы открыть личные фото
        </p>
      </EnterItem>

      <!-- unlocks -->
      <EnterItem v-if="nextUnlocks.length" :order="5" tag="section" class="card">
        <h3 class="card-title">После переписки откроется:</h3>
        <ul class="unlock-list">
          <li v-for="u in nextUnlocks" :key="u" class="unlock-item">
            <IconLock class="unlock-icon unlock-icon--pending" />
            <span>{{ u }}</span>
          </li>
        </ul>
      </EnterItem>

      <EnterItem v-if="!dialogComplete" :order="6" class="cta">
        <AppButton variant="violet" @click="onOpenChat">В чат</AppButton>
      </EnterItem>
    </div>

    <Teleport to=".phone-screen">
      <Transition name="photo-fade">
        <div
          v-if="showPhoto && photoSrc"
          class="photo-modal phone-modal-overlay"
          role="dialog"
          aria-modal="true"
          :aria-label="`Фото ${girl.name}`"
          @click.self="closePhoto"
        >
          <button type="button" class="photo-modal__close" aria-label="закрыть" @click="closePhoto">
            <IconClose />
          </button>
          <div class="photo-modal__frame modal-media-frame">
            <img :src="photoSrc" :alt="girl.name" class="photo-modal__img" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.rel {
  width: 100%;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.scroll::-webkit-scrollbar { display: none; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: var(--shadow-sm);
}

.card-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

/* top card */
.top-card {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow);
}

.avatar--clickable {
  border: none;
  outline: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.avatar--clickable:active {
  transform: scale(0.96);
}

.avatar-cover {
  width: 100%;
  height: 100%;
}

.avatar-letter {
  font-size: 32px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}

.top-info { min-width: 0; }

.rel-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: 2px;
}

.rel-level {
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.1;
}

/* levels */
.level-card {
  padding: 14px 16px 16px;
}

.level-card--locked {
  opacity: 0.92;
}

.level-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  margin-bottom: 12px;
}

.level-tag {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--accent);
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
}

.level-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.level-done {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: var(--success);
}

.level-locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 4px 4px;
  text-align: center;
}

.level-locked__icon {
  width: 28px;
  height: 28px;
  color: var(--text-dim);
}

.level-locked__text {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.35;
  max-width: 220px;
}

.hearts-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.hearts {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.heart {
  width: 20px;
  height: 20px;
}

.heart--on { color: var(--accent-2); }
.heart--on.heart--date { color: #ff9f4d; }
.heart--off { color: var(--border-strong); }

.xp-text {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
}

.xp-bar {
  height: 8px;
  border-radius: 999px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  overflow: hidden;
}

.xp-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.xp-fill--chat {
  background: var(--gradient-brand);
}

.xp-fill--date {
  background: linear-gradient(90deg, #ff7a3d 0%, #ffb83d 100%);
}

/* gallery */
.gallery-card .card-title {
  margin-bottom: 12px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.gallery-grid--locked .cover-image {
  filter: blur(6px) brightness(0.75);
}

.gallery-item {
  position: relative;
  border: none;
  outline: none;
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-soft);
  cursor: pointer;
}

.gallery-item:disabled {
  cursor: default;
}

.gallery-item__lock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 6, 16, 0.35);
}

.gallery-item__lock-icon {
  width: 22px;
  height: 22px;
  color: rgba(255, 255, 255, 0.9);
}

.gallery-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.35;
  text-align: center;
}

/* unlocks */
.unlock-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.unlock-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text);
}

.unlock-icon {
  width: 18px;
  height: 18px;
  color: var(--text-dim);
  flex-shrink: 0;
}

.cta {
  margin-top: 6px;
}

.photo-modal {
  position: absolute;
  inset: 0;
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 16px 24px;
}

.photo-modal__close {
  position: absolute;
  top: 52px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  outline: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: var(--text);
  box-shadow: 0 2px 12px rgba(26, 20, 36, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.photo-modal__close svg {
  width: 24px;
  height: 24px;
}

.photo-modal__frame {
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
}

.photo-modal__img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  -webkit-user-drag: none;
}

.photo-fade-enter-active,
.photo-fade-leave-active {
  transition: opacity 0.2s ease;
}

.photo-fade-enter-active .photo-modal__frame,
.photo-fade-leave-active .photo-modal__frame {
  transition: transform 0.2s ease;
}

.photo-fade-enter-from,
.photo-fade-leave-to {
  opacity: 0;
}

.photo-fade-enter-from .photo-modal__frame,
.photo-fade-leave-to .photo-modal__frame {
  transform: scale(0.94);
}
</style>
