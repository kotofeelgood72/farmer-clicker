<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import ContinueChatCard from '@/components/ContinueChatCard.vue'

import { Swiper, SwiperSlide } from 'swiper/vue'
import { GIRLS } from '@/data/girls'
import { useChatHistory } from '@/composables/useChatHistory'
import { getRelationshipLevel } from '@/composables/useRelationshipLevel'
import 'swiper/css'

import tileHeart from '@/assets/ui/circle-heart.png'
import tileShield from '@/assets/ui/checkmark.png'
import tileMedal from '@/assets/ui/medalion.png'

import rewardStone from '@/assets/ui/stone.png'
import rewardEnergy from '@/assets/ui/energy.png'
import rewardGemstone from '@/assets/ui/gemstone.png'
import rewardStones from '@/assets/ui/stones.png'
import rewardPeoples from '@/assets/ui/peoples.png'

const tileIcons: Record<string, string> = {
  heart: tileHeart,
  shield: tileShield,
  shop: tileMedal,
}

const router = useRouter()

const user = ref({
  nickname: 'Новичок',
  level: 5,
  energy: 5,
  energyMax: 5,
  diamonds: 120,
})

const { recentChats } = useChatHistory()

interface ContinueChatItem {
  girlId: number
  name: string
  status: string
  statusAccent: boolean
  badge?: number
  letter?: string
  mediaStyle: Record<string, string | undefined>
}

const continueChats = computed<ContinueChatItem[]>(() =>
  recentChats.value.map((session) => {
    const girl = GIRLS.find((g) => g.id === session.girlId)
    const image = girl?.image
    return {
      girlId: session.girlId,
      name: girl?.name ?? '???',
      status: `Уровень ${getRelationshipLevel(session.girlId)}`,
      statusAccent: session.unread > 0,
      badge: session.unread > 0 ? session.unread : undefined,
      letter: image ? undefined : girl?.name.charAt(0),
      mediaStyle: {
        backgroundColor: girl?.color ?? '#3a3a48',
        backgroundImage: image ? `url(${image})` : undefined,
      },
    }
  }),
)

const unreadTotal = computed(() =>
  recentChats.value.reduce((sum, s) => sum + s.unread, 0),
)

function onOpenChat(girlId: number) {
  void router.push(`/chat/${girlId}`)
}

interface Reward {
  day: number
  icon: string
  amount: number
  claimed?: boolean
  current?: boolean
}

const dailyRewards = ref<Reward[]>([
  { day: 1, icon: rewardStone, amount: 100, claimed: true },
  { day: 2, icon: rewardEnergy, amount: 1, claimed: true },
  { day: 3, icon: rewardGemstone, amount: 0, current: true },
  { day: 4, icon: rewardStone, amount: 1 },
  { day: 5, icon: rewardStones, amount: 200 },
  { day: 6, icon: rewardEnergy, amount: 5 },
  { day: 7, icon: rewardPeoples, amount: 0 },
])

const tiles = ref([
  { id: 'dates', title: 'Свидания', subtitle: 'Новое событие', icon: 'heart' as const },
  { id: 'tasks', title: 'Задания', subtitle: 'Доступно 4', icon: 'shield' as const },
  { id: 'shop', title: 'Магазин', subtitle: 'Алмазы', icon: 'shop' as const },
])

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
      :level="user.level"
      :energy="user.energy"
      :energy-max="user.energyMax"
      :diamonds="user.diamonds"
      @profile="router.push('/profile')"
    />

    <div class="scroll">
      <!-- Продолжить общение -->
      <section v-if="continueChats.length" class="section section--continue">
        <h2 class="section-title">Продолжить общение</h2>
        <Swiper class="continue-row" :slides-per-view="2.65" :space-between="10">
          <SwiperSlide v-for="chat in continueChats" :key="chat.girlId">
            <ContinueChatCard
              :name="chat.name"
              :status="chat.status"
              :status-accent="chat.statusAccent"
              :badge="chat.badge"
              :letter="chat.letter"
              :media-style="chat.mediaStyle"
              @open="onOpenChat(chat.girlId)"
            />
          </SwiperSlide>
        </Swiper>
      </section>

      <!-- Ежедневные награды -->
      <section class="section section--rewards">
        <div class="section-head">
          <h2 class="section-title">Ежедневные награды</h2>
          <span class="section-meta">День 3 из 7</span>
        </div>
        <Swiper class="rewards-row" :slides-per-view="4.5" :space-between="6">
          <SwiperSlide v-for="r in dailyRewards" :key="r.day">
            <div :class="['reward', { active: r.current, claimed: r.claimed }]">
              <div class="reward-day">День {{ r.day }}</div>
              <div class="reward-icon-wrap">
                <div v-if="r.current" class="reward-glow" />
                <img :src="r.icon" :alt="`День ${r.day}`" class="reward-img" />
              </div>
              <div class="reward-amount">
                <template v-if="r.current || r.amount === 0">День {{ r.day }}</template>
                <template v-else>{{ r.amount }}</template>
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
  background: #0a0a14;
  color: #fff;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 12px;
}

.scroll::-webkit-scrollbar {
  display: none;
}

.section {
  margin-bottom: 18px;
}

.section--rewards {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 18px;
  padding: 14px 12px 12px;
  overflow-x: hidden;
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
  color: #fff;
  margin: 0 0 10px;
}

.section-head .section-title {
  margin: 0;
}

.section-meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
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
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 6px 2px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.reward.claimed {
  opacity: 0.5;
}

.reward.active {
  background: rgba(255, 122, 61, 0.06);
}

.reward-day {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  line-height: 1;
}

.reward.active .reward-day {
  color: #ffb83d;
  font-weight: 600;
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

.reward-amount {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.reward.active .reward-amount {
  color: #ffb83d;
}

/* Tiles */
.tiles-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.tile {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 14px 8px 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
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
  color: #fff;
}

.tile-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
