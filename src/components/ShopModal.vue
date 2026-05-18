<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import GameModal from './GameModal.vue'
import { useGameStore } from '@/stores/game'
import { showRewarded } from '@/ads/ads'
import { fmt } from '@/utils/fmt'
import iconCoin from '@/assets/coin.png'
import iconStone from '@/assets/stone.png'
import iconClover from '@/assets/clever.png'
import iconChest1 from '@/assets/sunduk-1.png'
import iconChest2 from '@/assets/sunduk-2.png'
import iconChest3 from '@/assets/sunduk-3.png'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const game = useGameStore()

// Live clock for cooldown labels — only ticks while the modal is open.
const nowTs = ref(Date.now())
let tickTimer = 0
watch(
  () => props.open,
  (v) => {
    if (v) {
      nowTs.value = Date.now()
      tickTimer = window.setInterval(() => (nowTs.value = Date.now()), 1000)
    } else if (tickTimer) {
      clearInterval(tickTimer)
      tickTimer = 0
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer)
})

function leftMs(target: number): number {
  return Math.max(0, target - nowTs.value)
}
function fmtMin(ms: number): string {
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

interface FreeBooster {
  id: 'gold' | 'speed' | 'luck'
  title: string
  desc: string
  image: string
  iconBg: string
  cooldownMs: number
  getNextAt: () => number
  setNextAt: (v: number) => void
  grant: () => void
}
const FREE_COOLDOWN = 5 * 60_000

const FREE_BOOSTERS: FreeBooster[] = [
  {
    id: 'gold',
    title: 'x2 Золото',
    desc: 'на 5 минут',
    image: iconCoin,
    iconBg: 'linear-gradient(180deg, #ffe680, #c89030)',
    cooldownMs: FREE_COOLDOWN,
    getNextAt: () => game.adFreeBoosterGoldNextAt,
    setNextAt: (v) => (game.adFreeBoosterGoldNextAt = v),
    grant: () => {
      game.goldX2Until = Math.max(Date.now(), game.goldX2Until) + 300_000
    },
  },
  {
    id: 'speed',
    title: 'x2 Скорость',
    desc: 'на 5 минут',
    image: iconCoin,
    iconBg: 'linear-gradient(180deg, #a8d8ff, #2e72c8)',
    cooldownMs: FREE_COOLDOWN,
    getNextAt: () => game.adFreeBoosterSpeedNextAt,
    setNextAt: (v) => (game.adFreeBoosterSpeedNextAt = v),
    grant: () => {
      game.autoClickUntil = Math.max(Date.now(), game.autoClickUntil) + 300_000
    },
  },
  {
    id: 'luck',
    title: 'x2 Удача',
    desc: 'на 5 минут',
    image: iconClover,
    iconBg: 'linear-gradient(180deg, #b8f0a8, #2e8b3a)',
    cooldownMs: FREE_COOLDOWN,
    getNextAt: () => game.adFreeBoosterLuckNextAt,
    setNextAt: (v) => (game.adFreeBoosterLuckNextAt = v),
    grant: () => {
      game.critX2Until = Math.max(Date.now(), game.critX2Until) + 300_000
    },
  },
]

function claimFreeBooster(b: FreeBooster) {
  if (leftMs(b.getNextAt()) > 0) return
  showRewarded(() => {
    b.grant()
    b.setNextAt(Date.now() + b.cooldownMs)
  })
}

const freeDiamondsLeft = computed(() => leftMs(game.adDiamondsNextAt))
function claimFreeDiamonds() {
  if (freeDiamondsLeft.value > 0) return
  showRewarded(() => {
    game.diamonds += 5
    game.adDiamondsNextAt = Date.now() + 10 * 60_000
  })
}

interface Booster {
  id: string
  title: string
  desc: string
  emoji: string
  image?: string
  iconBg: string
  cost: number
  apply: () => void
}
const BOOSTERS: Booster[] = [
  {
    id: 'goldx2',
    title: 'x2 Монеты',
    desc: 'на 5 минут',
    emoji: '🪙',
    image: iconCoin,
    iconBg: 'linear-gradient(180deg, #ffe680, #c89030)',
    cost: 20,
    apply: () => {
      game.goldX2Until = Math.max(Date.now(), game.goldX2Until) + 300_000
    },
  },
  {
    id: 'speedx2',
    title: 'x2 Скорость',
    desc: 'на 5 минут',
    emoji: '⚡',
    image: iconCoin,
    iconBg: 'linear-gradient(180deg, #ffe680, #c89030)',
    cost: 20,
    apply: () => {
      game.autoClickUntil = Math.max(Date.now(), game.autoClickUntil) + 300_000
    },
  },
  {
    id: 'luckx2',
    title: 'x2 Удача',
    desc: 'на 5 минут',
    emoji: '🍀',
    image: iconClover,
    iconBg: 'linear-gradient(180deg, #8af070, #2e8b3a)',
    cost: 20,
    apply: () => {
      game.critX2Until = Math.max(Date.now(), game.critX2Until) + 300_000
    },
  },
]

interface Bundle {
  id: string
  title: string
  gems: number
  gold: number
  image: string
  price: number
}
const BUNDLES: Bundle[] = [
  { id: 'starter', title: 'Стартовый', gems: 200,  gold: 10_000,  image: iconChest1, price: 129 },
  { id: 'big',     title: 'Большой',   gems: 550,  gold: 50_000,  image: iconChest2, price: 299 },
  { id: 'huge',    title: 'Огромный',  gems: 1200, gold: 120_000, image: iconChest3, price: 599 },
]

function buyBooster(b: Booster) {
  if (game.diamonds < b.cost) return
  game.diamonds -= b.cost
  b.apply()
}
function buyBundle(b: Bundle) {
  if (game.diamonds < b.price) return
  game.diamonds -= b.price
  game.diamonds += b.gems
  game.addGold(b.gold)
}
</script>

<template>
  <GameModal :open="open" title="Магазин" @close="emit('close')">
    <!-- Free (rewarded ads) -->
    <div class="section">
      <div class="section-title">Бесплатно за рекламу</div>
      <div class="grid-3">
        <button
          v-for="b in FREE_BOOSTERS"
          :key="b.id"
          class="card booster free"
          :disabled="leftMs(b.getNextAt()) > 0"
          @click="claimFreeBooster(b)"
        >
          <div class="card-icon" :style="{ background: b.iconBg }">
            <img :src="b.image" alt="" class="card-img" />
          </div>
          <div class="card-title">{{ b.title }}</div>
          <div class="card-desc">{{ b.desc }}</div>
          <div v-if="leftMs(b.getNextAt()) > 0" class="card-price ad cooldown">
            {{ fmtMin(leftMs(b.getNextAt())) }}
          </div>
          <div v-else class="card-price ad">
            <span class="ad-icon">📺</span>
            <span>Смотреть</span>
          </div>
        </button>
      </div>
      <button
        class="diamonds-row"
        :disabled="freeDiamondsLeft > 0"
        @click="claimFreeDiamonds"
      >
        <img :src="iconStone" alt="" class="gem big" />
        <div class="diamonds-info">
          <div class="diamonds-title">+5 Алмазов</div>
          <div class="diamonds-sub">
            <template v-if="freeDiamondsLeft > 0">Доступно через {{ fmtMin(freeDiamondsLeft) }}</template>
            <template v-else>За просмотр рекламы</template>
          </div>
        </div>
        <span class="ad-chip">
          <span class="ad-icon">📺</span>
        </span>
      </button>
    </div>

    <!-- Boosters -->
    <div class="section">
      <div class="section-title">Бустеры</div>
      <div class="grid-3">
        <button
          v-for="b in BOOSTERS"
          :key="b.id"
          class="card booster"
          :disabled="game.diamonds < b.cost"
          @click="buyBooster(b)"
        >
          <div class="card-icon" :style="{ background: b.iconBg }">
            <img v-if="b.image" :src="b.image" alt="" class="card-img" />
            <span v-else class="card-emoji">{{ b.emoji }}</span>
          </div>
          <div class="card-title">{{ b.title }}</div>
          <div class="card-desc">{{ b.desc }}</div>
          <div class="card-price">
            <img :src="iconStone" alt="" class="gem" />
            <span>{{ b.cost }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Bundles -->
    <div class="section">
      <div class="section-title">Наборы</div>
      <div class="grid-3">
        <button
          v-for="b in BUNDLES"
          :key="b.id"
          class="card bundle"
          :disabled="game.diamonds < b.price"
          @click="buyBundle(b)"
        >
          <div class="bundle-head">
            <img :src="iconStone" alt="" class="gem" />
            <span>{{ b.gems }}</span>
          </div>
          <div class="card-art">
            <img :src="b.image" alt="" class="chest-img" />
          </div>
          <div class="bundle-loot">
            <img :src="iconCoin" alt="" class="coin-mini" />
            <span>{{ fmt(b.gold) }}</span>
          </div>
          <div class="card-price">
            <img :src="iconStone" alt="" class="gem" />
            <span>{{ b.price }}</span>
          </div>
        </button>
      </div>
    </div>

  </GameModal>
</template>

<style scoped>
.section {
  margin-bottom: 12px;
}
.section:last-child { margin-bottom: 0; }
.section-title {
  font-size: 14px;
  font-weight: 900;
  color: #fff5d0;
  margin-bottom: 6px;
  padding-left: 4px;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

/* Generic card */
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px 10px;
  border-radius: 12px;
  background: linear-gradient(180deg, #4a8cd8 0%, #1f5fa8 50%, #103e7a 100%);
  border: 2px solid #0a2a5a;
  font-family: inherit;
  color: #fff5d0;
  cursor: pointer;
  text-align: center;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(0, 0, 0, 0.3),
    0 3px 0 #0a1f4a,
    0 5px 8px rgba(0, 0, 0, 0.5);
  transition: transform 0.08s, box-shadow 0.08s;
}
.card:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.25),
    inset 0 -2px 0 rgba(0, 0, 0, 0.3),
    0 1px 0 #0a1f4a;
}
.card:disabled {
  filter: grayscale(0.6) brightness(0.7);
  cursor: not-allowed;
}

/* Booster icon circle */
.card-icon {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 2px solid #2a1408;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.4),
    inset 0 -2px 0 rgba(0, 0, 0, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.5);
}
.card-emoji {
  font-size: 26px;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}
.card-emoji.big {
  font-size: 38px;
}
.card-img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}
.chest-img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
}

.card-title {
  font-size: 12px;
  font-weight: 900;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.card-desc {
  font-size: 10px;
  color: #c4d8f8;
  margin-bottom: 4px;
}

/* Price chip */
.card-price {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.45);
  border: 1.5px solid rgba(0, 0, 0, 0.6);
  border-radius: 10px;
  padding: 3px 10px;
  font-size: 13px;
  font-weight: 900;
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.gem {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
}

/* Bundle cards */
.bundle-head {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 8px;
  padding: 3px 10px;
  font-size: 13px;
  font-weight: 900;
}
.card-art {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2px 0;
}
.bundle-loot {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 800;
  color: #ffd95a;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.coin-mini {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

/* Free (rewarded) booster cards */
.card.free {
  background: linear-gradient(180deg, #3aa84a 0%, #1e6c2e 50%, #0c4018 100%);
  border-color: #0a2810;
}
.card-price.ad {
  background: linear-gradient(180deg, #d4881a 0%, #8a5a18 100%);
  border-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  gap: 4px;
}
.card-price.ad.cooldown {
  background: rgba(0, 0, 0, 0.55);
  color: #c4a880;
  font-variant-numeric: tabular-nums;
}
.ad-icon {
  font-size: 13px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.6));
}

/* +5 diamonds row */
.diamonds-row {
  margin-top: 8px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: linear-gradient(180deg, #6a30c8 0%, #3a107a 100%);
  border: 2px solid #1a0a3a;
  border-radius: 12px;
  color: #fff5d0;
  font-family: inherit;
  cursor: pointer;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.25),
    inset 0 -2px 0 rgba(0, 0, 0, 0.35),
    0 3px 0 #1a0a3a;
  transition: transform 0.08s;
}
.diamonds-row:active:not(:disabled) {
  transform: translateY(2px);
}
.diamonds-row:disabled {
  filter: grayscale(0.5) brightness(0.7);
  cursor: not-allowed;
}
.diamonds-row .gem.big {
  width: 28px;
  height: 28px;
}
.diamonds-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}
.diamonds-title {
  font-size: 14px;
  font-weight: 900;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.diamonds-sub {
  font-size: 11px;
  color: #d8c8ff;
  font-weight: 700;
}
.ad-chip {
  background: linear-gradient(180deg, #d4881a 0%, #8a5a18 100%);
  border: 2px solid rgba(0, 0, 0, 0.55);
  border-radius: 10px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
}

</style>
