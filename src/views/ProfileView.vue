<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import AvatarPicker from '@/components/AvatarPicker.vue'
import { useUserAvatar } from '@/composables/useUserAvatar'

import IconPen from '~icons/solar/pen-2-bold'
import IconChart from '~icons/solar/chart-2-bold'
import IconStar from '~icons/solar/star-bold'
import IconUsersGroup from '~icons/solar/users-group-rounded-bold'
import IconUsersTwo from '~icons/solar/users-group-two-rounded-bold'
import IconHeart from '~icons/solar/heart-bold'
import IconChat from '~icons/solar/chat-round-dots-bold'
import IconRanking from '~icons/solar/ranking-bold'
import IconShield from '~icons/solar/shield-bold'
import IconLock from '~icons/solar/lock-bold'

interface Stat {
  id: string
  label: string
  value: number
  iconKey: 'forms' | 'matches' | 'dialogs' | 'dates'
}

interface Achievement {
  id: string
  label: string
  iconKey: 'step' | 'social' | 'romantic'
  gradient: string
  unlocked: boolean
}

const router = useRouter()
const { avatars, selectedAvatar, setAvatar } = useUserAvatar()
const showAvatarPicker = ref(false)

const user = ref({
  nickname: 'Новичок',
  level: 5,
  xp: 320,
  xpMax: 700,
})

const stats = ref<Stat[]>([
  { id: 's1', label: 'Анкеты',   value: 12, iconKey: 'forms' },
  { id: 's2', label: 'Мэтчи',    value: 8,  iconKey: 'matches' },
  { id: 's3', label: 'Диалоги',  value: 5,  iconKey: 'dialogs' },
  { id: 's4', label: 'Свидания', value: 3,  iconKey: 'dates' },
])

const achievements = ref<Achievement[]>([
  {
    id: 'a1', label: 'Первый шаг',  iconKey: 'step',     unlocked: true,
    gradient: 'linear-gradient(135deg, #5fb8ff 0%, #5b3df0 100%)',
  },
  {
    id: 'a2', label: 'Общительный', iconKey: 'social',   unlocked: true,
    gradient: 'linear-gradient(135deg, #ff3d8a 0%, #b14bff 100%)',
  },
  {
    id: 'a3', label: 'Романтик',    iconKey: 'romantic', unlocked: true,
    gradient: 'linear-gradient(135deg, #ffb83d 0%, #ff7a3d 100%)',
  },
  {
    id: 'a4', label: 'Скрыто',      iconKey: 'step',     unlocked: false,
    gradient: '',
  },
])

const xpPercent = computed(() => Math.min(100, (user.value.xp / user.value.xpMax) * 100))

function onEditAvatar() {
  showAvatarPicker.value = true
}

function onCloseAvatarPicker() {
  showAvatarPicker.value = false
}

function onSelectAvatar(url: string) {
  setAvatar(url)
}

function onBack() { void router.push('/main') }
function onOpenAchievements() { void router.push('/achievements') }

function onNav(tab: 'home' | 'chats' | 'swipe' | 'dates' | 'profile') {
  if (tab === 'profile') return
  if (tab === 'home') void router.push('/main')
  else if (tab === 'chats') void router.push('/chats')
  else if (tab === 'swipe') void router.push('/swipe')
  else if (tab === 'dates') void router.push('/dates')
}
</script>

<template>
  <div class="profile">
    <div class="cover-bg"></div>
    <PageHeader title="Профиль" @back="onBack" />
    <div class="scroll">
      <!-- cover + avatar -->
      <section class="cover">
        <div class="avatar-wrap">
          <div class="avatar">
            <img
              v-if="selectedAvatar"
              :src="selectedAvatar"
              alt=""
              class="avatar-img"
            />
            <span v-else>{{ user.nickname.charAt(0) }}</span>
          </div>
          <button class="edit-btn" aria-label="изменить" @click="onEditAvatar">
            <IconPen class="edit-icon" />
          </button>
        </div>
      </section>

      <!-- identity -->
      <section class="identity">
        <div class="nick-row">
          <h1 class="nickname">{{ user.nickname }}</h1>
          <IconStar class="nick-badge" />
        </div>
        <div class="level-row">
          <span class="level-label">Уровень</span>
          <span class="level-badge">{{ user.level }}</span>
        </div>
        <div class="xp-row">
          <div class="xp-bar">
            <span class="xp-fill" :style="{ width: xpPercent + '%' }" />
          </div>
          <span class="xp-text">{{ user.xp }} / {{ user.xpMax }}</span>
        </div>
      </section>

      <!-- Stats card -->
      <section class="card">
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
      </section>

      <!-- Achievements card -->
      <section class="card">
        <div class="card-head">
          <span class="head-icon head-icon--violet">
            <IconStar />
          </span>
          <h2 class="card-title">Достижения</h2>
          <button class="card-more" @click="onOpenAchievements">Все</button>
        </div>

        <div class="ach-grid">
          <div
            v-for="a in achievements"
            :key="a.id"
            :class="['ach-cell', { locked: !a.unlocked }]"
          >
            <div class="ach-icon" :style="a.unlocked ? { background: a.gradient } : undefined">
              <template v-if="a.unlocked">
                <IconRanking v-if="a.iconKey === 'step'" />
                <IconUsersGroup v-else-if="a.iconKey === 'social'" />
                <IconShield v-else-if="a.iconKey === 'romantic'" />
              </template>
              <IconLock v-else class="lock" />
            </div>
            <div class="ach-label">{{ a.label }}</div>
          </div>
        </div>
      </section>
    </div>

    <BottomNav active="profile" :chats-badge="3" @navigate="onNav" />

    <AvatarPicker
      :show="showAvatarPicker"
      :avatars="avatars"
      :selected="selectedAvatar"
      @close="onCloseAvatarPicker"
      @select="onSelectAvatar"
    />
  </div>
</template>

<style scoped>
.profile {
  width: 100%;
  height: 100%;
  background: #0a0a14;
  color: #fff;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
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
    radial-gradient(circle at 70% 65%, #ffb83d 0%, transparent 22%),
    linear-gradient(180deg, #2a1454 0%, #5b3df0 45%, #b14bff 75%, #1f0d3a 100%);
  pointer-events: none;
}

.cover-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 60%, rgba(10, 10, 20, 0.6) 85%, #0a0a14 100%);
}

/* make the page header transparent so the cover gradient shows through */
.profile :deep(.page-header) {
  background: transparent;
  border-bottom: none;
  position: relative;
  z-index: 1;
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 12px;
  position: relative;
  z-index: 1;
}
.scroll::-webkit-scrollbar { display: none; }

/* --- cover area (avatar host) --- */
.cover {
  position: relative;
  height: 140px;
}

.avatar-wrap {
  position: absolute;
  bottom: -36px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 120px;
  z-index: 2;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a3550 0%, #2a1f30 100%);
  border: 4px solid #14141f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
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
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b14bff 0%, #5b3df0 100%);
  border: 3px solid #0a0a14;
  outline: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.edit-icon { width: 14px; height: 14px; }

/* --- identity --- */
.identity {
  padding: 48px 16px 18px;
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
  color: #fff;
}

.nick-badge {
  width: 16px;
  height: 16px;
  color: #b14bff;
}

.level-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

.level-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 500;
}

.level-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(177, 75, 255, 0.18);
  border: 1px solid rgba(177, 75, 255, 0.45);
  color: #c79bff;
  font-size: 11px;
  font-weight: 800;
}

.xp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 0 4px;
}

.xp-bar {
  flex: 1;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.xp-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #ff3d8a 0%, #b14bff 60%, #5b3df0 100%);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.xp-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

/* --- cards --- */
.card {
  margin: 0 12px 14px;
  padding: 14px 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
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

.head-icon svg { width: 14px; height: 14px; color: #b14bff; }

.head-icon--violet { color: #b14bff; }

.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  flex: 1;
}

.card-more {
  margin-left: auto;
  background: transparent;
  border: none;
  outline: none;
  color: #b14bff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

/* stats */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-cell {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 12px 4px 10px;
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
  color: rgba(255, 255, 255, 0.55);
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: none;
}
.ach-cell.locked .lock { color: rgba(255, 255, 255, 0.4); }

.ach-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  text-align: center;
}

.ach-cell.locked .ach-label { color: rgba(255, 255, 255, 0.35); }
</style>
