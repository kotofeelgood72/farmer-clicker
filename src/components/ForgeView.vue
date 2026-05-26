<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { fmt } from '@/utils/fmt'
import iconCoin from '@/assets/coin.png'
import level1 from '@/assets/level/1.png'
import level2 from '@/assets/level/2.png'
import level3 from '@/assets/level/3.png'
import level4 from '@/assets/level/4.png'
import level5 from '@/assets/level/5.png'

const emit = defineEmits<{ close: [] }>()
const game = useGameStore()

interface LevelDef {
  lvl: number
  thumb: string
}
const LEVELS: LevelDef[] = [
  { lvl: 1,  thumb: level1 },
  { lvl: 10, thumb: level2 },
  { lvl: 20, thumb: level3 },
  { lvl: 30, thumb: level4 },
  { lvl: 40, thumb: level5 },
]
const currentLevel = computed(() => game.forgeLevelDisplay)
const selectedLevel = ref(currentLevel.value)
// Image shown in the main display — the thumbnail of the selected milestone.
const currentForgeImage = computed(() => {
  const found = LEVELS.find((l) => l.lvl === selectedLevel.value)
  return found ? found.thumb : LEVELS[0]!.thumb
})

function bonusFor(lvl: number): number {
  return lvl * 10
}
function isUnlocked(lvl: number) {
  return currentLevel.value >= lvl
}
function upgradeCost(): number {
  return Math.floor(25000 * Math.pow(1.4, Math.max(0, currentLevel.value - 1)))
}

function doUpgrade() {
  const cost = upgradeCost()
  if (game.gold < cost) return
  game.gold -= cost
}
</script>

<template>
  <Transition name="forge">
    <div class="forge-frame">
      <!-- Header -->
      <div class="header">
        <div class="title-plank">
          <span class="title-text">Кузница</span>
        </div>
        <button class="close-btn" @click="emit('close')" aria-label="Закрыть">×</button>
      </div>

      <!-- Body -->
      <div class="body">
        <!-- Left levels list -->
        <div class="levels">
          <button
            v-for="l in LEVELS"
            :key="l.lvl"
            class="level-card"
            :class="{ active: selectedLevel === l.lvl, locked: !isUnlocked(l.lvl) }"
            :disabled="!isUnlocked(l.lvl)"
            @click="isUnlocked(l.lvl) && (selectedLevel = l.lvl)"
          >
            <div class="level-label">Ур. {{ l.lvl }}</div>
            <div class="level-thumb">
              <img :src="l.thumb" alt="" class="level-icon" />
              <span v-if="!isUnlocked(l.lvl)" class="level-lock">🔒</span>
            </div>
          </button>
        </div>

        <!-- Forge display -->
        <div class="forge-display" :style="{ backgroundImage: `url(${currentForgeImage})` }">
          <div class="forge-vignette"></div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-info">
          <div class="footer-level">Уровень кузницы {{ currentLevel }}</div>
          <div class="footer-bonus">Бонус: <b>+{{ bonusFor(currentLevel) }}%</b> к доходу</div>
        </div>
        <button class="upgrade-btn" :disabled="game.gold < upgradeCost()" @click="doUpgrade">
          <div class="upgrade-label">Улучшить</div>
          <div class="upgrade-cost">
            <img :src="iconCoin" alt="" class="coin-mini" />
            {{ fmt(upgradeCost()) }}
          </div>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.forge-frame {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: rgba(20, 10, 5, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 80;
  font-family: 'Fredoka', 'Trebuchet MS', system-ui, sans-serif;
  color: #f3e9c8;
}
/* Header */
.header {
  position: relative;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 56px;
}
.title-plank {
  flex: 1;
  background: linear-gradient(180deg, #c89060 0%, #8a5a2a 50%, #6a3a18 100%);
  border: 3px solid #3a1f0c;
  border-radius: 14px;
  padding: 10px 50px 12px;
  text-align: center;
  position: relative;
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 160, 0.4),
    inset 0 -2px 0 rgba(0, 0, 0, 0.35),
    0 6px 12px rgba(0, 0, 0, 0.6);
}
.title-plank::before,
.title-plank::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #f0d090, #6a3a18);
  border: 1px solid #2a1408;
  transform: translateY(-50%);
}
.title-plank::before { left: 12px; }
.title-plank::after  { right: 12px; }
.title-text {
  font-weight: 900;
  font-size: 18px;
  letter-spacing: 1.5px;
  color: #fff5d0;
  text-transform: uppercase;
  text-shadow: 0 1px 0 #3a1f0c, 0 2px 4px rgba(0, 0, 0, 0.8);
}
.close-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ff8a8a 0%, #e63030 50%, #a01818 100%);
  border: 3px solid #5a0a0a;
  color: #fff5d0;
  font-size: 24px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding-bottom: 4px;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.4),
    inset 0 -2px 0 rgba(0, 0, 0, 0.4),
    0 3px 0 #5a0a0a,
    0 5px 10px rgba(0, 0, 0, 0.6);
  transition: transform 0.08s;
}
.close-btn:active { transform: translateY(2px); }

/* Body */
.body {
  display: grid;
  grid-template-columns: 108px 1fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

/* Levels sidebar */
.levels {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  padding: 0;
  background: transparent;
  border: none;
  scrollbar-width: thin;
  scrollbar-color: #8a5a2a #2a1408;
}
.level-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px 4px 6px;
  background: linear-gradient(180deg, #3a2010 0%, #2a1408 100%);
  border: 2px solid #1a0c04;
  border-radius: 10px;
  color: #fff5d0;
  font-family: inherit;
  cursor: pointer;
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 160, 0.15),
    inset 0 -2px 0 rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
  text-align: left;
  transition: transform 0.08s, box-shadow 0.08s;
}
.level-card:hover:not(:disabled) {
  border-color: #6a3a18;
}
.level-card.active {
  border-color: #f0c060;
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 160, 0.35),
    inset 0 -2px 0 rgba(0, 0, 0, 0.4),
    0 0 10px rgba(240, 192, 96, 0.55);
}
.level-card.locked {
  cursor: not-allowed;
  opacity: 0.92;
}
.level-card.locked .level-icon {
  filter: grayscale(1) brightness(0.55) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
.level-label {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.7);
  text-align: center;
  padding: 4px 0;
}
.level-thumb {
  position: relative;
  flex: 1;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  background: linear-gradient(180deg, #6a3a18, #3a1f0c);
  border: 1.5px solid #1a0c04;
  display: flex;
  align-items: center;
  justify-content: center;
}
.level-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
.level-lock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
}

/* Forge display */
.forge-display {
  position: relative;
  background-size: cover;
  background-position: center;
  background-color: #2a1408;
  border: 2px solid #1a0c04;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
}
.forge-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.55) 100%);
  pointer-events: none;
}
/* Footer */
.footer {
  margin-top: 10px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  background: linear-gradient(180deg, #3a2010 0%, #2a1408 100%);
  border: 2px solid #1a0c04;
  border-radius: 12px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}
.footer-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.footer-level {
  font-size: 15px;
  font-weight: 900;
  color: #fff5d0;
  letter-spacing: 0.3px;
  text-shadow:
    0 1px 0 #3a1f0c,
    0 2px 4px rgba(0, 0, 0, 0.7);
}
.footer-bonus {
  font-size: 13px;
  font-weight: 800;
  color: #f0d090;
  text-shadow:
    0 1px 0 #3a1f0c,
    0 2px 3px rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}
.footer-bonus b {
  display: inline-block;
  margin: 0 2px;
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 900;
  color: #ffffff;
  background: linear-gradient(180deg, #7ee06a 0%, #2e8b3a 100%);
  border: 1.5px solid #0c4018;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 -1px 0 rgba(0, 60, 20, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.5);
  text-shadow:
    0 1px 0 rgba(0, 0, 0, 0.5),
    0 0 6px rgba(126, 224, 106, 0.6);
}

.upgrade-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 130px;
  padding: 8px 18px 10px;
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
    0 1px 0 #0a2810;
}
.upgrade-btn:disabled {
  filter: grayscale(0.6) brightness(0.7);
  cursor: not-allowed;
}
.upgrade-label {
  font-size: 14px;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.upgrade-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15px;
  font-weight: 900;
}
.coin-mini {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

/* Transition */
.forge-enter-active,
.forge-leave-active {
  transition: opacity 0.2s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.forge-enter-from,
.forge-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* ------------------------------------------------------------ */
/*  RESPONSIVE: mobile (≤ 768px)                                */
/*  Level cards move to the top as a swipeable horizontal       */
/*  carousel (CSS scroll-snap), showing 2 cards per view.       */
/* ------------------------------------------------------------ */
@media (max-width: 768px) {
  .forge-frame {
    padding: 8px;
  }
  .header {
    min-height: 48px;
    margin-bottom: 8px;
  }
  .title-plank {
    padding: 8px 44px 9px;
    border-radius: 12px;
  }
  .title-text {
    font-size: 15px;
    letter-spacing: 1px;
  }
  .close-btn {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  /* Body becomes vertical: carousel on top, big forge image below */
  .body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Horizontal swipe carousel — 2 cards per view */
  .levels {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    touch-action: pan-x;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 8px;
    padding: 2px 2px 6px;
    scrollbar-width: none;
  }
  .levels::-webkit-scrollbar {
    display: none;
  }
  .level-card {
    flex: 0 0 calc(50% - 4px);
    min-width: 0;
    flex-direction: column;
    scroll-snap-align: start;
    padding: 6px;
    gap: 6px;
  }
  .level-label {
    font-size: 13px;
    text-align: center;
    width: 100%;
  }
  .level-thumb {
    width: 100%;
    height: 64px;
    flex: none;
  }

  /* Big forge display fills the rest of the screen */
  .forge-display {
    min-height: 0;
    flex: 1;
  }

  /* Footer */
  .footer {
    padding: 8px 10px;
    gap: 8px;
  }
  .footer-level {
    font-size: 13px;
  }
  .footer-bonus {
    font-size: 11px;
  }
  .footer-bonus b {
    font-size: 12px;
    padding: 1px 5px;
  }
  .upgrade-btn {
    min-width: 110px;
    padding: 6px 14px 8px;
  }
  .upgrade-label {
    font-size: 12px;
  }
  .upgrade-cost {
    font-size: 13px;
  }
  .coin-mini {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 400px) {
  .level-card {
    flex: 0 0 calc(50% - 4px);
  }
  .level-thumb {
    height: 56px;
  }
}
</style>
