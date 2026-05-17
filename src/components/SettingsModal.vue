<script setup lang="ts">
import { ref } from 'vue'
import GameModal from './GameModal.vue'
import { useGameStore } from '@/stores/game'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const game = useGameStore()

function resetProgress() {
  if (confirm('Сбросить весь прогресс? Это действие необратимо.')) {
    game.resetAll()
    emit('close')
  }
}
const saved = ref(false)
let savedTimer = 0
function saveProgress() {
  game.save()
  saved.value = true
  clearTimeout(savedTimer)
  savedTimer = window.setTimeout(() => (saved.value = false), 1500)
}
</script>

<template>
  <GameModal :open="open" title="Настройки" @close="emit('close')">
    <div class="s-list">
      <label class="s-row">
        <span class="s-label">Звук</span>
        <input type="checkbox" v-model="game.settings.sound" />
        <span class="s-toggle"><span class="s-toggle-knob"></span></span>
      </label>
      <label class="s-row">
        <span class="s-label">Музыка</span>
        <input type="checkbox" v-model="game.settings.music" />
        <span class="s-toggle"><span class="s-toggle-knob"></span></span>
      </label>
      <button class="action-btn save" @click="saveProgress">
        {{ saved ? '✓ Сохранено' : 'Сохранить' }}
      </button>
      <button class="action-btn danger" @click="resetProgress">Сброс прогресса</button>
    </div>
  </GameModal>
</template>

<style scoped>
.s-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Setting rows (toggle) */
.s-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(180deg, #3a2010 0%, #2a1408 100%);
  border: 2px solid #1a0c04;
  border-radius: 10px;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 -1px 0 rgba(255, 215, 130, 0.12);
  min-height: 38px;
}
.s-label {
  font-size: 13px;
  font-weight: 800;
  color: #fff5d0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

/* Hidden native input */
.s-row input[type='checkbox'] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

/* Custom toggle */
.s-toggle {
  position: relative;
  width: 44px;
  height: 22px;
  background: linear-gradient(180deg, #2a1a0a, #1a0c04);
  border: 2px solid #1a0c04;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.7);
  flex-shrink: 0;
  transition: background 0.2s;
}
.s-toggle-knob {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #f0e0c0, #8a7050);
  border: 1px solid #2a1408;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  transition: transform 0.2s;
}
.s-row input:checked ~ .s-toggle {
  background: linear-gradient(180deg, #5bc94a, #2e8b3a);
  border-color: #0c4018;
}
.s-row input:checked ~ .s-toggle .s-toggle-knob {
  transform: translateX(22px);
  background: radial-gradient(circle at 30% 30%, #fff, #d0d4d8);
}

/* Action button (Reset) */
.action-btn {
  padding: 10px 12px;
  border-radius: 10px;
  border: 2px solid #4a2810;
  color: #fff5d0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
  cursor: pointer;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 160, 0.4),
    inset 0 -2px 0 rgba(0, 0, 0, 0.35),
    0 3px 0 #3a1f0c,
    0 4px 6px rgba(0, 0, 0, 0.5);
  transition: transform 0.08s, box-shadow 0.08s;
  margin-top: 4px;
}
.action-btn:active {
  transform: translateY(2px);
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 160, 0.3),
    inset 0 -2px 0 rgba(0, 0, 0, 0.35),
    0 1px 0 #3a1f0c,
    0 2px 4px rgba(0, 0, 0, 0.5);
}
.action-btn.save {
  background: linear-gradient(180deg, #7ee06a 0%, #3aa84a 50%, #1e6c2e 100%);
  border-color: #0c4018;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 -2px 0 rgba(0, 60, 20, 0.5),
    0 3px 0 #0a2810,
    0 4px 6px rgba(0, 0, 0, 0.5);
}
.action-btn.danger {
  background: linear-gradient(180deg, #e85a5a 0%, #b02020 50%, #801010 100%);
  border-color: #4a0a0a;
  box-shadow:
    inset 0 2px 0 rgba(255, 200, 200, 0.35),
    inset 0 -2px 0 rgba(0, 0, 0, 0.35),
    0 3px 0 #3a0a0a,
    0 4px 6px rgba(0, 0, 0, 0.5);
}
</style>
