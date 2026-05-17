<script lang="ts">
export interface ChestReward {
  chestName: string
  chestImg: string
  gold: number
  diamonds: number
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import GameModal from './GameModal.vue'
import { useGameStore, type Chest } from '@/stores/game'
import { showRewarded } from '@/ads/ads'
import iconStone from '@/assets/stone.png'
import iconCoin from '@/assets/coin.png'
import iconSword from '@/assets/sword.png'
import iconBooster from '@/assets/level-up.png'
import sunduk1 from '@/assets/sunduk-1.png'
import sunduk2 from '@/assets/sunduk-2.png'
import sunduk3 from '@/assets/sunduk-3.png'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; reward: [ChestReward] }>()

const game = useGameStore()

// Tick the wall clock once a second while the modal is open
// so the daily-chest countdown updates live.
const nowTs = ref(Date.now())
let clockTimer = 0
function startClock() {
  nowTs.value = Date.now()
  if (clockTimer) return
  clockTimer = window.setInterval(() => (nowTs.value = Date.now()), 1000)
}
function stopClock() {
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = 0
  }
}
watch(
  () => props.open,
  (v) => {
    if (v) startClock()
    else stopClock()
  },
  { immediate: true },
)
onBeforeUnmount(stopClock)

const dailyCommonReady = computed(() => {
  const next = game.dailyChestReadyAt
  return next === 0 || nowTs.value >= next
})
const dailyCommonTimeLeft = computed(() => {
  const next = game.dailyChestReadyAt
  return Math.max(0, next - nowTs.value)
})
function fmtCountdown(ms: number): string {
  const s = Math.ceil(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

interface ChestDef {
  type: Chest['type']
  name: string
  rarity: 'common' | 'rare' | 'epic'
  gemCost: number
  img: string
}
const CHEST_DEFS: ChestDef[] = [
  { type: 'Обычный',   name: 'Обычный сундук',   rarity: 'common', gemCost: 0,   img: sunduk1 },
  { type: 'Редкий',    name: 'Редкий сундук',    rarity: 'rare',   gemCost: 100, img: sunduk2 },
  { type: 'Эпический', name: 'Эпический сундук', rarity: 'epic',   gemCost: 200, img: sunduk3 },
]

const REWARDS = [
  { id: 'coins',    label: 'Монеты',   emoji: '', image: iconCoin,    color: '#ffd95a' },
  { id: 'items',    label: 'Предметы', emoji: '', image: iconSword,   color: '#a8a8b0' },
  { id: 'boosters', label: 'Бустеры',  emoji: '', image: iconBooster, color: '#a070ff' },
]


function chestCount(type: Chest['type']) {
  return game.chests.find((c) => c.type === type)?.count ?? 0
}
function skipDailyCooldown(def: ChestDef) {
  // Watch an ad to instantly receive the daily Обычный chest.
  showRewarded(() => {
    const c = game.chests.find((x) => x.type === def.type)
    if (c) c.count++
    // Bump cooldown so next free chest is in 24h from now.
    game.dailyChestAt = Date.now()
    const reward = game.openChest(def.type)
    if (reward) {
      emit('reward', {
        chestName: def.name,
        chestImg: def.img,
        gold: reward.gold,
        diamonds: reward.diamonds,
      })
      emit('close')
    }
  })
}

function openChest(def: ChestDef) {
  const count = chestCount(def.type)
  let reward: { gold: number; diamonds: number } | null = null
  if (count > 0) {
    reward = game.openChest(def.type)
  } else if (def.gemCost > 0 && game.diamonds >= def.gemCost) {
    game.diamonds -= def.gemCost
    const c = game.chests.find((x) => x.type === def.type)
    if (c) c.count++
    reward = game.openChest(def.type)
  }
  if (reward) {
    emit('reward', {
      chestName: def.name,
      chestImg: def.img,
      gold: reward.gold,
      diamonds: reward.diamonds,
    })
    emit('close')
  }
}

const list = computed(() => CHEST_DEFS)
</script>

<template>
  <GameModal :open="open" title="Сундуки" @close="emit('close')">
    <div class="chest-grid">
      <div
        v-for="d in list"
        :key="d.type"
        class="chest-card"
        :class="'chest-card--' + d.rarity"
      >
        <div class="chest-name">{{ d.name }}</div>
        <div class="chest-art">
          <img :src="d.img" :alt="d.name" class="chest-img" draggable="false" />
        </div>
        <button
          v-if="d.gemCost === 0 && chestCount(d.type) > 0"
          class="chest-btn open"
          @click="openChest(d)"
        >
          Открыть
          <span class="badge">{{ chestCount(d.type) }}</span>
        </button>
        <button
          v-else-if="d.gemCost === 0 && dailyCommonReady"
          class="chest-btn open"
          @click="openChest(d)"
        >
          Открыть
        </button>
        <button
          v-else-if="d.gemCost === 0"
          class="chest-btn ad"
          @click="skipDailyCooldown(d)"
          :title="'Получить сейчас за рекламу. Иначе через ' + fmtCountdown(dailyCommonTimeLeft)"
        >
          <span class="ad-icon">📺</span>
          Открыть
        </button>
        <button
          v-else-if="chestCount(d.type) > 0"
          class="chest-btn open"
          @click="openChest(d)"
        >
          Открыть
          <span class="badge">{{ chestCount(d.type) }}</span>
        </button>
        <button
          v-else
          class="chest-btn buy"
          :disabled="game.diamonds < d.gemCost"
          @click="openChest(d)"
        >
          <img :src="iconStone" alt="" class="gem" />
          {{ d.gemCost }}
        </button>
      </div>
    </div>

    <div class="contents">
      <div class="contents-title">Содержимое сундуков:</div>
      <div class="contents-row">
        <div v-for="r in REWARDS" :key="r.id" class="reward-item">
          <div class="reward-icon" :style="{ color: r.color }">
            <img v-if="r.image" :src="r.image" alt="" class="reward-img" />
            <span v-else>{{ r.emoji }}</span>
          </div>
          <div class="reward-label">{{ r.label }}</div>
        </div>
      </div>
    </div>

  </GameModal>
</template>

<style scoped>
.chest-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.chest-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 6px 10px;
  border: 2px solid #1a0c04;
  border-radius: 12px;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.45),
    inset 0 -1px 0 rgba(255, 255, 255, 0.12);
}
.chest-card--common {
  background: linear-gradient(180deg, #e6c47a 0%, #b48438 100%);
  border-color: #5a3a14;
}
.chest-card--rare {
  background: linear-gradient(180deg, #5aa8d8 0%, #2a5a90 100%);
  border-color: #133560;
}
.chest-card--epic {
  background: linear-gradient(180deg, #a070d8 0%, #5a30a0 100%);
  border-color: #2a0a55;
}

.chest-name {
  font-size: 12px;
  font-weight: 800;
  color: #fff5d0;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
  line-height: 1.15;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chest-art {
  width: 92px;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chest-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
}

/* Buttons */
.chest-btn {
  position: relative;
  min-width: 80px;
  padding: 7px 12px 8px;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 900;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
  transition: transform 0.08s, box-shadow 0.08s;
}
.chest-btn.open {
  background: linear-gradient(180deg, #7ee06a 0%, #3aa84a 50%, #1e6c2e 100%);
  border: 2px solid #0c4018;
  color: #fff;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 3px 0 #0a2810;
}
.chest-btn.buy {
  background: linear-gradient(180deg, #b07aff 0%, #6a30c8 100%);
  border: 2px solid #2a0a4a;
  color: #fff;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(40, 0, 80, 0.5),
    0 3px 0 #1a0a2a;
}
.chest-btn.ad {
  background: linear-gradient(180deg, #ffb83a 0%, #d4881a 50%, #8a5a18 100%);
  border: 2px solid #4a2810;
  color: #2a1408;
  box-shadow:
    inset 0 2px 0 rgba(255, 240, 200, 0.5),
    inset 0 -2px 0 rgba(80, 40, 0, 0.4),
    0 3px 0 #3a1f0c;
  text-shadow: none;
}
.ad-icon {
  font-size: 13px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}
.chest-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(0, 0, 0, 0.4),
    0 1px 0 rgba(0, 0, 0, 0.6);
}
.chest-btn:disabled {
  filter: grayscale(0.5) brightness(0.65);
  cursor: not-allowed;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: radial-gradient(circle at 30% 30%, #ff6060, #c01010);
  border: 2px solid #fff;
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.gem {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
}

/* Contents section */
.contents {
  padding: 10px 12px;
  background: linear-gradient(180deg, #3a2010 0%, #2a1408 100%);
  border: 2px solid #1a0c04;
  border-radius: 10px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}
.contents-title {
  font-size: 12px;
  font-weight: 800;
  color: #c4a880;
  margin-bottom: 8px;
  text-align: center;
}
.contents-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.reward-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.reward-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(180deg, #4a2c14, #2a1808);
  border: 1.5px solid #1a0c04;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: inset 0 1px 0 rgba(255, 220, 160, 0.2);
}
.reward-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}
.reward-label {
  font-size: 10px;
  color: #fff5d0;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

</style>
