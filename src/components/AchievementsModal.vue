<script setup lang="ts">
import { computed } from 'vue'
import GameModal from './GameModal.vue'
import { useGameStore, type Achievement } from '@/stores/game'
import { fmt } from '@/utils/fmt'
import iconStone from '@/assets/stone.png'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const game = useGameStore()

function progress(a: Achievement): number {
  if (a.metric === 'clicks') return game.clicks
  if (a.metric === 'gold') return game.totalGoldEarned
  if (a.metric === 'crafts') return game.totalCrafts
  if (a.metric === 'forgeLevel') return game.forgeLevelDisplay
  if (a.metric === 'uniqueItems') return game.items.filter((i) => i.count > 0).length
  return 0
}

function pct(a: Achievement): number {
  return Math.min(100, (progress(a) / a.target) * 100)
}

const list = computed(() => game.achievements)

function claim(a: Achievement) {
  if (a.done) return
  if (progress(a) < a.target) return
  a.done = true
  game.diamonds += a.reward
}
</script>

<template>
  <GameModal :open="open" title="Достижения" @close="emit('close')">
    <ul class="a-list">
      <li v-for="a in list" :key="a.id" class="a-row" :class="{ done: a.done }">
        <div class="a-icon">
          <img :src="a.image" alt="" class="a-img" />
        </div>
        <div class="a-info">
          <div class="a-name">{{ a.name }}</div>
          <div class="a-desc">{{ a.description }}</div>
          <div class="a-progress">
            <div class="a-progress-fill" :style="{ width: pct(a) + '%' }"></div>
            <div class="a-progress-text">{{ fmt(progress(a)) }} / {{ fmt(a.target) }}</div>
          </div>
        </div>
        <button
          class="a-claim"
          :disabled="a.done || progress(a) < a.target"
          @click="claim(a)"
        >
          <div class="a-claim-top">{{ a.done ? '✓' : 'Забрать' }}</div>
          <div class="a-claim-cost">
            <img :src="iconStone" alt="" class="gem" />
            <span>{{ a.reward }}</span>
          </div>
        </button>
      </li>
    </ul>
  </GameModal>
</template>

<style scoped>
.a-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.a-row {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  background: linear-gradient(180deg, #d8a060 0%, #a87038 100%);
  border: 2px solid #4a2810;
  border-radius: 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 230, 170, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}
.a-row.done {
  filter: saturate(0.7);
}

/* Star icon plate */
.a-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(180deg, #6a3a18, #3a1f0c);
  border: 2px solid #2a1408;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 220, 160, 0.25);
}
.a-img {
  width: 46px;
  height: 46px;
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
}

.a-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.a-name {
  font-size: 14px;
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
.a-desc {
  font-size: 11px;
  color: #4a2810;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Progress bar */
.a-progress {
  position: relative;
  height: 14px;
  margin-top: 2px;
  background: linear-gradient(180deg, #0a0604 0%, #1a0f06 100%);
  border: 1.5px solid #1a0f06;
  border-radius: 7px;
  overflow: hidden;
  box-shadow:
    inset 0 2px 3px rgba(0, 0, 0, 0.8),
    0 1px 0 rgba(255, 220, 160, 0.25);
}
.a-progress-fill {
  height: 100%;
  background: linear-gradient(180deg, #a8f070 0%, #5bc94a 45%, #2e8b3a 100%);
  border-radius: 7px;
  transition: width 0.3s;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 80, 20, 0.5);
}
.a-progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.3px;
  text-shadow:
    -1px 0 0 #1a3a10,
    1px 0 0 #1a3a10,
    0 -1px 0 #1a3a10,
    0 1px 0 #1a3a10;
}

/* Claim button */
.a-claim {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 78px;
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
.a-claim:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 1px 0 #0a2810;
}
.a-claim:disabled {
  filter: grayscale(0.6) brightness(0.7);
  cursor: not-allowed;
}
.a-claim-top {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.a-claim-cost {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-weight: 900;
}
.gem {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
}
</style>
