<script setup lang="ts">
import { computed, onActivated, onMounted, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import AppButton from '@/components/AppButton.vue'
import BottomNav from '@/components/BottomNav.vue'
import AvatarPicker from '@/components/AvatarPicker.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EnterItem from '@/components/EnterItem.vue'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { useUserAvatar } from '@/composables/useUserAvatar'
import { useChatHistory } from '@/composables/useChatHistory'
import { resetAllGameProgress } from '@/composables/useGameReset'
import { useAchievements } from '@/composables/useAchievements'
import { usePlayerStats } from '@/composables/usePlayerStats'
import { usePremium } from '@/composables/usePremium'
import { usePremiumAccess } from '@/composables/usePremiumAccess'

import IconPen from '~icons/solar/pen-2-bold'
import IconChart from '~icons/solar/chart-2-bold'
import IconStar from '~icons/solar/star-bold'
import IconCrown from '~icons/solar/crown-bold'
import IconUsersGroup from '~icons/solar/users-group-rounded-bold'
import IconUsersTwo from '~icons/solar/users-group-two-rounded-bold'
import IconHeart from '~icons/solar/heart-bold'
import IconChat from '~icons/solar/chat-round-dots-bold'
import IconRanking from '~icons/solar/ranking-bold'
import IconLock from '~icons/solar/lock-bold'

interface Stat {
  id: string
  label: string
  value: number
  iconKey: 'forms' | 'matches' | 'dialogs' | 'dates'
}

const { pushFrom, back, router } = useAppNavigation()
const { avatars, selectedAvatar, setAvatar } = useUserAvatar()
const { unreadTotal } = useChatHistory()
const { stats: playerStats, refresh: refreshStats } = usePlayerStats()
const { profilePreview, refreshAchievements } = useAchievements()
const { isPremium } = usePremium()
const { openPremiumShop } = usePremiumAccess()
const showAvatarPicker = ref(false)
const showResetConfirm = ref(false)

function refreshProfile() {
  refreshStats()
  refreshAchievements()
}

onMounted(refreshProfile)
onActivated(refreshProfile)

const user = ref({
  nickname: 'Новичок',
})

const stats = computed<Stat[]>(() => [
  { id: 's1', label: 'Анкеты', value: playerStats.value.profiles, iconKey: 'forms' },
  { id: 's2', label: 'Мэтчи', value: playerStats.value.matches, iconKey: 'matches' },
  { id: 's3', label: 'Диалоги', value: playerStats.value.dialogs, iconKey: 'dialogs' },
  { id: 's4', label: 'Свидания', value: playerStats.value.dates, iconKey: 'dates' },
])

function onEditAvatar() {
  if (!isPremium.value) {
    openPremiumShop()
    return
  }
  showAvatarPicker.value = true
}

function onCloseAvatarPicker() {
  showAvatarPicker.value = false
}

function onSelectAvatar(url: string) {
  if (url === selectedAvatar.value) {
    onCloseAvatarPicker()
    return
  }
  setAvatar(url)
  onCloseAvatarPicker()
}

function onBack() {
  back('/main')
}
function onOpenAchievements() {
  void pushFrom('/achievements')
}

function onNav(tab: 'home' | 'chats' | 'swipe' | 'dates' | 'profile') {
  if (tab === 'profile') return
  if (tab === 'home') void router.push('/main')
  else if (tab === 'chats') void router.push('/chats')
  else if (tab === 'swipe') void router.push('/swipe')
  else if (tab === 'dates') void router.push('/dates')
}

function onResetProgress() {
  showResetConfirm.value = true
}

function onConfirmReset() {
  resetAllGameProgress()
  refreshProfile()
}
</script>

<template>
  <div class="profile">
    <div class="cover-bg"></div>
    <EnterItem :order="0" solo>
      <PageHeader title="Профиль" @back="onBack" />
    </EnterItem>
    <div class="scroll page-enter">
      <!-- cover + avatar -->
      <EnterItem :order="1" tag="section" class="cover">
        <button
          type="button"
          class="avatar-wrap"
          :aria-label="isPremium ? 'Изменить аватар' : 'Смена аватара — Премиум'"
          @click="onEditAvatar"
        >
          <span class="avatar">
            <img
              v-if="selectedAvatar"
              :src="selectedAvatar"
              alt=""
              class="avatar-img"
            />
            <span v-else class="avatar-letter">{{ user.nickname.charAt(0) }}</span>
          </span>
          <span
            class="edit-btn"
            :class="{ 'edit-btn--premium': !isPremium }"
            aria-hidden="true"
          >
            <IconCrown v-if="!isPremium" class="edit-icon" />
            <IconPen v-else class="edit-icon" />
          </span>
        </button>
      </EnterItem>

      <!-- identity -->
      <EnterItem :order="2" tag="section" class="identity">
        <div class="nick-row">
          <h1 class="nickname">{{ user.nickname }}</h1>
          <IconCrown
            v-if="isPremium"
            class="nick-badge nick-badge--premium"
            aria-label="Премиум"
          />
          <IconStar v-else class="nick-badge" />
        </div>
      </EnterItem>

      <!-- Stats card -->
      <EnterItem :order="3" tag="section" class="card">
        <div class="card-head">
          <span class="head-icon head-icon--violet">
            <IconChart />
          </span>
          <h2 class="card-title">Статистика</h2>
        </div>

        <div class="stat-grid">
          <div v-for="s in stats" :key="s.id" class="stat-cell">
            <div :class="['stat-icon', `stat-icon--${s.iconKey}`]">
              <IconUsersGroup v-if="s.iconKey === 'forms'" />
              <IconHeart      v-else-if="s.iconKey === 'matches'" />
              <IconChat       v-else-if="s.iconKey === 'dialogs'" />
              <IconUsersTwo   v-else-if="s.iconKey === 'dates'" />
            </div>
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-value">{{ s.value }}</div>
          </div>
        </div>
      </EnterItem>

      <!-- Achievements card -->
      <EnterItem :order="4" tag="section" class="card">
        <div class="card-head">
          <span class="head-icon head-icon--violet">
            <IconStar />
          </span>
          <h2 class="card-title">Достижения</h2>
          <button class="card-more" @click="onOpenAchievements">Все</button>
        </div>

        <div class="ach-grid">
          <div
            v-for="a in profilePreview"
            :key="a.id"
            :class="['ach-cell', { locked: !a.unlocked }]"
          >
            <div class="ach-icon" :style="a.unlocked ? { background: a.gradient } : undefined">
              <IconRanking v-if="a.unlocked" />
              <IconLock v-else class="lock" />
            </div>
            <div class="ach-label">{{ a.label }}</div>
          </div>
        </div>
      </EnterItem>

      <EnterItem :order="5" tag="section" class="reset-section">
        <AppButton variant="danger" @click="onResetProgress">Сброс</AppButton>
      </EnterItem>
    </div>

    <BottomNav
      class="profile__nav"
      active="profile"
      :chats-badge="unreadTotal > 0 ? unreadTotal : undefined"
      @navigate="onNav"
    />

    <AvatarPicker
      v-if="isPremium"
      :show="showAvatarPicker"
      :avatars="avatars"
      :selected="selectedAvatar"
      @close="onCloseAvatarPicker"
      @select="onSelectAvatar"
    />

    <ConfirmDialog
      v-model:open="showResetConfirm"
      title="Сбросить весь прогресс?"
      message="Чаты, диалоги, свидания, статистика, энергия и алмазы вернутся к начальным значениям."
      confirm-label="Сбросить"
      cancel-label="Отмена"
      confirm-variant="danger"
      @confirm="onConfirmReset"
    />
  </div>
</template>

<style scoped>
.profile {
  width: 100%;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* full-bleed cover background — sits behind the header and the cover section */
.cover-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 300px;
  z-index: 0;
  background:
    radial-gradient(circle at 70% 65%, #ffd6a1 0%, transparent 28%),
    linear-gradient(180deg, #f5d6ff 0%, #ffc7e0 45%, #ffd2e8 75%, #fdf7fa 100%);
  pointer-events: none;
}

.cover-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 60%, rgba(253, 247, 250, 0.7) 85%, var(--bg) 100%);
}

/* make the page header transparent so the cover gradient shows through */
.profile :deep(.page-header) {
  background: transparent;
  border-bottom: none;
  position: relative;
  z-index: 1;
  padding-top: 48px;
  padding-bottom: 8px;
}

.scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 12px 20px;
  position: relative;
  z-index: 1;
}

.profile__nav {
  flex-shrink: 0;
}

.reset-section {
  margin: 8px 0 8px;
}
.scroll::-webkit-scrollbar { display: none; }

/* --- cover area (avatar host) --- */
.cover {
  position: relative;
  z-index: 3;
  height: 128px;
}

.avatar-wrap {
  position: absolute;
  bottom: -36px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 120px;
  z-index: 5;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.avatar {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--gradient-brand);
  border: 4px solid var(--surface);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.avatar-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 48px;
  font-weight: 800;
  color: #fff;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-btn {
  position: absolute;
  right: 4px;
  bottom: 4px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gradient-brand-violet);
  border: 3px solid var(--surface);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.edit-btn--premium {
  background: linear-gradient(135deg, #ffb83d 0%, #ff8c42 100%);
}

.edit-icon { width: 14px; height: 14px; }

/* --- identity --- */
.identity {
  position: relative;
  z-index: 1;
  padding: 42px 16px 12px;
  text-align: center;
}

.nick-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.nickname {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
}

.nick-badge--premium {
  width: 22px;
  height: 22px;
  color: #ffb83d;
  filter: drop-shadow(0 0 6px rgba(255, 184, 61, 0.55));
}

.nick-badge {
  width: 16px;
  height: 16px;
  color: var(--accent);
}

/* --- cards --- */
.card {
  margin: 0 0 14px;
  padding: 14px 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.head-icon {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.head-icon svg { width: 14px; height: 14px; color: var(--accent); }

.head-icon--violet { color: var(--accent); }

.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  flex: 1;
}

.card-more {
  margin-left: auto;
  background: transparent;
  border: none;
  outline: none;
  color: var(--accent);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

/* stats */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.stat-cell {
  min-width: 0;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 6px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.stat-icon svg { width: 28px; height: 28px; }

.stat-icon--forms svg   { color: #4dd2f0; }
.stat-icon--matches svg { color: #ff3d5a; }
.stat-icon--dialogs svg { color: #b14bff; }
.stat-icon--dates svg   { color: #3ddc84; }

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}

/* achievements */
.ach-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.ach-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.ach-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #b14bff 0%, #6e3df0 100%);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
}

.ach-icon svg { width: 26px; height: 26px; color: #fff; }

.ach-cell.locked .ach-icon {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  box-shadow: none;
}
.ach-cell.locked .lock { color: var(--text-dim); }

.ach-label {
  font-size: 11px;
  color: var(--text);
  font-weight: 600;
  text-align: center;
}

.ach-cell.locked .ach-label { color: var(--text-dim); }
</style>
