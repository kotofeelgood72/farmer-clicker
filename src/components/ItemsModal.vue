<script setup lang="ts">
import { computed } from 'vue'
import GameModal from './GameModal.vue'
import { useGameStore, type Item, type Rarity } from '@/stores/game'
import { fmt } from '@/utils/fmt'
import iconCoin from '@/assets/coin.png'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const game = useGameStore()

const list = computed(() => game.items)

const RARITY_CLASS: Record<Rarity, string> = {
  'Обычный': 'r-common',
  'Редкий': 'r-rare',
  'Эпический': 'r-epic',
  'Легендарный': 'r-legendary',
  'Мифический': 'r-mythic',
}

function isUnlocked(it: Item): boolean {
  return game.forgeLevelDisplay >= it.requiredLevel
}
function canCraft(it: Item): boolean {
  return isUnlocked(it) && game.gold >= it.cost
}
function craft(it: Item) {
  if (!canCraft(it)) return
  game.craft(it.id)
}
</script>

<template>
  <GameModal :open="open" title="Создание предметов" @close="emit('close')">
    <!-- Item list -->
    <ul class="it-list">
      <li v-for="it in list" :key="it.id" class="it-row" :class="{ locked: !isUnlocked(it) }">
        <div class="it-icon">
          <img :src="it.image" alt="" />
          <div v-if="!isUnlocked(it)" class="it-lock">🔒</div>
        </div>
        <div class="it-info">
          <div class="it-name" :class="RARITY_CLASS[it.rarity]">{{ it.name }}</div>
          <div class="it-meta" :class="{ 'meta-locked': !isUnlocked(it) }">
            Ур. {{ it.requiredLevel }}<span v-if="it.count > 0"> · ×{{ it.count }}</span>
          </div>
          <div class="it-income">
            <img :src="iconCoin" class="coin-mini" alt="" />
            +{{ fmt(it.income) }}
          </div>
        </div>
        <button
          class="it-buy"
          :disabled="!canCraft(it)"
          @click="craft(it)"
        >
          <div class="it-buy-label">{{ isUnlocked(it) ? 'Создать' : `Ур. ${it.requiredLevel}` }}</div>
          <div class="it-buy-cost">
            <img :src="iconCoin" class="coin-mini" alt="" />
            {{ fmt(it.cost) }}
          </div>
        </button>
      </li>
    </ul>
  </GameModal>
</template>

<style scoped>
/* Item rows */
.it-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.it-row {
  display: grid;
  grid-template-columns: 56px 1fr auto;
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
.it-icon {
  position: relative;
  width: 56px;
  height: 56px;
  background: linear-gradient(180deg, #6a3a18, #3a1f0c);
  border: 2px solid #2a1408;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 220, 160, 0.25);
}
.it-icon img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
}
.it-row.locked .it-icon img {
  filter: grayscale(1) brightness(0.45) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
}
.it-lock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  text-shadow: 0 2px 3px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.35);
  border-radius: 6px;
}
.it-row.locked {
  filter: saturate(0.55);
}
.meta-locked {
  color: #c75a3a !important;
}
.it-info {
  min-width: 0;
  line-height: 1.2;
}
.it-name {
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Rarity colors — brightened + outlined for legibility on warm brown rows. */
.r-common,
.r-rare,
.r-epic,
.r-legendary,
.r-mythic {
  text-shadow:
    -1px -1px 0 #1a0a04,
     1px -1px 0 #1a0a04,
    -1px  1px 0 #1a0a04,
     1px  1px 0 #1a0a04,
     0 2px 4px rgba(0, 0, 0, 0.65);
}
.r-common    { color: #fff5d0; }
.r-rare      { color: #7cf58a; }
.r-epic      { color: #d9a8ff; }
.r-legendary { color: #ffc44a; }
.r-mythic    { color: #ff7da0; }

.it-meta {
  font-size: 11px;
  font-weight: 700;
  color: #4a2810;
}
.it-income {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 800;
  color: #fff5d0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  margin-top: 1px;
}

.coin-mini {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

.it-buy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 88px;
  padding: 6px 12px 7px;
  border-radius: 10px;
  background: linear-gradient(180deg, #7ee06a 0%, #3aa84a 50%, #1e6c2e 100%);
  border: 2px solid #0c4018;
  color: #fff;
  font-family: inherit;
  cursor: pointer;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 3px 0 #0a2810,
    0 5px 8px rgba(0, 0, 0, 0.4);
  transition: transform 0.08s, box-shadow 0.08s;
}
.it-buy:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 1px 0 #0a2810;
}
.it-buy:disabled {
  filter: grayscale(0.6) brightness(0.7);
  cursor: not-allowed;
}
.it-buy-label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.it-buy-cost {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-weight: 900;
}

</style>
