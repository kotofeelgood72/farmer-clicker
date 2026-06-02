<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import {
  useDailyRewards,
  type DailyRewardCard,
} from '@/composables/useDailyRewards'

import rewardStone from '@/assets/ui/stone.png'
import rewardEnergy from '@/assets/ui/energy.png'
import rewardGemstone from '@/assets/ui/gemstone.png'
import rewardStones from '@/assets/ui/stones.png'

import IconCheck from '~icons/solar/check-circle-bold'
import IconLock from '~icons/solar/lock-bold'
import IconAdVideo from '~icons/solar/clapperboard-play-bold'

const {
  streakDay,
  cards,
  todayRewardDoubled,
  canClaimToday,
  canClaimDoubledViaAd,
  todayClaimMultiplier,
  claimingAd,
  isModalOpen,
  claimToday,
  claimTodayDoubledViaAd,
  closeModal,
} = useDailyRewards()

const rewardIcons: Record<number, string> = {
  1: rewardStone,
  2: rewardEnergy,
  3: rewardGemstone,
  4: rewardEnergy,
  5: rewardStones,
  6: rewardEnergy,
  7: rewardStones,
}

function cardLabel(card: DailyRewardCard): string {
  if (card.status === 'today') return 'Сегодня'
  if (card.status === 'claimed') return `День ${card.day}`
  return `День ${card.day}`
}

function onClaim() {
  claimToday(todayClaimMultiplier.value)
}

function onClaimDoubled() {
  claimTodayDoubledViaAd()
}

function rewardUnit(type: 'diamonds' | 'energy') {
  return type === 'diamonds' ? 'алмазов' : 'энергии'
}

function onBackdrop() {
  closeModal()
}
</script>

<template>
  <Transition name="daily-fade">
    <div
      v-if="isModalOpen"
      class="daily-backdrop phone-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Ежедневные награды"
      @click.self="onBackdrop"
    >
      <div class="daily-sheet modal-surface">
        <div class="daily-head">
          <h2 class="daily-title">Ежедневные награды</h2>
          <p class="daily-sub">День {{ streakDay }} из 7</p>
        </div>

        <div class="daily-grid">
          <div
            v-for="card in cards"
            :key="card.day"
              :class="[
                'daily-card',
                `daily-card--${card.status}`,
                card.day > 4 ? 'daily-card--row2' : '',
              ]"
            >
              <div class="daily-card__day">{{ cardLabel(card) }}</div>
              <img
                :src="rewardIcons[card.day]"
                :alt="card.type === 'diamonds' ? 'Алмазы' : 'Энергия'"
                class="daily-card__icon"
              />
              <div class="daily-card__amount">{{ card.amount }}</div>
              <div class="daily-card__status">
                <IconCheck
                  v-if="card.status === 'claimed'"
                  class="status-icon status-icon--green"
                />
                <IconCheck
                  v-else-if="card.status === 'today'"
                  class="status-icon status-icon--gold"
                />
                <IconLock v-else class="status-icon status-icon--lock" />
              </div>
            </div>
          </div>

        <div class="daily-actions">
          <AppButton
            class="daily-claim"
            variant="secondary"
            :disabled="!canClaimToday || claimingAd"
            @click="onClaim"
          >
            Забрать награду
          </AppButton>

          <button
            v-if="canClaimDoubledViaAd"
            type="button"
            class="daily-claim-x2"
            :disabled="!canClaimToday || claimingAd"
            @click="onClaimDoubled"
          >
            <span class="daily-claim-x2__icon" aria-hidden="true">
              <IconAdVideo />
            </span>
            <span class="daily-claim-x2__text">
              <span class="daily-claim-x2__title">Получить награду x2</span>
              <span
                v-if="todayRewardDoubled"
                class="daily-claim-x2__hint"
              >
                +{{ todayRewardDoubled.amount }}
                {{ rewardUnit(todayRewardDoubled.type) }}
                за просмотр рекламы
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.daily-backdrop {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
}

.daily-sheet {
  width: 100%;
  max-width: 340px;
  background: var(--surface);
  border-radius: 22px;
  padding: 20px 16px 18px;
  color: var(--text);
}

.daily-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.daily-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.daily-sub {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  flex-shrink: 0;
}

.daily-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 18px;
}

.daily-card--row2 {
  grid-column: span 1;
}

.daily-card:nth-child(5) {
  grid-column: 2;
}

.daily-card:nth-child(6) {
  grid-column: 3;
}

.daily-card:nth-child(7) {
  grid-column: 4;
}

.daily-card {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px 4px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 88px;
}

.daily-card--today {
  border-color: rgba(255, 184, 61, 0.75);
  background: rgba(255, 184, 61, 0.14);
  box-shadow: 0 0 0 1px rgba(255, 184, 61, 0.2);
}

.daily-card--claimed {
  background: rgba(46, 199, 107, 0.08);
  border-color: rgba(46, 199, 107, 0.35);
}

.daily-card--claimed .daily-card__day {
  color: var(--success);
}

.daily-card--locked {
  opacity: 0.55;
}

.daily-card__day {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  line-height: 1.1;
  text-align: center;
}

.daily-card--today .daily-card__day {
  color: #d18a2c;
  font-weight: 700;
}

.daily-card__icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  -webkit-user-drag: none;
}

.daily-card__amount {
  font-size: 11px;
  font-weight: 700;
  color: var(--text);
}

.daily-card__status {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 16px;
}

.status-icon {
  width: 14px;
  height: 14px;
}

.status-icon--green {
  color: var(--success);
}

.status-icon--gold {
  color: #ffb83d;
}

.status-icon--lock {
  color: #d4a84a;
  width: 12px;
  height: 12px;
}

.daily-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

:deep(.daily-claim.app-btn) {
  background: transparent;
  border: none;
  outline: none;
  box-shadow: none;
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 700;
  padding: 10px 16px;
}

:deep(.daily-claim.app-btn:active:not(:disabled)) {
  transform: none;
  box-shadow: none;
  color: var(--accent);
}

:deep(.daily-claim.app-btn:disabled) {
  color: var(--text-dim);
}

.daily-claim-x2 {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffe45a 0%, #ffb020 48%, #ff8f0a 100%);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  outline: none;
  box-shadow:
    0 4px 0 #c45f00,
    0 10px 24px rgba(255, 120, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease,
    opacity 0.15s ease;
}

.daily-claim-x2:active:not(:disabled) {
  transform: translateY(3px);
  box-shadow:
    0 1px 0 #c45f00,
    0 6px 16px rgba(255, 120, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.daily-claim-x2:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.daily-claim-x2__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(180deg, #c77dff 0%, #6a28d9 100%);
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 3px 0 #4a1899;
  color: #fff;
}

.daily-claim-x2__icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.daily-claim-x2__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.daily-claim-x2__title {
  font-size: 16px;
  font-weight: 900;
  line-height: 1.15;
  color: #fff;
  text-shadow:
    0 2px 0 #b35a00,
    0 0 10px rgba(255, 240, 160, 0.5);
}

.daily-claim-x2__hint {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 2px rgba(140, 60, 0, 0.4);
}

.daily-fade-enter-active,
.daily-fade-leave-active {
  transition: opacity 0.2s ease;
}

.daily-fade-enter-active .daily-sheet,
.daily-fade-leave-active .daily-sheet {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.daily-fade-enter-from,
.daily-fade-leave-to {
  opacity: 0;
}

.daily-fade-enter-from .daily-sheet,
.daily-fade-leave-to .daily-sheet {
  transform: scale(0.94);
  opacity: 0;
}
</style>
