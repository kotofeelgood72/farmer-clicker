<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import PageHeader from '@/components/PageHeader.vue'
import CoverImage from '@/components/CoverImage.vue'
import { IMAGE_ASPECT } from '@/constants/imageSlots'
import BottomNav from '@/components/BottomNav.vue'
import EnterItem from '@/components/EnterItem.vue'

import IconEyeClosed from '~icons/solar/eye-closed-bold'
import {
  generateDailyDates,
  msUntilNextRotation,
  type DailyDate,
} from '@/data/dates'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { runAfterInterstitial } from '@/composables/useAdPlacements'
import { useChatHistory } from '@/composables/useChatHistory'
const { unreadTotal } = useChatHistory()

type Tab = 'available' | 'past'

const { pushFrom, back, router } = useAppNavigation()

const tab = ref<Tab>('available')
const dailyDates = ref<DailyDate[]>(generateDailyDates())

let rotationTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRotation() {
  if (rotationTimer) clearTimeout(rotationTimer)
  rotationTimer = setTimeout(() => {
    dailyDates.value = generateDailyDates()
    scheduleRotation()
  }, msUntilNextRotation())
}

onMounted(() => {
  scheduleRotation()
})

onBeforeUnmount(() => {
  if (rotationTimer) clearTimeout(rotationTimer)
})

const visible = computed(() =>
  tab.value === 'available'
    ? dailyDates.value.filter((d) => d.status !== 'past')
    : dailyDates.value.filter((d) => d.status === 'past'),
)

/** Есть хотя бы одна девушка с завершённым чатом — можно идти на свидание. */
const hasDateAgreement = computed(() =>
  dailyDates.value.some((d) => d.status !== 'locked'),
)

const showNoDateModal = computed(
  () => tab.value === 'available' && !hasDateAgreement.value,
)

function onBack() {
  back('/main')
}

function onFindGirl() {
  void router.push('/swipe')
}

function onOpen(item: DailyDate) {
  if (item.status === 'locked') return
  runAfterInterstitial(() => void pushFrom(`/date/${item.id}`), 'date_start')
}

function onNav(t: 'home' | 'chats' | 'swipe' | 'dates' | 'profile') {
  if (t === 'dates') return
  if (t === 'home') void router.push('/main')
  else if (t === 'chats') void router.push('/chats')
  else if (t === 'swipe') void router.push('/swipe')
  else if (t === 'profile') void router.push('/profile')
}
</script>

<template>
  <div class="dates">
    <EnterItem :order="0" solo>
      <PageHeader title="Свидания" @back="onBack" />
    </EnterItem>

    <div class="dates-main">
    <div class="scroll page-enter">
      <EnterItem :order="1" class="tabs">
        <button
          :class="['tab', { active: tab === 'available' }]"
          @click="tab = 'available'"
        >
          Доступные
        </button>
        <button
          :class="['tab', { active: tab === 'past' }]"
          @click="tab = 'past'"
        >
          Прошедшие
        </button>
      </EnterItem>

      <div :key="tab" class="list">
        <EnterItem
          v-for="(d, i) in visible"
          :key="d.id"
          :index="i"
          :base="2"
        >
        <button
          :class="['card', { locked: d.status === 'locked' }]"
          :disabled="d.status === 'locked'"
          @click="onOpen(d)"
        >
          <div
            class="thumb"
            :style="{ background: d.girlColor, aspectRatio: IMAGE_ASPECT.PORTRAIT }"
          >
            <CoverImage
              v-if="d.locationImage"
              fill
              image-slot="card"
              :src="d.locationImage"
              :alt="d.title"
              class="thumb-bg"
            />
            <CoverImage
              v-if="d.girlImage"
              fill
              image-slot="preview"
              fit="contain"
              position="bottom center"
              :src="d.girlImage"
              :alt="d.girlName"
              class="thumb-girl"
            />
            <span v-else class="thumb-letter">{{ d.girlName.charAt(0) }}</span>

            <span v-if="d.status === 'new'" class="badge-new">НОВОЕ</span>
            <span v-else-if="d.status === 'locked'" class="badge-lock" aria-hidden="true">
              <IconEyeClosed class="badge-lock__icon" />
            </span>

            <div class="body" :class="{ 'body--locked': d.status === 'locked' }">
              <template v-if="d.status === 'locked'">
                <p class="locked-hint">Вы ещё не знакомы с ней</p>
              </template>
              <template v-else>
                <div class="title">{{ d.title }}</div>
                <div class="character">{{ d.girlName }}</div>
              </template>
            </div>
          </div>
        </button>
        </EnterItem>
      </div>

      <EnterItem v-if="!visible.length" :order="2" class="empty">Пока ничего нет</EnterItem>
    </div>

    <div v-if="showNoDateModal" class="dates-overlay">
      <div class="dates-overlay-card modal-surface">
        <div class="dates-overlay-emoji">💬</div>
        <h2 class="dates-overlay-title">Пока рано на свидание</h2>
        <p class="dates-overlay-text">
          Вы ещё ни с кем не договорились на свидание. Сначала завершите переписку с девушкой.
        </p>
        <AppButton variant="primary" @click="onFindGirl">Найти девушку</AppButton>
      </div>
    </div>
    </div>

    <BottomNav
      active="dates"
      :chats-badge="unreadTotal > 0 ? unreadTotal : undefined"
      @navigate="onNav"
    />
  </div>
</template>

<style scoped>
.dates {
  width: 100%;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
}

.dates-main {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px 12px;
}
.scroll::-webkit-scrollbar { display: none; }

.dates-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--modal-overlay-bg);
  backdrop-filter: blur(var(--modal-overlay-blur)) saturate(1.15);
  -webkit-backdrop-filter: blur(var(--modal-overlay-blur)) saturate(1.15);
  animation: dates-overlay-fade 0.32s ease-out;
}

@keyframes dates-overlay-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dates-overlay-card {
  width: 100%;
  max-width: 320px;
  padding: 28px 24px 24px;
  background: var(--surface);
  border-radius: 22px;
  text-align: center;
  animation: dates-overlay-pop 0.4s cubic-bezier(0.22, 1.2, 0.36, 1);
}

@keyframes dates-overlay-pop {
  from { opacity: 0; transform: translateY(20px) scale(0.92); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.dates-overlay-emoji {
  font-size: 44px;
  line-height: 1;
  margin-bottom: 14px;
}

.dates-overlay-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
}

.dates-overlay-text {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.45;
}

/* Tabs */
.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.tab {
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  outline: none;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.tab.active {
  background: var(--gradient-brand-violet);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(177, 75, 255, 0.25);
}

/* List — 2-column grid, текст поверх изображения снизу */
.list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.list :deep(.enter-item) {
  width: 100%;
  min-width: 0;
}

.card {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: inherit;
  outline: none;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform 0.1s ease, opacity 0.15s ease;
}

.card:active:not(.locked) { transform: scale(0.98); }

.card.locked {
  cursor: not-allowed;
}

.thumb {
  position: relative;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  isolation: isolate;
}

.thumb :deep(.thumb-bg) {
  z-index: 0;
  filter: brightness(0.75);
}

.thumb :deep(.thumb-girl) {
  z-index: 1;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45));
}

.card.locked .thumb :deep(.thumb-bg) {
  filter: blur(5px) brightness(0.55);
}

.card.locked .thumb :deep(.thumb-girl) {
  filter: blur(4px) brightness(0.75) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
}

.thumb-letter {
  position: relative;
  z-index: 1;
  font-size: 44px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.7);
  padding-bottom: 12px;
}

.body {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  min-width: 0;
  padding: 28px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.72) 0%,
    rgba(0, 0, 0, 0.38) 55%,
    transparent 100%
  );
  pointer-events: none;
}

.title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.character {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.badge-new {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--danger);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.badge-lock {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-lock__icon {
  width: 16px;
  height: 16px;
  color: #fff;
}

.body--locked {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  text-align: center;
  padding-bottom: 14px;
}

.locked-hint {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}

.empty {
  padding: 40px 0;
  text-align: center;
  color: var(--text-dim);
  font-size: 13px;
}
</style>
