<script setup lang="ts">
import { computed, nextTick, onActivated, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import BackgroundLobbyChat from '@/components/BackgroundLobbyChat.vue'
import ContinueChatCard from '@/components/ContinueChatCard.vue'

import { Swiper, SwiperSlide } from 'swiper/vue'
import { GIRLS } from '@/data/girls'
import { useChatHistory } from '@/composables/useChatHistory'
import { useDailyRewards } from '@/composables/useDailyRewards'
import { useDiamonds } from '@/composables/useDiamonds'
import { useEnergy } from '@/composables/useEnergy'
import { getRelationshipLevel } from '@/composables/useRelationshipLevel'
import 'swiper/css'

import tileHeart from '@/assets/ui/circle-heart.png'
import tileShield from '@/assets/ui/checkmark.png'
import tileMedal from '@/assets/ui/medalion.png'

import rewardStone from '@/assets/ui/stone.png'
import rewardEnergy from '@/assets/ui/energy.png'
import rewardGemstone from '@/assets/ui/gemstone.png'
import rewardStones from '@/assets/ui/stones.png'

import IconCheck from '~icons/solar/check-circle-bold'
import IconLock from '~icons/solar/lock-bold'

const tileIcons: Record<string, string> = {
  heart: tileHeart,
  shield: tileShield,
  shop: tileMedal,
}

const router = useRouter()
const { energy } = useEnergy()
const { diamonds } = useDiamonds()
const { streakDay, cards, canClaimToday, syncAndShowModal, openModal } = useDailyRewards()

function refreshDailyModal() {
  syncAndShowModal()
}

onMounted(() => {
  void nextTick(refreshDailyModal)
})

onActivated(refreshDailyModal)

const user = { nickname: 'Новичок' }

const rewardIcons: Record<number, string> = {
  1: rewardStone,
  2: rewardEnergy,
  3: rewardGemstone,
  4: rewardEnergy,
  5: rewardStones,
  6: rewardEnergy,
  7: rewardStones,
}

const { recentChats, unreadTotal } = useChatHistory()

interface ContinueChatItem {
  girlId: number
  name: string
  status: string
  statusAccent: boolean
  badge?: number
  letter?: string
  imageSrc?: string
  accentColor: string
}

const continueChats = computed<ContinueChatItem[]>(() =>
  recentChats.value.map((session) => {
    const girl = GIRLS.find((g) => g.id === session.girlId)
    const photo = girl?.bgImage ?? girl?.image
    return {
      girlId: session.girlId,
      name: girl?.name ?? '???',
      status: `Уровень ${getRelationshipLevel(session.girlId)}`,
      statusAccent: session.unread > 0,
      badge: session.unread > 0 ? session.unread : undefined,
      letter: photo ? undefined : girl?.name.charAt(0),
      imageSrc: photo,
      accentColor: girl?.color ?? '#3a3a48',
    }
  }),
)

function onOpenChat(girlId: number) {
  void router.push(`/chat/${girlId}`)
}

const tiles = [
  { id: 'dates', title: 'Свидания', subtitle: 'Новое событие', icon: 'heart' as const },
  { id: 'tasks', title: 'Задания', subtitle: 'Доступно 4', icon: 'shield' as const },
  { id: 'shop', title: 'Магазин', subtitle: 'Алмазы', icon: 'shop' as const },
]

function onOpenDailyRewards() {
  if (canClaimToday.value) openModal()
}

function onNav(tab: 'home' | 'chats' | 'swipe' | 'dates' | 'profile') {
  if (tab === 'home') return
  if (tab === 'chats') void router.push('/chats')
  else if (tab === 'swipe') void router.push('/swipe')
  else if (tab === 'dates') void router.push('/dates')
  else if (tab === 'profile') void router.push('/profile')
}

function onTile(id: string) {
  if (id === 'dates') void router.push('/dates')
  else if (id === 'shop') void router.push('/shop')
}
</script>

<template>
  <div class="main">
    <AppHeader
      :nickname="user.nickname"
      :energy="energy"
      :diamonds="diamonds"
      @profile="router.push('/profile')"
      @shop="router.push({ path: '/shop', query: { tab: 'diamonds' } })"
      @shop-energy="router.push({ path: '/shop', query: { tab: 'energy' } })"
    />

    <div class="scroll">
      <!-- Продолжить общение -->
      <section v-if="continueChats.length" class="section section--continue">
        <h2 class="section-title">Продолжить общение</h2>
        <Swiper
          class="continue-row"
          slides-per-view="auto"
          :space-between="10"
          :round-lengths="true"
        >
          <SwiperSlide v-for="chat in continueChats" :key="chat.girlId">
            <ContinueChatCard
              :name="chat.name"
              :status="chat.status"
              :status-accent="chat.statusAccent"
              :badge="chat.badge"
              :letter="chat.letter"
              :image-src="chat.imageSrc"
              :accent-color="chat.accentColor"
              @open="onOpenChat(chat.girlId)"
            />
          </SwiperSlide>
        </Swiper>
      </section>

      <!-- Ежедневные награды -->
      <section
        class="section section--rewards"
        :class="{ 'section--rewards-tappable': canClaimToday }"
        @click="onOpenDailyRewards"
      >
        <div class="section-head">
          <h2 class="section-title">Ежедневные награды</h2>
          <span class="section-meta">День {{ streakDay }} из 7</span>
        </div>
        <Swiper class="rewards-row" :slides-per-view="4.5" :space-between="6">
          <SwiperSlide v-for="r in cards" :key="r.day">
            <div
              :class="[
                'reward',
                {
                  active: r.status === 'today',
                  claimed: r.status === 'claimed',
                  locked: r.status === 'locked',
                },
              ]"
            >
              <div class="reward-day">
                {{ r.status === 'today' ? 'Сегодня' : `День ${r.day}` }}
              </div>
              <div class="reward-icon-wrap">
                <div v-if="r.status === 'today'" class="reward-glow" />
                <img
                  :src="rewardIcons[r.day]"
                  :alt="`День ${r.day}`"
                  class="reward-img"
                  :class="{ 'reward-img--claimed': r.status === 'claimed' }"
                />
              </div>
              <div class="reward-foot">
                <span v-if="r.status !== 'claimed'" class="reward-amount">{{ r.amount }}</span>
                <IconCheck
                  v-if="r.status === 'claimed'"
                  class="reward-status reward-status--done"
                />
                <IconCheck
                  v-else-if="r.status === 'today'"
                  class="reward-status reward-status--today"
                />
                <IconLock
                  v-else-if="r.status === 'locked'"
                  class="reward-status reward-status--lock"
                />
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>

      <!-- Tiles -->
      <section class="section">
        <div class="tiles-row">
          <div v-for="t in tiles" :key="t.id" class="tile" @click="onTile(t.id)">
            <div class="tile-icon">
              <img :src="tileIcons[t.icon]" :alt="t.title" />
            </div>
            <div class="tile-title">{{ t.title }}</div>
            <div class="tile-subtitle">{{ t.subtitle }}</div>
          </div>
        </div>
      </section>

      <BackgroundLobbyChat />
    </div>

    <BottomNav
      active="home"
      :chats-badge="unreadTotal > 0 ? unreadTotal : undefined"
      @navigate="onNav"
    />
  </div>
</template>

<style scoped>
.main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

.scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 16px 8px;
  display: flex;
  flex-direction: column;
}

.scroll::-webkit-scrollbar {
  display: none;
}

.section {
  margin-bottom: 18px;
  flex-shrink: 0;
}

.section--rewards {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 14px 12px 12px;
  overflow-x: hidden;
  box-shadow: var(--shadow-sm);
}

.section--rewards-tappable {
  cursor: pointer;
}

.section--rewards .section-head {
  margin-bottom: 12px;
  padding: 0 2px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 10px;
}

.section-head .section-title {
  margin: 0;
}

.section-meta {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.section--continue .section-title {
  margin-bottom: 12px;
}

.continue-row {
  width: 100%;
  overflow: visible;
}

.continue-row :deep(.swiper-slide) {
  width: 132px;
  height: auto;
}

/* Rewards */
.rewards-row {
  width: 100%;
  overflow: visible;
}

.rewards-row :deep(.swiper-slide) {
  height: auto;
}

.reward {
  position: relative;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 6px 2px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.reward.claimed {
  background: rgba(46, 199, 107, 0.1);
  border-color: rgba(46, 199, 107, 0.4);
}

.reward.claimed .reward-day {
  color: var(--success);
  font-weight: 700;
}

.reward.locked {
  opacity: 0.5;
}

.reward.active {
  background: rgba(255, 184, 61, 0.12);
  border-color: rgba(255, 184, 61, 0.4);
}

.reward-day {
  font-size: 9px;
  color: var(--text-muted);
  font-weight: 500;
  line-height: 1;
}

.reward.active .reward-day {
  color: #d18a2c;
  font-weight: 700;
}

.reward-icon-wrap {
  position: relative;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reward-glow {
  position: absolute;
  inset: -4px;
  background: radial-gradient(
    circle,
    rgba(255, 122, 61, 0.55) 0%,
    rgba(255, 61, 138, 0.35) 45%,
    transparent 70%
  );
  border-radius: 50%;
  filter: blur(4px);
  z-index: 0;
  animation: rewardPulse 2s ease-in-out infinite;
}

@keyframes rewardPulse {
  0%,
  100% {
    opacity: 0.85;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}

.reward-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: relative;
  z-index: 1;
  -webkit-user-drag: none;
}

.reward.active .reward-img {
  filter: drop-shadow(0 0 6px rgba(255, 61, 138, 0.6));
}

.reward-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 14px;
}

.reward-amount {
  font-size: 10px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.reward.active .reward-amount {
  color: #d18a2c;
}

.reward-img--claimed {
  opacity: 0.55;
}

.reward-status {
  width: 12px;
  height: 12px;
}

.reward-status--done {
  color: var(--success);
}

.reward-status--today {
  color: #ffb83d;
}

.reward-status--lock {
  color: #d4a84a;
  width: 10px;
  height: 10px;
}

/* Tiles */
.tiles-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.tile {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px 8px 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}

.tile-icon {
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 0 6px;
}

.tile-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  -webkit-user-drag: none;
}

.tile-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.tile-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
