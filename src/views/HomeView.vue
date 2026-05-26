<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import bgLevel1 from '@/assets/level/1.png'
import bgLevel2 from '@/assets/level/2.png'
import bgLevel3 from '@/assets/level/3.png'
import bgLevel4 from '@/assets/level/4.png'
import bgLevel5 from '@/assets/level/5.png'
import bgFull from '@/assets/full-bg.png'
import characterImg from '@/assets/character.png'
import iconBlacksmith from '@/assets/blacksmith.png'
import iconLevelUp from '@/assets/level-up.png'
import iconSword from '@/assets/sword.png'
import iconScroll from '@/assets/ancient-scroll.png'
import iconCoin from '@/assets/coin.png'
import iconStone from '@/assets/stone.png'
import iconClover from '@/assets/clever.png'
import imgAnvil from '@/assets/nako.png'
import imgHammer from '@/assets/molot.png'
import navChests from '@/assets/nav-item-1.png'
import navShop from '@/assets/nav-item-2.png'
import navEvents from '@/assets/nav-item-3.png'
import navSettings from '@/assets/nav-item-4.png'
import UpgradesModal from '@/components/UpgradesModal.vue'
import ItemsModal from '@/components/ItemsModal.vue'
import OrdersModal from '@/components/OrdersModal.vue'
import AchievementsModal from '@/components/AchievementsModal.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import ForgeView from '@/components/ForgeView.vue'
import ChestsModal, { type ChestReward } from '@/components/ChestsModal.vue'
import ChestRewardPopup from '@/components/ChestRewardPopup.vue'
import ShopModal from '@/components/ShopModal.vue'
import {
  preloadAudio,
  playSfx,
  startMusic,
  stopMusic,
  setMusicEnabled,
  setSfxEnabled,
  unlockAudioOnGesture,
} from '@/audio/sounds'
import { showInterstitial } from '@/ads/ads'
import { gameplayPause, gameplayResume, tryRequestReview, getLang } from '@/yandex/sdk'
import { fmt } from '@/utils/fmt'
import { watch } from 'vue'

const game = useGameStore()

const showUpgrades = ref(false)
const showItems = ref(false)
const showOrders = ref(false)
const showAchievements = ref(false)
const showSettings = ref(false)
const showChests = ref(false)
const showShop = ref(false)
const chestReward = ref<ChestReward | null>(null)

const route = useRoute()
const router = useRouter()
const onForge = computed(() => route.path === '/forge')
function openForge() {
  router.push('/forge')
}
function closeForge() {
  router.push('/')
}

let last = performance.now()
let raf = 0
let saveTimer = 0
let nowTimer = 0
const nowTs = ref(Date.now())
const adsPaused = ref(false)

function loop() {
  const now = performance.now()
  const dt = (now - last) / 1000
  last = now
  if (!adsPaused.value) game.tick(dt)
  raf = requestAnimationFrame(loop)
}

function onAdsPause() {
  adsPaused.value = true
  // Mute everything for the duration of the ad (Yandex requirement).
  setMusicEnabled(false)
  setSfxEnabled(false)
  gameplayPause()
}
function onAdsResume() {
  adsPaused.value = false
  // Reset dt so accumulated wall-clock time during the ad isn't credited.
  last = performance.now()
  setMusicEnabled(game.settings.music)
  setSfxEnabled(game.settings.sound)
  gameplayResume()
}

function ui() {
  playSfx('ui')
}

function closeUpgrades() {
  showUpgrades.value = false
  showInterstitial('upgrades-close')
}
function closeOrders() {
  showOrders.value = false
  showInterstitial('orders-close')
}
function closeForgeWithAd() {
  closeForge()
  showInterstitial('forge-close')
}

onMounted(() => {
  game.load()
  game.applyDetectedLang(getLang())
  game.refillDailyChest()
  // audio: sync with persisted settings, preload, and arm autoplay on first gesture
  setSfxEnabled(game.settings.sound)
  setMusicEnabled(game.settings.music)
  preloadAudio()
  unlockAudioOnGesture()
  if (game.settings.music) startMusic()
  // react to settings toggles
  watch(
    () => game.settings.sound,
    (v) => setSfxEnabled(v),
  )
  watch(
    () => game.settings.music,
    (v) => (v ? startMusic() : stopMusic()),
  )
  last = performance.now()
  raf = requestAnimationFrame(loop)
  saveTimer = window.setInterval(() => game.save(), 5000)
  nowTimer = window.setInterval(() => (nowTs.value = Date.now()), 500)
  window.addEventListener('beforeunload', () => game.save())
  window.addEventListener('ads:pause', onAdsPause)
  window.addEventListener('ads:resume', onAdsResume)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearInterval(saveTimer)
  clearInterval(nowTimer)
  window.removeEventListener('ads:pause', onAdsPause)
  window.removeEventListener('ads:resume', onAdsResume)
  clearTimeout(orderNoticeTimer)
  stopMusic()
  game.save()
})

const goldX2Left = computed(() => Math.max(0, Math.floor((game.goldX2Until - nowTs.value) / 1000)))
const autoLeft = computed(() => Math.max(0, Math.floor((game.autoClickUntil - nowTs.value) / 1000)))
const critX2Left = computed(() => Math.max(0, Math.floor((game.critX2Until - nowTs.value) / 1000)))

function fmtBoosterTime(s: number): string {
  if (s >= 60) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }
  return `${s}с`
}

interface ActiveBooster {
  id: 'gold' | 'speed' | 'luck'
  label: string
  left: number
  icon: string
  iconAlt: string
  emoji: string
  variant: string
}
const activeBoosters = computed<ActiveBooster[]>(() => {
  const list: ActiveBooster[] = []
  if (goldX2Left.value > 0)
    list.push({
      id: 'gold',
      label: 'x2 Золото',
      left: goldX2Left.value,
      icon: iconCoin,
      iconAlt: 'gold',
      emoji: '🪙',
      variant: 'gold',
    })
  if (autoLeft.value > 0)
    list.push({
      id: 'speed',
      label: 'x2 Скорость',
      left: autoLeft.value,
      icon: iconCoin,
      iconAlt: 'speed',
      emoji: '⚡',
      variant: 'speed',
    })
  if (critX2Left.value > 0)
    list.push({
      id: 'luck',
      label: 'x2 Удача',
      left: critX2Left.value,
      icon: iconClover,
      iconAlt: 'luck',
      emoji: '🍀',
      variant: 'luck',
    })
  return list
})

const hasUnopenedChests = computed(() => game.chests.some((c) => c.count > 0))
const hasOrders = computed(() => game.orders.length > 0)

let orderNoticeTimer = 0
watch(
  () => game.orderNotice?.id,
  (id) => {
    clearTimeout(orderNoticeTimer)
    if (!id) return
    orderNoticeTimer = window.setTimeout(() => game.clearOrderNotice(), 4500)
  },
)

function openOrdersFromNotice() {
  ui()
  showOrders.value = true
  game.clearOrderNotice()
}

// Background of the main game viewport — switches with the forge level milestone.
const forgeBackground = computed(() => {
  const lvl = game.forgeLevelDisplay
  if (lvl >= 40) return bgLevel5
  if (lvl >= 30) return bgLevel4
  if (lvl >= 20) return bgLevel3
  if (lvl >= 10) return bgLevel2
  return bgLevel1
})

const hasClaimableAchievement = computed(() =>
  game.achievements.some((a) => {
    if (a.done) return false
    let v = 0
    if (a.metric === 'clicks') v = game.clicks
    else if (a.metric === 'gold') v = game.totalGoldEarned
    else if (a.metric === 'crafts') v = game.totalCrafts
    else if (a.metric === 'forgeLevel') v = game.forgeLevelDisplay
    else if (a.metric === 'uniqueItems') v = game.items.filter((i) => i.count > 0).length
    return v >= a.target
  }),
)

// floating click numbers on main screen
interface FloatHit {
  id: number
  text: string
  crit: boolean
  x: number
  y: number
}
const floats = ref<FloatHit[]>([])
const stageEl = ref<HTMLElement | null>(null)
const anvilEl = ref<HTMLElement | null>(null)
let floatId = 0

const striking = ref(false)
let strikeTimer = 0

interface Spark {
  id: number
  angle: number
  dist: number
  size: number
  delay: number
}
const sparks = ref<Spark[]>([])
let sparkId = 0

// Combo system: consecutive rapid clicks produce more sparks
let combo = 0
let lastStrikeAt = 0
const COMBO_WINDOW_MS = 700
const COMBO_CAP = 30

function spawnSparks(count: number) {
  const burstId = ++sparkId
  const burst: Spark[] = []
  // sizes scale a bit with combo as well
  const sizeBoost = Math.min(combo * 0.15, 6)
  for (let i = 0; i < count; i++) {
    burst.push({
      id: burstId * 1000 + i,
      angle: -90 + (Math.random() - 0.5) * 160,
      dist: 55 + Math.random() * 60 + Math.min(combo * 1.5, 40),
      size: 8 + Math.random() * 6 + sizeBoost,
      delay: Math.random() * 60,
    })
  }
  sparks.value.push(...burst)
  setTimeout(() => {
    const ids = new Set(burst.map((s) => s.id))
    sparks.value = sparks.value.filter((s) => !ids.has(s.id))
  }, 700)
}

function doClick(_ev: MouseEvent) {
  game.click()
  // spawn float above the hammer position regardless of click point
  let x = 200
  let y = 100
  if (stageEl.value && anvilEl.value) {
    const stageRect = stageEl.value.getBoundingClientRect()
    const anvilRect = anvilEl.value.getBoundingClientRect()
    x = anvilRect.left + anvilRect.width / 2 - stageRect.left + (Math.random() - 0.5) * 50
    y = anvilRect.top - stageRect.top + anvilRect.height * 0.35 + (Math.random() - 0.5) * 20
  }
  const id = ++floatId
  floats.value.push({
    id,
    text: '+' + fmt(game.lastHit),
    crit: game.lastCrit,
    x,
    y,
  })
  setTimeout(() => {
    floats.value = floats.value.filter((f) => f.id !== id)
  }, 900)
  // hammer strike animation
  striking.value = false
  clearTimeout(strikeTimer)
  requestAnimationFrame(() => {
    striking.value = true
    strikeTimer = window.setTimeout(() => {
      striking.value = false
    }, 280)
  })
  // combo logic — keep clicking quickly to stack
  const now = performance.now()
  if (now - lastStrikeAt < COMBO_WINDOW_MS) {
    combo = Math.min(combo + 1, COMBO_CAP)
  } else {
    combo = 1
  }
  lastStrikeAt = now
  // sparks count grows with combo; crit adds extra
  const base = 6 + Math.floor(combo * 0.8)
  const sparkCount = Math.min(40, base + (game.lastCrit ? 10 : 0))
  setTimeout(() => spawnSparks(sparkCount), 140)
}

// forge level progress (display) — XP into current level / XP needed for next level
const forgeProgress = computed(() => game.forgeXpProgress)

const anyOverlayOpen = computed(
  () =>
    showUpgrades.value ||
    showItems.value ||
    showOrders.value ||
    showAchievements.value ||
    showSettings.value ||
    showChests.value ||
    showShop.value ||
    chestReward.value !== null ||
    onForge.value,
)

watch(anyOverlayOpen, (open) => {
  if (open) gameplayPause()
  else gameplayResume()
})

watch(showOrders, (open) => {
  if (open) game.clearOrderNotice()
})

// Trigger review on a positive moment: after a chest reward popup is closed.
watch(chestReward, (v, prev) => {
  if (prev && !v) tryRequestReview()
})
</script>

<template>
  <div class="game">
    <div class="screen">
      <div class="viewport" :style="{ backgroundImage: `url(${forgeBackground})` }">
        <!-- Top bar: currencies + burger -->
        <div class="topbar">
          <div class="cur gold">
            <img :src="iconCoin" alt="" class="coin-img" draggable="false" />
            <div class="cur-info">
              <div class="cur-value">{{ fmt(game.gold) }}</div>
              <div class="cur-rate" v-if="game.passivePerSec > 0">
                +{{ fmt(game.passivePerSec) }}/сек
              </div>
            </div>
          </div>
          <div
            class="cur diamonds clickable"
            @click.stop="
              ui()
              showShop = true
            "
          >
            <img :src="iconStone" alt="" class="gem-img" draggable="false" />
            <div class="cur-value">{{ game.diamonds }}</div>
            <span class="plus" aria-hidden="true"></span>
          </div>
        </div>

        <Transition name="order-toast">
          <button
            v-if="game.orderNotice && !onForge && !showOrders"
            type="button"
            class="order-toast"
            @click.stop="openOrdersFromNotice"
          >
            <img :src="iconScroll" alt="" class="order-toast-scroll" draggable="false" />
            <img
              :src="game.orderNotice.heroAvatar"
              alt=""
              class="order-toast-hero"
              draggable="false"
            />
            <div class="order-toast-body">
              <div class="order-toast-title">Новый заказ!</div>
              <div class="order-toast-sub">{{ game.orderNotice.heroName }}</div>
              <div class="order-toast-item">нужен: {{ game.orderNotice.itemName }}</div>
            </div>
          </button>
        </Transition>

        <!-- Side action icons -->
        <div class="side-right">
          <button
            class="side-btn"
            title="Настройки"
            @click.stop="
              ui()
              showSettings = true
            "
          >
            <span class="side-icon"><img :src="navSettings" alt="" draggable="false" /></span>
            <span class="side-label">Настройки</span>
          </button>
          <button
            class="side-btn"
            title="Магазин"
            @click.stop="
              ui()
              showShop = true
            "
          >
            <span class="side-icon"><img :src="navShop" alt="" draggable="false" /></span>
            <span class="side-label">Магазин</span>
          </button>
          <button
            class="side-btn"
            title="События"
            @click.stop="
              ui()
              showAchievements = true
            "
          >
            <span class="side-icon">
              <img :src="navEvents" alt="" draggable="false" />
              <span v-if="hasClaimableAchievement" class="notify-dot"></span>
            </span>
            <span class="side-label">События</span>
          </button>
          <button
            class="side-btn"
            title="Сундуки"
            @click.stop="
              ui()
              showChests = true
            "
          >
            <span class="side-icon">
              <img :src="navChests" alt="" draggable="false" />
              <span v-if="hasUnopenedChests" class="notify-dot"></span>
            </span>
            <span class="side-label">Сундуки</span>
          </button>
        </div>

        <!-- Main play area -->
        <div v-if="!onForge" class="stage" ref="stageEl" @click="doClick($event)">
          <img :src="characterImg" alt="Кузнец" class="character" draggable="false" />
          <div class="anvil-area" ref="anvilEl">
            <div class="anvil-glow"></div>
            <img :src="imgAnvil" alt="" class="anvil-img" draggable="false" />
            <img
              :src="imgHammer"
              alt=""
              class="hammer-img"
              :class="{ striking }"
              draggable="false"
            />
            <div class="sparks">
              <div
                v-for="s in sparks"
                :key="s.id"
                class="spark"
                :style="{
                  '--angle': s.angle + 'deg',
                  '--dist': s.dist + 'px',
                  '--size': s.size + 'px',
                  animationDelay: s.delay + 'ms',
                }"
              ></div>
            </div>
          </div>
          <transition-group name="float" tag="div" class="floats">
            <div
              v-for="f in floats"
              :key="f.id"
              class="float-hit"
              :class="{ crit: f.crit }"
              :style="{ left: f.x + 'px', top: f.y + 'px' }"
            >
              {{ f.text }}
              <img :src="iconCoin" alt="" class="float-coin" draggable="false" />
              <span v-if="f.crit" class="crit-label">КРИТ!</span>
            </div>
          </transition-group>

          <transition-group name="boost" tag="div" class="active-boosters">
            <div
              v-for="b in activeBoosters"
              :key="b.id"
              class="boost-chip"
              :class="'v-' + b.variant"
            >
              <div class="boost-icon">
                <img :src="b.icon" :alt="b.iconAlt" draggable="false" />
              </div>
              <div class="boost-body">
                <div class="boost-label">{{ b.label }}</div>
                <div class="boost-time">{{ fmtBoosterTime(b.left) }}</div>
              </div>
            </div>
          </transition-group>
        </div>

        <!-- Forge level bar -->
        <div v-if="!onForge" class="forge-bar">
          <div class="forge-title">Уровень наковальни {{ game.forgeLevelDisplay }}</div>
          <div class="forge-progress">
            <div class="forge-fill" :style="{ width: forgeProgress.pct + '%' }"></div>
            <div class="forge-text">
              {{ fmt(forgeProgress.current) }} / {{ fmt(forgeProgress.max) }} XP
            </div>
          </div>
        </div>

        <!-- Modals -->
        <UpgradesModal :open="showUpgrades" @close="closeUpgrades" />
        <ItemsModal :open="showItems" @close="showItems = false" />
        <OrdersModal :open="showOrders" @close="closeOrders" />
        <AchievementsModal :open="showAchievements" @close="showAchievements = false" />
        <SettingsModal :open="showSettings" @close="showSettings = false" />
        <ChestsModal
          :open="showChests"
          @close="showChests = false"
          @reward="(r) => (chestReward = r)"
        />
        <ChestRewardPopup
          v-if="chestReward"
          :chest-name="chestReward.chestName"
          :chest-img="chestReward.chestImg"
          :gold="chestReward.gold"
          :diamonds="chestReward.diamonds"
          @close="chestReward = null"
        />
        <ShopModal :open="showShop" @close="showShop = false" />
        <ForgeView v-if="onForge" @close="closeForgeWithAd" />

        <!-- Bottom blurred backdrop -->
        <div class="bottom-bg"></div>

        <!-- Bottom navigation -->
        <nav class="bottom-nav">
          <button
            :class="{ active: showUpgrades }"
            @click.stop="
              ui()
              showUpgrades = true
            "
          >
            <img :src="iconLevelUp" alt="" class="nav-icon" draggable="false" />
            <span class="nav-label">Улучшения</span>
          </button>
          <button
            :class="{ active: showItems }"
            @click.stop="
              ui()
              showItems = true
            "
          >
            <img :src="iconSword" alt="" class="nav-icon" draggable="false" />
            <span class="nav-label">Предметы</span>
          </button>
          <button
            :class="{ active: showOrders }"
            @click.stop="
              ui()
              showOrders = true
            "
          >
            <span class="nav-icon-wrap">
              <img :src="iconScroll" alt="" class="nav-icon" draggable="false" />
              <span v-if="hasOrders" class="notify-dot nav-dot"></span>
            </span>
            <span class="nav-label">Заказы</span>
          </button>
          <button
            :class="{ active: onForge }"
            @click.stop="
              ui()
              openForge()
            "
          >
            <img :src="iconBlacksmith" alt="" class="nav-icon" draggable="false" />
            <span class="nav-label">Кузница</span>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  /* background lives on <body> now — keep this transparent */
  background: transparent;
  overflow: hidden;
}
.game > .screen {
  position: relative;
  z-index: 1;
}

/* Outer tablet bezel */
.screen {
  position: relative;
  width: 100%;
  max-width: 900px;
  aspect-ratio: 4 / 3;
  max-height: calc(100vh - 40px);
  background: #0d0805;
  color: #f3e9c8;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: 'Fredoka', 'Trebuchet MS', system-ui, sans-serif;

  /* Tablet frame: thick dark bezel with metallic sheen */
  padding: 28px 22px;
  border-radius: 36px;
  background-image: linear-gradient(145deg, #2a2520 0%, #15110d 30%, #0a0805 70%, #1c1814 100%);
  border: 2px solid #3a3530;
  box-shadow:
    inset 0 0 0 2px #050302,
    inset 0 2px 8px rgba(255, 255, 255, 0.06),
    inset 0 -2px 8px rgba(0, 0, 0, 0.8),
    0 20px 60px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

/* Camera dot on top bezel */
.screen::before {
  content: '';
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #4a4540, #0a0805);
  box-shadow:
    inset 0 0 2px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  z-index: 10;
}

/* Home button on bottom bezel */
.screen::after {
  content: '';
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #2a2520, #0a0805);
  border: 1px solid #3a3530;
  box-shadow:
    inset 0 1px 2px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.8);
  z-index: 10;
}

/* Inner screen (the actual game viewport) */
.viewport {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  background-color: #2a1408;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    inset 0 0 0 1px rgba(255, 215, 100, 0.08),
    inset 0 0 20px rgba(0, 0, 0, 0.6);
}

/* Top bar with currencies + burger */
.topbar {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  align-items: center;
  justify-content: flex-start;
  z-index: 5;
  pointer-events: none;
}
.cur {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  pointer-events: auto;
  background: linear-gradient(180deg, #4a2c14 0%, #2a1808 100%);
  border: 2px solid #6a3a18;
  border-radius: 22px;
  padding: 0 14px 0 4px;
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 215, 100, 0.25),
    inset 0 -2px 4px rgba(0, 0, 0, 0.5);
}
.cur.gold {
  flex: 0 0 auto;
}
.cur.diamonds {
  flex: 0 0 auto;
  padding-right: 4px;
}
.cur.clickable {
  cursor: pointer;
  transition:
    transform 0.08s,
    filter 0.1s;
}
.cur.clickable:hover {
  filter: brightness(1.08);
}
.cur.clickable:active {
  transform: translateY(1px);
}

/* Gold coin image */
.coin-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 6px rgba(255, 200, 80, 0.4));
  flex-shrink: 0;
}
.gem-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
  flex-shrink: 0;
}
.gem-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
  flex-shrink: 0;
}
.gem-inline {
  width: 14px;
  height: 14px;
  object-fit: contain;
  vertical-align: middle;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}

.cur-info {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}
.cur-value {
  font-weight: 900;
  font-size: 16px;
  color: #fff5d0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.cur-rate {
  font-size: 10px;
  color: #5cffa0;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.cur.diamonds .cur-value {
  color: #e5d4ff;
}

.plus {
  position: relative;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(180deg, #7ee06a, #2e8b3a);
  border: 2px solid #1c5a25;
  cursor: pointer;
  margin-left: 4px;
  box-sizing: border-box;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.5);
}
.plus::before,
.plus::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 1px;
}
.plus::before {
  width: 11px;
  height: 2px;
}
.plus::after {
  width: 2px;
  height: 11px;
}

/* Side action buttons */
.side-right {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 4;
}
.side-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: #f3e9c8;
  padding: 4px;
}
.side-icon {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.side-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.6));
}
.notify-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: radial-gradient(circle at 30% 30%, #ff6060, #c01010);
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  z-index: 1;
}

.order-toast {
  position: absolute;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: calc(100% - 24px);
  padding: 10px 14px;
  border: 2px solid #d4881a;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(74, 44, 20, 0.97) 0%, rgba(42, 24, 8, 0.97) 100%);
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 160, 0.25),
    0 8px 24px rgba(0, 0, 0, 0.65);
  color: #fff5d0;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  animation: orderToastPulse 2s ease-in-out infinite;
}
.order-toast-scroll {
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
}
.order-toast-hero {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0c060;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}
.order-toast-body {
  min-width: 0;
}
.order-toast-title {
  font-size: 14px;
  font-weight: 900;
  color: #ffd95a;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.order-toast-sub {
  font-size: 12px;
  font-weight: 700;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.order-toast-item {
  font-size: 11px;
  font-weight: 600;
  color: #e8d4a8;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.order-toast-enter-active,
.order-toast-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}
.order-toast-enter-from,
.order-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}
@keyframes orderToastPulse {
  0%,
  100% {
    box-shadow:
      inset 0 2px 0 rgba(255, 220, 160, 0.25),
      0 8px 24px rgba(0, 0, 0, 0.65);
  }
  50% {
    box-shadow:
      inset 0 2px 0 rgba(255, 220, 160, 0.35),
      0 8px 24px rgba(0, 0, 0, 0.65),
      0 0 16px rgba(240, 192, 96, 0.45);
  }
}
.side-label {
  font-size: 12px;
  font-weight: 800;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.9),
    0 2px 4px rgba(0, 0, 0, 0.7);
}

/* Stage with character */
.stage {
  position: relative;
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  min-height: 340px;
}
.character {
  position: absolute;
  left: 22%;
  bottom: -179px;
  height: 130%;
  max-height: 600px;
  width: auto;
  max-width: none;
  object-fit: contain;
  object-position: center bottom;
  transform: translateX(-50%);
  pointer-events: none;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.7));
  transition: transform 0.08s;
}
.stage:active .character {
  transform: translateX(-50%) scale(0.985);
}
.anvil-area {
  position: absolute;
  bottom: 4%;
  left: auto;
  right: 6%;
  transform: none;
  width: 340px;
  height: 320px;
  pointer-events: none;
  z-index: 2;
}
.anvil-glow {
  position: absolute;
  left: 50%;
  bottom: 12%;
  transform: translateX(-50%);
  width: 260px;
  height: 110px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 200, 60, 0.75) 0%,
    rgba(255, 140, 30, 0.45) 40%,
    rgba(255, 80, 20, 0) 75%
  );
  animation: glowPulse 1.8s ease-in-out infinite;
  filter: blur(3px);
}
.anvil-img {
  position: absolute;
  bottom: -56%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: auto;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.75));
  z-index: 1;
}
.hammer-img {
  position: absolute;
  top: auto;
  bottom: 16%;
  left: 58%;
  width: 60%;
  height: auto;
  transform: translate(-30%, 0) rotate(-20deg);
  transform-origin: 50% 90%;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.75));
  animation: hammerBob 1.8s ease-in-out infinite;
  z-index: 2;
}
.hammer-img.striking {
  animation: hammerStrike 0.28s cubic-bezier(0.4, 0, 0.6, 1);
}
@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.8;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scale(1.1);
  }
}
@keyframes hammerStrike {
  0% {
    transform: translate(-30%, 0) rotate(-20deg);
  }
  30% {
    transform: translate(-30%, -8%) rotate(20deg);
  }
  60% {
    transform: translate(-30%, 8%) rotate(-70deg);
  }
  100% {
    transform: translate(-30%, 0) rotate(-20deg);
  }
}

/* Sparks burst on strike */
.sparks {
  position: absolute;
  bottom: 10%;
  left: 60%;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 3;
}
.spark {
  position: absolute;
  width: var(--size, 10px);
  height: var(--size, 10px);
  left: 0;
  top: 0;
  border-radius: 50%;
  background: radial-gradient(circle, #fff5d0 0%, #ffd95a 40%, #ff8a20 70%, transparent 100%);
  box-shadow:
    0 0 10px 3px rgba(255, 200, 80, 0.8),
    0 0 18px 6px rgba(255, 150, 30, 0.45);
  transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0);
  animation: sparkFly 0.6s cubic-bezier(0.2, 0.6, 0.4, 1) forwards;
}
@keyframes sparkFly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(0.5);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(calc(var(--dist) * 0.3))
      scale(1);
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--dist)) scale(0.3);
    opacity: 0;
  }
}
@keyframes hammerBob {
  0%,
  100% {
    transform: translate(-30%, 0) rotate(-20deg);
  }
  50% {
    transform: translate(-30%, -6%) rotate(-18deg);
  }
}

/* Floating hit numbers */
.floats {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
.float-hit {
  position: absolute;
  z-index: 50;
  transform: translate(-50%, -50%);
  font-size: 36px;
  font-weight: 900;
  color: #fff5d0;
  text-shadow:
    0 0 8px #ff8800,
    0 0 12px rgba(255, 150, 50, 0.6),
    0 2px 4px rgba(0, 0, 0, 0.9),
    -2px 0 0 #6a3a10,
    2px 0 0 #6a3a10,
    0 -2px 0 #6a3a10,
    0 2px 0 #6a3a10;
  animation: floatUp 0.9s ease-out forwards;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}
.float-coin {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 0 6px rgba(255, 200, 80, 0.8)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
}
.float-hit.crit {
  color: #ffd95a;
  font-size: 44px;
}
.crit-label {
  color: #ff5a5a;
  font-size: 20px;
  margin-left: 4px;
}
@keyframes floatUp {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.6);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -90%) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -180%) scale(1);
  }
}

.active-boosters {
  position: absolute;
  top: 70px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
  z-index: 6;
}
.boost-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 20px;
  border: 2px solid var(--chip-border, #6a3a18);
  background: var(--chip-bg, linear-gradient(180deg, #4a2c14 0%, #2a1808 100%));
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    inset 0 -2px 4px rgba(0, 0, 0, 0.45),
    0 0 0 0 var(--chip-glow, rgba(255, 200, 80, 0.55));
  animation: chipPulse 1.8s ease-in-out infinite;
  position: relative;
}
.boost-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--chip-icon-bg, radial-gradient(circle at 30% 30%, #ffe680 0%, #c89030 80%));
  border: 2px solid rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -2px 3px rgba(0, 0, 0, 0.4);
}
.boost-icon img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}
.boost-body {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
  min-width: 0;
}
.boost-label {
  font-size: 11px;
  font-weight: 900;
  color: #fff5d0;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75);
  white-space: nowrap;
}
.boost-time {
  font-size: 13px;
  font-weight: 900;
  color: #ffd95a;
  text-shadow:
    -1px 0 0 #3a1f0c,
    1px 0 0 #3a1f0c,
    0 -1px 0 #3a1f0c,
    0 1px 0 #3a1f0c,
    0 2px 3px rgba(0, 0, 0, 0.7);
  font-variant-numeric: tabular-nums;
}

/* Variants */
.boost-chip.v-gold {
  --chip-border: #b8821e;
  --chip-bg: linear-gradient(180deg, #6a4818 0%, #3a2408 100%);
  --chip-glow: rgba(255, 200, 80, 0.6);
  --chip-icon-bg: radial-gradient(circle at 30% 30%, #ffe680 0%, #c89030 80%);
}
.boost-chip.v-speed {
  --chip-border: #2e72b8;
  --chip-bg: linear-gradient(180deg, #1f4878 0%, #0c2444 100%);
  --chip-glow: rgba(120, 180, 255, 0.55);
  --chip-icon-bg: radial-gradient(circle at 30% 30%, #a8d8ff 0%, #2e72c8 80%);
}
.boost-chip.v-luck {
  --chip-border: #3a9a3a;
  --chip-bg: linear-gradient(180deg, #1f5a2a 0%, #0a2810 100%);
  --chip-glow: rgba(120, 230, 120, 0.55);
  --chip-icon-bg: radial-gradient(circle at 30% 30%, #b8f0a8 0%, #2e8b3a 80%);
}

@keyframes chipPulse {
  0%,
  100% {
    box-shadow:
      0 3px 8px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      inset 0 -2px 4px rgba(0, 0, 0, 0.45),
      0 0 0 0 var(--chip-glow, rgba(255, 200, 80, 0.55));
  }
  50% {
    box-shadow:
      0 3px 8px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      inset 0 -2px 4px rgba(0, 0, 0, 0.45),
      0 0 0 6px transparent,
      0 0 14px 2px var(--chip-glow, rgba(255, 200, 80, 0.55));
  }
}

/* Enter / leave transitions */
.boost-enter-active,
.boost-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.boost-enter-from {
  opacity: 0;
  transform: translateX(-30px) scale(0.7);
}
.boost-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.7);
}
.boost-move {
  transition: transform 0.3s ease;
}

/* Forge progress */
.forge-bar {
  margin: 0 auto 12px;
  padding: 8px 18px 10px;
  width: fit-content;
  min-width: 220px;
  background: linear-gradient(180deg, #6a3a18 0%, #4a2410 50%, #2a1408 100%);
  border: 2px solid #4a2810;
  border-radius: 14px;
  text-align: center;
  box-shadow:
    inset 0 2px 0 rgba(255, 215, 130, 0.35),
    inset 0 -2px 0 rgba(0, 0, 0, 0.45),
    0 4px 10px rgba(0, 0, 0, 0.6);
  z-index: 5;
  pointer-events: none;
  align-self: center;
}
.forge-title {
  font-size: 14px;
  font-weight: 800;
  color: #ffd95a;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
  text-shadow:
    0 1px 0 #4a2810,
    0 2px 3px rgba(0, 0, 0, 0.8);
}
.forge-progress {
  position: relative;
  height: 18px;
  background: linear-gradient(180deg, #0a0604 0%, #1a0f06 100%);
  border: 1.5px solid #1a0f06;
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    inset 0 2px 3px rgba(0, 0, 0, 0.9),
    inset 0 -1px 0 rgba(255, 215, 100, 0.1),
    0 1px 0 rgba(255, 215, 130, 0.2);
}
.forge-fill {
  height: 100%;
  background: linear-gradient(180deg, #a8f070 0%, #5bc94a 45%, #2e8b3a 100%);
  border-radius: 10px;
  transition: width 0.3s;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.4),
    inset 0 -2px 0 rgba(0, 80, 20, 0.5);
  position: relative;
}
.forge-fill::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 4px;
  right: 4px;
  height: 4px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5), transparent);
  border-radius: 4px;
}
.forge-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.3px;
  text-shadow:
    -1px 0 0 #1a3a10,
    1px 0 0 #1a3a10,
    0 -1px 0 #1a3a10,
    0 1px 0 #1a3a10,
    0 2px 3px rgba(0, 0, 0, 0.9);
}

/* Bottom navigation - transparent background */
.bottom-bg {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 220px;
  pointer-events: none;
  z-index: 4;
  background: linear-gradient(
    180deg,
    rgba(10, 6, 3, 0) 0%,
    rgba(10, 6, 3, 0.05) 20%,
    rgba(10, 6, 3, 0.15) 40%,
    rgba(8, 4, 2, 0.32) 60%,
    rgba(8, 4, 2, 0.5) 80%,
    rgba(5, 3, 1, 0.65) 100%
  );
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  -webkit-mask-image: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 0, 0, 0.08) 25%,
    rgba(0, 0, 0, 0.28) 50%,
    rgba(0, 0, 0, 0.52) 75%,
    rgba(0, 0, 0, 0.72) 100%
  );
  mask-image: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 0, 0, 0.08) 25%,
    rgba(0, 0, 0, 0.28) 50%,
    rgba(0, 0, 0, 0.52) 75%,
    rgba(0, 0, 0, 0.72) 100%
  );
}
.bottom-nav {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 10px 10px 12px;
  background: transparent;
  border-top: none;
  box-shadow: none;
  z-index: 5;
  pointer-events: none;
}
.bottom-nav button {
  pointer-events: auto;
}
.bottom-nav button {
  position: relative;
  width: 88px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #c08040 0%, #9a5a25 45%, #7a4418 100%);
  border: 2px solid #4a2810;
  border-radius: 12px;
  color: #fff5d0;
  padding: 8px 4px 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-family: inherit;
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 160, 0.4),
    inset 0 -2px 0 rgba(0, 0, 0, 0.35),
    0 3px 0 #3a1f0c,
    0 4px 6px rgba(0, 0, 0, 0.5);
  transition:
    transform 0.08s,
    box-shadow 0.08s;
}
.bottom-nav button::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  bottom: 4px;
  border-radius: 8px;
  border: 1px solid rgba(255, 220, 160, 0.15);
  pointer-events: none;
}
.bottom-nav button:active {
  transform: translateY(2px);
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 160, 0.3),
    inset 0 -2px 0 rgba(0, 0, 0, 0.4),
    0 1px 0 #3a1f0c,
    0 2px 4px rgba(0, 0, 0, 0.5);
}
.bottom-nav button.active {
  background: linear-gradient(180deg, #d89048 0%, #a8602a 45%, #82471a 100%);
  border-color: #5a3014;
  box-shadow:
    inset 0 2px 0 rgba(255, 230, 170, 0.5),
    inset 0 -2px 0 rgba(0, 0, 0, 0.4),
    inset 0 0 12px rgba(255, 180, 80, 0.3),
    0 3px 0 #3a1f0c,
    0 4px 8px rgba(255, 150, 50, 0.3);
}
.nav-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.nav-dot {
  top: -2px;
  right: -4px;
  width: 12px;
  height: 12px;
  animation: dotPulse 1.4s ease-in-out infinite;
}
@keyframes dotPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  }
  50% {
    transform: scale(1.18);
    box-shadow: 0 0 8px rgba(255, 80, 80, 0.85);
  }
}
.nav-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.7));
}
.nav-label {
  font-size: 12px;
  font-weight: 800;
  color: #fff5d0;
  text-shadow:
    0 1px 0 rgba(0, 0, 0, 0.6),
    0 2px 3px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.3px;
}

/* Content panels for non-main tabs */
.content {
  flex: 1;
  background: rgba(20, 12, 6, 0.92);
  margin: 8px;
  border: 2px solid #8a5a2a;
  border-radius: 12px;
  padding: 12px;
  overflow-y: auto;
}
.panel h2 {
  margin-top: 0;
  color: #ffd95a;
}
.muted {
  color: #c4a880;
  font-size: 0.9em;
}
.subtabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0;
}
.subtabs button {
  padding: 6px 12px;
  background: #4a2c14;
  border: 1px solid #8a5a2a;
  color: #f3e9c8;
  border-radius: 6px;
  cursor: pointer;
}
.subtabs button.active {
  background: #d4881a;
  color: #1a0f06;
}
.cards {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}
.card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #3a2415;
  border: 1px solid #8a5a2a;
  border-radius: 8px;
}
.card-title {
  font-weight: 700;
}
.lvl {
  color: #ffd95a;
  margin-left: 8px;
  font-size: 0.85em;
}
.rarity {
  margin-left: 8px;
  font-size: 0.8em;
  padding: 2px 6px;
  border-radius: 4px;
}
.r-Обычный {
  background: #777;
}
.r-Редкий {
  background: #2e86c1;
}
.r-Эпический {
  background: #8e44ad;
}
.r-Легендарный {
  background: #d4881a;
  color: #1a0f06;
}
.r-Мифический {
  background: #c0392b;
}
.buy {
  background: #2c8a3a;
  color: #fff;
  border: 1px solid #5cba6a;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 700;
}
.buy:disabled {
  background: #555;
  border-color: #777;
  cursor: not-allowed;
  opacity: 0.6;
}
.ghost {
  background: transparent;
  color: #f3e9c8;
  border: 1px solid #8a5a2a;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
}
.big {
  background: #d4881a;
  color: #1a0f06;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  margin-top: 8px;
}
.big:disabled {
  background: #555;
  cursor: not-allowed;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
label {
  display: block;
  margin: 8px 0;
}

/* Dropdown */
.dropdown {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 50;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 64px 14px 0;
}
.dropdown-body {
  background: linear-gradient(180deg, #4a2c14, #2a1808);
  border: 2px solid #d4881a;
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.7);
}
.dropdown-body button {
  background: #4a2c14;
  color: #f3e9c8;
  border: 1px solid #8a5a2a;
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 14px;
}
.dropdown-body button:hover {
  background: #5a3818;
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-body {
  background: #3a2415;
  border: 2px solid #d4881a;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  min-width: 280px;
  color: #f3e9c8;
}

/* ----------------------------------------------------------- */
/*  RESPONSIVE: mobile (≤ 768px) — drop the tablet bezel,      */
/*  fill the viewport, scale UI for touch.                     */
/* ----------------------------------------------------------- */
@media (max-width: 768px) {
  .game {
    padding: 0;
    min-height: 100dvh;
    align-items: stretch;
    justify-content: stretch;
  }
  .screen {
    width: 100vw;
    max-width: none;
    height: 100dvh;
    max-height: 100dvh;
    aspect-ratio: auto;
    padding: 0;
    border-radius: 0;
    border: none;
    background-image: none;
    box-shadow: none;
  }
  /* Hide camera + home-button cosmetic dots from the tablet frame. */
  .screen::before,
  .screen::after {
    display: none;
  }
  .viewport {
    border-radius: 0;
    box-shadow: none;
    /* Respect iOS notch / Android status bar. */
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }

  /* Top currency bar — slimmer chips */
  .topbar {
    padding: 8px 8px;
    gap: 6px;
  }
  .order-toast {
    top: 58px;
    padding: 8px 12px;
    gap: 8px;
  }
  .order-toast-scroll {
    width: 30px;
    height: 30px;
  }
  .order-toast-hero {
    width: 38px;
    height: 38px;
  }
  .order-toast-title {
    font-size: 13px;
  }
  .cur {
    height: 38px;
    border-radius: 19px;
    padding: 0 10px 0 2px;
    gap: 5px;
  }
  .coin-img {
    width: 30px;
    height: 30px;
  }
  .gem-img {
    width: 24px;
    height: 24px;
  }
  .cur-value {
    font-size: 13px;
  }
  .cur-rate {
    font-size: 9px;
  }
  .plus {
    width: 22px;
    height: 22px;
  }
  .plus::before {
    width: 9px;
    height: 2px;
  }
  .plus::after {
    width: 2px;
    height: 9px;
  }

  /* Side action buttons — smaller, tighter */
  .side-right {
    top: 4px;
    right: 4px;
    gap: 6px;
  }
  .side-icon {
    width: 48px;
    height: 48px;
  }
  .side-label {
    font-size: 10px;
  }

  /* Active booster chips */
  .active-boosters {
    top: 56px;
    left: 8px;
    gap: 4px;
  }
  .boost-chip {
    padding: 3px 9px 3px 3px;
    border-radius: 16px;
    gap: 6px;
  }
  .boost-icon {
    width: 26px;
    height: 26px;
  }
  .boost-icon img {
    width: 17px;
    height: 17px;
  }
  .boost-label {
    font-size: 10px;
  }
  .boost-time {
    font-size: 11px;
  }

  /* Anvil + character scaling */
  .anvil-area {
    width: 56%;
    max-width: 280px;
    height: auto;
    aspect-ratio: 1 / 1;
    right: 2%;
    bottom: 12%;
  }
  .character {
    left: 26%;
    bottom: -8%;
    height: auto;
    width: 60%;
    max-height: none;
  }

  /* Floating hit numbers a bit smaller */
  .float-hit {
    font-size: 28px;
  }
  .float-hit.crit {
    font-size: 34px;
  }
  .float-coin {
    width: 28px;
    height: 28px;
  }

  /* Forge level bar — full width on mobile */
  .forge-bar {
    padding: 6px 14px 8px;
    width: auto;
    min-width: 0;
    margin: 0 8px 8px;
    align-self: stretch;
    border-radius: 12px;
  }
  .forge-title {
    font-size: 12px;
  }
  .forge-progress {
    height: 14px;
  }
  .forge-text {
    font-size: 11px;
  }

  /* Bottom blur softer + nav buttons fit 4 across narrow screens */
  .bottom-bg {
    height: 160px;
  }
  .bottom-nav {
    gap: 5px;
    padding: 6px 6px calc(8px + env(safe-area-inset-bottom));
  }
  .bottom-nav button {
    width: auto;
    flex: 1 1 0;
    min-width: 0;
    padding: 6px 2px 5px;
    border-radius: 10px;
  }
  .nav-icon {
    width: 28px;
    height: 28px;
  }
  .nav-label {
    font-size: 10px;
    letter-spacing: 0.1px;
  }
}

/* Very narrow phones */
@media (max-width: 400px) {
  .cur-value {
    font-size: 12px;
  }
  .side-icon {
    width: 42px;
    height: 42px;
  }
  .side-label {
    font-size: 9px;
  }
  .anvil-area {
    width: 60%;
  }
  .character {
    width: 64%;
  }
  .nav-icon {
    width: 24px;
    height: 24px;
  }
  .nav-label {
    font-size: 9px;
  }
}

/* Portrait orientation — character + anvil layered vertically
   to use the tall canvas instead of being cramped sideways. */
@media (max-width: 768px) and (orientation: portrait) {
  .stage {
    min-height: 0;
  }
  .anvil-area {
    width: 64%;
    max-width: 320px;
    right: 50%;
    transform: translateX(50%);
    bottom: 18%;
  }
  .character {
    left: 50%;
    transform: translateX(-50%);
    bottom: -4%;
    width: 80%;
  }
  .stage:active .character {
    transform: translateX(-50%) scale(0.985);
  }
}
</style>
