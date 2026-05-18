<script setup lang="ts">
import { computed } from 'vue'
import GameModal from './GameModal.vue'
import { useGameStore, type Upgrade, FORGE_TIERS } from '@/stores/game'
import { fmt } from '@/utils/fmt'
import iconCoin from '@/assets/coin.png'
import iconAnvil from '@/assets/nako.png'

const UPGRADE_ICONS = import.meta.glob('@/assets/upgrade/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const ICON_BY_INDEX: Record<number, string> = {}
for (const [path, url] of Object.entries(UPGRADE_ICONS)) {
  const m = path.match(/(\d+)\.png$/)
  if (m) ICON_BY_INDEX[parseInt(m[1]!)] = url
}
function iconFor(u: Upgrade): string {
  return ICON_BY_INDEX[parseInt(u.id.slice(1))] ?? ''
}

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const game = useGameStore()

const list = computed(() => game.upgrades)
function isUnlocked(u: Upgrade): boolean {
  return game.forgeLevelDisplay >= u.requiredLevel
}

const groups = computed(() =>
  FORGE_TIERS.map((tier) => ({
    tier,
    unlocked: game.forgeLevelDisplay >= tier,
    upgrades: list.value.filter((u) => u.requiredLevel === tier),
  })).filter((g) => g.upgrades.length > 0),
)
function canBuy(u: Upgrade): boolean {
  return isUnlocked(u) && game.gold >= game.upgradeCost(u)
}
const cheapest = computed<Upgrade | undefined>(() => {
  let best: Upgrade | undefined
  for (const u of list.value) {
    if (!isUnlocked(u)) continue
    if (!best || game.upgradeCost(u) < game.upgradeCost(best)) best = u
  }
  return best
})

function buy(u: Upgrade) {
  if (!canBuy(u)) return
  game.buyUpgrade(u.id)
}
function buyCheapest() {
  if (cheapest.value) buy(cheapest.value)
}
</script>

<template>
  <GameModal :open="open" title="Улучшения" @close="emit('close')">
    <!-- Summary card -->
    <div class="summary">
      <img :src="iconAnvil" alt="" class="summary-icon" />
      <div class="summary-text">
        <div class="summary-label">Доход в секунду</div>
        <div class="summary-value">
          <img :src="iconCoin" alt="" class="coin-mini" />
          {{ fmt(game.passivePerSec) }}
        </div>
      </div>
      <button
        class="upgrade-btn"
        :disabled="!cheapest || game.gold < game.upgradeCost(cheapest)"
        @click="buyCheapest"
      >
        <div class="upgrade-btn-top">Улучшить x1</div>
        <div class="upgrade-btn-cost">
          <img :src="iconCoin" alt="" class="coin-mini" />
          {{ cheapest ? fmt(game.upgradeCost(cheapest)) : '—' }}
        </div>
      </button>
    </div>

    <!-- Upgrade groups by forge tier -->
    <div v-for="g in groups" :key="g.tier" class="tier-block" :class="{ 'tier-locked': !g.unlocked }">
      <div class="tier-header">
        <span class="tier-title">Кузница · Ур. {{ g.tier }}</span>
        <span v-if="!g.unlocked" class="tier-lock-text">🔒 Доступно с уровня {{ g.tier }}</span>
      </div>
      <ul class="up-list">
        <li v-for="u in g.upgrades" :key="u.id" class="up-row" :class="{ locked: !isUnlocked(u) }">
          <div class="up-icon">
            <img :src="iconFor(u)" :alt="u.name" draggable="false" />
            <div v-if="!isUnlocked(u)" class="up-lock">🔒</div>
          </div>
          <div class="up-info">
            <div class="up-name">{{ u.name }}</div>
            <div class="up-effect">{{ u.effect }}</div>
          </div>
          <div class="up-level">Ур. {{ u.level }}</div>
          <button
            class="up-buy"
            :disabled="!canBuy(u)"
            @click="buy(u)"
          >
            <template v-if="isUnlocked(u)">
              <img :src="iconCoin" alt="" class="coin-mini" />
              {{ fmt(game.upgradeCost(u)) }}
            </template>
            <span v-else class="up-buy-lock">Ур. {{ u.requiredLevel }}</span>
          </button>
        </li>
      </ul>
    </div>
  </GameModal>
</template>

<style scoped>
/* Summary card */
.summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: linear-gradient(180deg, #d8a060 0%, #a87038 100%);
  border: 2px solid #4a2810;
  border-radius: 12px;
  box-shadow:
    inset 0 2px 0 rgba(255, 230, 170, 0.4),
    inset 0 -2px 0 rgba(0, 0, 0, 0.3);
}
.summary-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.6));
}
.summary-text {
  flex: 1;
}
.summary-label {
  font-size: 13px;
  color: #4a2810;
  font-weight: 700;
  text-shadow: 0 1px 0 rgba(255, 230, 170, 0.4);
}
.summary-value {
  font-size: 26px;
  font-weight: 900;
  color: #fff5d0;
  display: flex;
  align-items: center;
  gap: 6px;
  text-shadow:
    0 1px 0 #4a2810,
    0 2px 4px rgba(0, 0, 0, 0.7);
  line-height: 1.1;
}

/* Upgrade button (big green) */
.upgrade-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 110px;
  padding: 6px 14px 7px;
  border-radius: 12px;
  background: linear-gradient(180deg, #7ee06a 0%, #3aa84a 50%, #1e6c2e 100%);
  border: 2px solid #0c4018;
  color: #fff;
  font-family: inherit;
  cursor: pointer;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 3px 0 #0a2810,
    0 5px 10px rgba(0, 0, 0, 0.5);
  transition: transform 0.08s, box-shadow 0.08s;
}
.upgrade-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 1px 0 #0a2810,
    0 3px 6px rgba(0, 0, 0, 0.5);
}
.upgrade-btn:disabled {
  filter: grayscale(0.6) brightness(0.7);
  cursor: not-allowed;
}
.upgrade-btn-top {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.upgrade-btn-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 900;
}

.coin-mini {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

/* Tier grouping */
.tier-block {
  margin-bottom: 12px;
}
.tier-block:last-child { margin-bottom: 0; }
.tier-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px 6px;
  margin-bottom: 4px;
}
.tier-title {
  font-size: 13px;
  font-weight: 900;
  color: #fff5d0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
  letter-spacing: 0.3px;
}
.tier-lock-text {
  font-size: 11px;
  font-weight: 800;
  color: #ffb04a;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.tier-block.tier-locked .up-list {
  filter: saturate(0.55);
}

/* Upgrade rows */
.up-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.up-row {
  display: grid;
  grid-template-columns: 44px 1fr auto auto;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  background: linear-gradient(180deg, #d8a060 0%, #a87038 100%);
  border: 2px solid #4a2810;
  border-radius: 10px;
  box-shadow:
    inset 0 1px 0 rgba(255, 230, 170, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}
.up-icon {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.up-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
}
.up-row.locked .up-icon img {
  filter: grayscale(1) brightness(0.45) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
}
.up-row.locked {
  filter: saturate(0.55);
}
.up-lock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  text-shadow: 0 2px 3px rgba(0, 0, 0, 0.8);
}
.req-locked {
  color: #c75a3a !important;
  font-weight: 800 !important;
}
.up-buy-lock {
  font-size: 12px;
  font-weight: 800;
}
.up-info {
  min-width: 0;
}
.up-name {
  font-size: 14px;
  font-weight: 800;
  color: #fff5d0;
  text-shadow:
    -1px -1px 0 #1a0a04,
     1px -1px 0 #1a0a04,
    -1px  1px 0 #1a0a04,
     1px  1px 0 #1a0a04,
     0 2px 3px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.up-effect {
  font-size: 11px;
  color: #4a2810;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.up-level {
  font-size: 13px;
  font-weight: 800;
  color: #4a2810;
  padding: 0 4px;
  text-shadow: 0 1px 0 rgba(255, 230, 170, 0.4);
}
.up-buy {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 78px;
  justify-content: center;
  padding: 7px 10px;
  border-radius: 10px;
  background: linear-gradient(180deg, #7ee06a 0%, #3aa84a 50%, #1e6c2e 100%);
  border: 2px solid #0c4018;
  color: #fff;
  font-family: inherit;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 3px 0 #0a2810;
  transition: transform 0.08s, box-shadow 0.08s;
}
.up-buy:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 1px 0 #0a2810;
}
.up-buy:disabled {
  filter: grayscale(0.6) brightness(0.7);
  cursor: not-allowed;
}
</style>
