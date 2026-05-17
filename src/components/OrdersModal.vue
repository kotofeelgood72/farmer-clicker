<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GameModal from './GameModal.vue'
import { useGameStore, HEROES } from '@/stores/game'
import { showRewarded } from '@/ads/ads'
import iconCoin from '@/assets/coin.png'
import iconStar from '@/assets/nav-item-3.png'
import iconStone from '@/assets/stone.png'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const game = useGameStore()

function heroById(id: string) {
  return HEROES.find((h) => h.id === id)
}
function heroFullName(heroId: string): string {
  return heroById(heroId)?.name ?? '?'
}
function heroAvatar(heroId: string): string | undefined {
  return heroById(heroId)?.avatar
}

// Countdown to next-order refresh (purely cosmetic — orders spawn randomly via tick)
const nextSpawn = ref(formatTime(465))
let timer = 0
let countdown = 465
function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
onMounted(() => {
  timer = window.setInterval(() => {
    countdown -= 1
    if (countdown <= 0) countdown = 600
    nextSpawn.value = formatTime(countdown)
  }, 1000)
})
onBeforeUnmount(() => clearInterval(timer))

function fmt(n: number): string {
  if (n < 1000) return Math.floor(n).toString()
  const units = ['', 'K', 'M', 'B', 'T']
  let i = 0
  let v = n
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i++
  }
  return v.toFixed(v < 10 ? 2 : 1) + units[i]
}

function itemName(id: string) {
  return game.items.find((x) => x.id === id)?.name ?? '?'
}
function itemImage(id: string): string | undefined {
  return game.items.find((x) => x.id === id)?.image
}
function itemRequiredLevel(id: string) {
  return game.items.find((x) => x.id === id)?.requiredLevel ?? 1
}
function orderXp(id: string): number {
  return game.orderXp(itemRequiredLevel(id))
}
function itemCount(id: string) {
  return game.items.find((x) => x.id === id)?.count ?? 0
}

function completeWithX2(id: string) {
  showRewarded(() => game.completeOrder(id, 2))
}

const refreshCost = 50
function refreshOrders() {
  if (game.diamonds < refreshCost) return
  game.diamonds -= refreshCost
  game.orders = []
  for (let i = 0; i < 3; i++) game.spawnOrder()
}

const ordersList = computed(() => {
  if (game.orders.length === 0) {
    for (let i = 0; i < 3; i++) game.spawnOrder()
  }
  return game.orders
})
</script>

<template>
  <GameModal :open="open" title="Заказы героев" @close="emit('close')">
    <!-- Refresh timer banner -->
    <div class="refresh-bar">
      <span>Новые заказы через: <b>{{ nextSpawn }}</b></span>
      <button class="refresh-spin" @click="refreshOrders" :disabled="game.diamonds < refreshCost">⟳</button>
    </div>

    <!-- Orders list -->
    <ul class="o-list">
      <li v-for="o in ordersList" :key="o.id" class="o-row">
        <div class="o-portrait">
          <img :src="heroAvatar(o.hero)" alt="" class="o-avatar-img" />
        </div>
        <div class="o-info">
          <div class="o-name">{{ heroFullName(o.hero) }}</div>
          <div class="o-item">
            <img :src="itemImage(o.itemId)" alt="" class="o-item-icon" />
            <span class="o-item-name">{{ itemName(o.itemId) }}</span>
          </div>
          <div class="o-level">Ур. {{ itemRequiredLevel(o.itemId) }}</div>
        </div>
        <div class="o-reward">
          <div class="o-reward-label">Награда:</div>
          <div class="o-reward-row">
            <img :src="iconCoin" alt="" class="coin-mini" />
            <span>{{ fmt(o.rewardGold) }}</span>
          </div>
          <div class="o-reward-row">
            <img :src="iconStar" alt="" class="star-img" />
            <span>+{{ fmt(orderXp(o.itemId)) }} XP</span>
          </div>
          <div class="o-actions">
            <button
              class="o-buy"
              :disabled="itemCount(o.itemId) <= 0"
              @click="game.completeOrder(o.id)"
            >
              Выполнить
            </button>
            <button
              class="o-buy x2"
              :disabled="itemCount(o.itemId) <= 0"
              @click="completeWithX2(o.id)"
              title="Смотреть рекламу — удвоить награду"
            >
              <span class="ad-icon">📺</span>×2
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- Refresh button -->
    <button
      class="refresh-btn"
      :disabled="game.diamonds < refreshCost"
      @click="refreshOrders"
    >
      <span>Обновить заказы</span>
      <span class="gem-cost">
        <img :src="iconStone" alt="" class="gem" /> {{ refreshCost }}
      </span>
    </button>
  </GameModal>
</template>

<style scoped>
.refresh-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  margin-bottom: 10px;
  background: linear-gradient(180deg, #3a2010 0%, #2a1408 100%);
  border: 2px solid #1a0c04;
  border-radius: 10px;
  font-size: 13px;
  color: #c4a880;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}
.refresh-bar b {
  color: #fff5d0;
  font-weight: 900;
  margin-left: 4px;
}
.refresh-spin {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(180deg, #c08040, #7a4418);
  border: 2px solid #2a1408;
  color: #fff5d0;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: inset 0 1px 0 rgba(255, 220, 160, 0.35);
}
.refresh-spin:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.o-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.o-row {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 10px;
  padding: 10px;
  background: linear-gradient(180deg, #d8a060 0%, #a87038 100%);
  border: 2px solid #4a2810;
  border-radius: 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 230, 170, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}
.o-portrait {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: radial-gradient(circle at 30% 25%, #ffe680 0%, #c89060 60%, #6a3a18 100%);
  border: 3px solid #2a1408;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(255, 230, 170, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.4);
}
.o-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}
.o-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.o-name {
  font-size: 15px;
  font-weight: 900;
  color: #fff5d0;
  text-shadow:
    -1px -1px 0 #1a0a04,
     1px -1px 0 #1a0a04,
    -1px  1px 0 #1a0a04,
     1px  1px 0 #1a0a04,
     0 2px 3px rgba(0, 0, 0, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.o-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #4a2810;
  font-weight: 700;
}
.o-item-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
}
.o-item-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.o-level {
  font-size: 11px;
  font-weight: 700;
  color: #4a2810;
}

.o-reward {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 92px;
}
.o-reward-label {
  font-size: 11px;
  color: #4a2810;
  font-weight: 700;
}
.o-reward-row {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 900;
  color: #fff5d0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}
.star-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
.coin-mini {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.o-buy {
  margin-top: 4px;
  padding: 6px 14px;
  border-radius: 10px;
  background: linear-gradient(180deg, #7ee06a 0%, #3aa84a 50%, #1e6c2e 100%);
  border: 2px solid #0c4018;
  color: #fff;
  font-family: inherit;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 2px 0 #0a2810;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}
.o-buy:active:not(:disabled) {
  transform: translateY(1px);
}
.o-buy:disabled {
  filter: grayscale(0.6) brightness(0.7);
  cursor: not-allowed;
}
.o-actions {
  display: flex;
  gap: 4px;
  align-items: stretch;
}
.o-buy.x2 {
  background: linear-gradient(180deg, #ffb83a 0%, #d4881a 50%, #8a5a18 100%);
  border-color: #4a2810;
  color: #2a1408;
  font-size: 11px;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 2px;
  text-shadow: none;
  box-shadow:
    inset 0 2px 0 rgba(255, 240, 200, 0.5),
    inset 0 -2px 0 rgba(80, 40, 0, 0.4),
    0 2px 0 #3a1f0c;
}
.ad-icon {
  font-size: 12px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
}

.refresh-btn {
  margin-top: 12px;
  width: 100%;
  padding: 12px 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, #7ee06a 0%, #3aa84a 50%, #1e6c2e 100%);
  border: 2px solid #0c4018;
  color: #fff;
  font-family: inherit;
  font-weight: 900;
  font-size: 15px;
  cursor: pointer;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 3px 0 #0a2810,
    0 5px 10px rgba(0, 0, 0, 0.5);
}
.refresh-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 1px 0 #0a2810;
}
.refresh-btn:disabled {
  filter: grayscale(0.6) brightness(0.7);
  cursor: not-allowed;
}
.gem-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 14px;
}
.gem {
  width: 16px;
  height: 16px;
  object-fit: contain;
  vertical-align: middle;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
}
</style>
