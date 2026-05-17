<script setup lang="ts">
import { ref } from 'vue'
import iconCoin from '@/assets/coin.png'
import iconStone from '@/assets/stone.png'
import { useGameStore } from '@/stores/game'
import { showRewarded } from '@/ads/ads'

const props = defineProps<{
  chestName: string
  chestImg: string
  gold: number
  diamonds: number
}>()
const emit = defineEmits<{ close: [] }>()

const game = useGameStore()
const doubled = ref(false)

function fmt(n: number): string {
  if (n < 1000) return Math.floor(n).toString()
  const units = ['', 'K', 'M', 'B']
  let i = 0
  let v = n
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i++
  }
  return v.toFixed(v < 10 ? 1 : 0) + units[i]
}

function doubleReward() {
  if (doubled.value) return
  showRewarded(() => {
    doubled.value = true
    if (props.gold > 0) game.addGold(props.gold)
    if (props.diamonds > 0) game.diamonds += props.diamonds
  })
}
</script>

<template>
  <div class="reward-overlay" @click.self="emit('close')">
    <div class="reward-popup">
      <div class="reward-title">Открыт {{ chestName }}!</div>
      <img :src="chestImg" alt="" class="reward-chest" draggable="false" />
      <div class="reward-list">
        <div v-if="gold > 0" class="reward-line">
          <img :src="iconCoin" alt="" class="reward-line-icon" />
          <span>+{{ fmt(gold) }} золота</span>
        </div>
        <div v-if="diamonds > 0" class="reward-line">
          <img :src="iconStone" alt="" class="reward-line-icon" />
          <span>+{{ diamonds }} алмазов</span>
        </div>
      </div>
      <div class="reward-buttons">
        <button
          v-if="!doubled && (gold > 0 || diamonds > 0)"
          class="reward-x2"
          @click="doubleReward"
        >
          <span class="ad-icon">📺</span>×2
        </button>
        <button class="reward-ok" @click="emit('close')">Забрать</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reward-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 250;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: fadeIn 0.2s;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.reward-popup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 20px 16px;
  min-width: 240px;
  background: linear-gradient(180deg, #d8a060 0%, #a87038 100%);
  border: 3px solid #4a2810;
  border-radius: 16px;
  box-shadow:
    inset 0 2px 0 rgba(255, 230, 170, 0.4),
    inset 0 -2px 0 rgba(0, 0, 0, 0.3),
    0 12px 30px rgba(0, 0, 0, 0.7);
}
.reward-title {
  font-size: 15px;
  font-weight: 900;
  color: #fff5d0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
  text-align: center;
}
.reward-chest {
  width: 110px;
  height: 110px;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.7));
  animation: chestPop 0.4s ease-out;
}
@keyframes chestPop {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}
.reward-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.reward-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 900;
  color: #fff5d0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.reward-line-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}
.reward-ok {
  margin-top: 4px;
  padding: 8px 22px;
  border-radius: 10px;
  background: linear-gradient(180deg, #7ee06a 0%, #3aa84a 50%, #1e6c2e 100%);
  border: 2px solid #0c4018;
  color: #fff;
  font-family: inherit;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 3px 0 #0a2810;
  transition: transform 0.08s, box-shadow 0.08s;
}
.reward-ok:active {
  transform: translateY(2px);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 1px 0 #0a2810;
}
.reward-buttons {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.reward-x2 {
  padding: 8px 16px;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffb83a 0%, #d4881a 50%, #8a5a18 100%);
  border: 2px solid #4a2810;
  color: #2a1408;
  font-family: inherit;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow:
    inset 0 2px 0 rgba(255, 240, 200, 0.5),
    inset 0 -2px 0 rgba(80, 40, 0, 0.4),
    0 3px 0 #3a1f0c;
  transition: transform 0.08s;
}
.reward-x2:active {
  transform: translateY(2px);
}
.ad-icon {
  font-size: 13px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
}
</style>
