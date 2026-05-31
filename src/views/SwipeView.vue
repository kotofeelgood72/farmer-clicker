<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import gsap from 'gsap'

import PageHeader from '@/components/PageHeader.vue'
import MatchOverlay from '@/components/MatchOverlay.vue'
import IconCloseX from '@/components/icons/IconCloseX.vue'
import IconVerified from '~icons/solar/verified-check-bold'
import IconFire from '~icons/solar/fire-bold'
import IconAdPlay from '~icons/solar/play-circle-bold'
import heartImg from '@/assets/ui/hearth.png'
import energyImg from '@/assets/ui/energy.png'
import { GIRLS, type GirlProfile } from '@/data/girls'
import { useChatHistory } from '@/composables/useChatHistory'
import { REWARDED_ENERGY_AMOUNT } from '@/constants/game'
import { SWIPE_ENERGY_COST, useEnergy } from '@/composables/useEnergy'
import { usePremium } from '@/composables/usePremium'
import { useRewardedEnergy } from '@/composables/useRewardedEnergy'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { runAfterInterstitial } from '@/composables/useAdPlacements'
import { useAchievements } from '@/composables/useAchievements'
import { usePlayerStats } from '@/composables/usePlayerStats'
import EnterItem from '@/components/EnterItem.vue'

const { pushFrom, back, router } = useAppNavigation()
const { touchChat, hasActiveChat } = useChatHistory()
const { energy, canSpend, spend } = useEnergy()
const { isPremium } = usePremium()
const { watchAdForEnergy, watching: watchingAd } = useRewardedEnergy()
const { recordProfileSeen } = usePlayerStats()
const { trackSwipeEnergy, trackMatch } = useAchievements()

const swipeDeck = computed(() => GIRLS.filter((g) => !hasActiveChat(g.id)))
const hasSwipeCards = computed(() => swipeDeck.value.length > 0)

const index = ref(0)
const total = ref(20) // total session swipes

const currentCard = ref<HTMLDivElement | null>(null)
const nextCard = ref<HTMLDivElement | null>(null)
const dragX = ref(0)
const dragging = ref(false)
const animating = ref(false)

const current = computed(() => {
  const deck = swipeDeck.value
  if (!deck.length) return undefined
  return deck[index.value % deck.length]
})

const next = computed(() => {
  const deck = swipeDeck.value
  if (deck.length < 2) return undefined
  return deck[(index.value + 1) % deck.length]
})

const matchVisible = ref(false)
const matchedCharacter = ref<GirlProfile | null>(null)

function cardImageStyle(girl: GirlProfile) {
  if (girl.image) {
    return {
      backgroundImage: `url(${girl.image})`,
      backgroundColor: girl.color,
    }
  }
  return { background: girl.color }
}

// likeOpacity / nopeOpacity derived from dragX
const SWIPE_FADE_DISTANCE = 120

const likeOpacity = computed(() =>
  Math.max(0, Math.min(1, dragX.value / SWIPE_FADE_DISTANCE)),
)
const nopeOpacity = computed(() =>
  Math.max(0, Math.min(1, -dragX.value / SWIPE_FADE_DISTANCE)),
)
const swipeActionsLocked = computed(
  () => animating.value || !canSpend(SWIPE_ENERGY_COST),
)
const showEnergyCta = computed(
  () =>
    hasSwipeCards.value &&
    !isPremium.value &&
    energy.value <= 0 &&
    !animating.value &&
    !matchVisible.value,
)
const showEnergyBoost = computed(() => isPremium.value || energy.value > 0)
const energyBadgeLabel = computed(() => (isPremium.value ? '∞' : String(energy.value)))

let startX = 0
let startY = 0
let activePointerId: number | null = null

function onPointerDown(e: PointerEvent) {
  if (animating.value || !currentCard.value) return
  if (!canSpend(SWIPE_ENERGY_COST)) return
  activePointerId = e.pointerId
  startX = e.clientX
  startY = e.clientY
  dragging.value = true
  currentCard.value.setPointerCapture(e.pointerId)
  gsap.killTweensOf(currentCard.value)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== activePointerId || !currentCard.value) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  dragX.value = dx
  const rot = dx * 0.06
  gsap.set(currentCard.value, { x: dx, y: dy * 0.2, rotation: rot })
}

function onPointerUp(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== activePointerId) return
  dragging.value = false
  activePointerId = null

  const threshold = 110
  if (dragX.value > threshold) flyOff('right')
  else if (dragX.value < -threshold) flyOff('left')
  else springBack()
}

function springBack() {
  if (!currentCard.value) return
  animating.value = true
  gsap.to(currentCard.value, {
    x: 0,
    y: 0,
    rotation: 0,
    duration: 0.35,
    ease: 'back.out(1.6)',
    onUpdate: () => {
      dragX.value = 0
    },
    onComplete: () => {
      animating.value = false
      dragX.value = 0
    },
  })
}

function flyOff(direction: 'left' | 'right') {
  if (!currentCard.value) return
  if (!spend(SWIPE_ENERGY_COST)) {
    springBack()
    return
  }
  trackSwipeEnergy(SWIPE_ENERGY_COST)
  animating.value = true
  const targetX = direction === 'right' ? 600 : -600
  const rot = direction === 'right' ? 25 : -25

  // animate current card off-screen
  gsap.to(currentCard.value, {
    x: targetX,
    rotation: rot,
    duration: 0.38,
    ease: 'power2.in',
  })

  // simultaneously promote the next card to the front
  if (nextCard.value) {
    gsap.fromTo(
      nextCard.value,
      { scale: 0.96, y: 8, opacity: 0.7 },
      {
        scale: 1,
        y: 0,
        opacity: 1,
        duration: 0.38,
        ease: 'power2.out',
        onComplete: () => advance(direction),
      },
    )
  } else {
    gsap.delayedCall(0.38, () => advance(direction))
  }
}

function advance(direction: 'left' | 'right') {
  const liked = current.value
  recordProfileSeen()
  index.value++
  dragX.value = 0
  animating.value = false
  // eslint-disable-next-line no-console
  console.info('[swipe]', direction === 'right' ? 'like' : 'skip', liked?.name)
  if (direction === 'right' && liked) {
    trackMatch()
    touchChat(liked.id, { preview: 'Это совпадение!' })
    matchedCharacter.value = liked
    matchVisible.value = true
  }
}

function onLike() {
  if (animating.value || !canSpend(SWIPE_ENERGY_COST)) return
  dragX.value = SWIPE_FADE_DISTANCE
  flyOff('right')
}

function onSkip() {
  if (animating.value || !canSpend(SWIPE_ENERGY_COST)) return
  dragX.value = -SWIPE_FADE_DISTANCE
  flyOff('left')
}

function onEnergyBoost() {
  if (isPremium.value) {
    void pushFrom({ path: '/shop', query: { tab: 'premium' } })
    return
  }
  if (energy.value > 0) {
    void pushFrom({ path: '/shop', query: { tab: 'energy' } })
    return
  }
  watchAdForEnergy()
}

function onGetSwipeEnergy() {
  if (isPremium.value) return
  if (energy.value > 0) return
  watchAdForEnergy()
}

function onBack() {
  back('/main')
}

function onMatchMessage() {
  const id = matchedCharacter.value?.id
  runAfterInterstitial(() => {
    matchVisible.value = false
    if (id != null) void pushFrom(`/chat/${id}`)
  }, 'match_message')
}

function onMatchContinue() {
  matchVisible.value = false
}

onUnmounted(() => {
  if (currentCard.value) gsap.killTweensOf(currentCard.value)
})
</script>

<template>
  <div class="swipe" :class="{ 'swipe--match': matchVisible }">
    <EnterItem :order="0" solo>
      <PageHeader title="Знакомства" @back="onBack" />
    </EnterItem>

    <EnterItem v-if="!hasSwipeCards" :order="1" solo class="swipe-empty page-enter">
      <p class="swipe-empty__title">Новых анкет пока нет</p>
      <p class="swipe-empty__hint">Продолжите общение в чатах или загляните позже</p>
      <button type="button" class="swipe-empty__btn" @click="onBack">На главную</button>
    </EnterItem>

    <!-- card stack -->
    <div v-else class="stack" :class="{ 'stack--locked': matchVisible }">
      <!-- next card (behind) -->
      <div v-if="next" ref="nextCard" class="card card--next" :key="`next-${next.id}-${index}`">
        <div class="card-image" :style="cardImageStyle(next)">
          <div class="rating-pill">
            <IconFire v-for="n in next.rating" :key="n" class="rating-fire" />
          </div>
          <span v-if="!next.image" class="card-letter">{{ next.name.charAt(0) }}</span>
          <div class="info-overlay">
            <div class="info-head">
              <div class="card-name">
                {{ next.name }}, {{ next.age }}
                <IconVerified class="verified" />
              </div>
            </div>
            <p class="card-bio">{{ next.bio }}</p>
            <div class="card-tags">
              <span v-for="t in next.tags" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- current card (front, draggable) -->
      <div
        v-if="current"
        ref="currentCard"
        class="card card--current"
        :class="{ 'card--no-energy': showEnergyCta }"
        :key="`current-${current.id}-${index}`"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="card-image" :style="cardImageStyle(current)">
          <div class="rating-pill">
            <IconFire v-for="n in current.rating" :key="n" class="rating-fire" />
          </div>
          <span v-if="!current.image" class="card-letter">{{ current.name.charAt(0) }}</span>
          <button
            class="skip-pill"
            type="button"
            :disabled="swipeActionsLocked"
            :style="{
              opacity: 1 - nopeOpacity,
              pointerEvents: nopeOpacity > 0 || swipeActionsLocked ? 'none' : 'auto',
            }"
            @pointerdown.stop
            @click.stop="onSkip"
          >
            Пропустить
          </button>
          <div class="info-overlay">
            <div class="info-head">
              <div class="card-name">
                {{ current.name }}, {{ current.age }}
                <IconVerified class="verified" />
              </div>
            </div>
            <p class="card-bio">{{ current.bio }}</p>
            <div class="card-tags">
              <span v-for="t in current.tags" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>
        </div>

        <div
          class="swipe-tint swipe-tint--like"
          :style="{ opacity: likeOpacity }"
          aria-hidden="true"
        />
        <div
          class="swipe-tint swipe-tint--nope"
          :style="{ opacity: nopeOpacity }"
          aria-hidden="true"
        />

        <div v-if="showEnergyCta" class="energy-cta" aria-live="polite">
          <div class="energy-cta__backdrop" aria-hidden="true" />
          <button
            type="button"
            class="energy-cta__btn"
            :disabled="watchingAd"
            @pointerdown.stop
            @click.stop="onGetSwipeEnergy"
          >
            <span class="energy-cta__label">Получить энергию для знакомства</span>
            <span class="energy-cta__hint">Смотреть рекламу · +{{ REWARDED_ENERGY_AMOUNT }} энергия</span>
          </button>
        </div>
      </div>
    </div>

    <!-- action buttons -->
    <EnterItem v-if="hasSwipeCards" :order="1" solo class="actions page-enter" :class="{ 'actions--locked': matchVisible }">
      <button
        class="action action--skip"
        type="button"
        :disabled="swipeActionsLocked"
        @click="onSkip"
      >
        <IconCloseX class="action-icon action-icon--close" />
      </button>
      <button
        class="action action--like"
        type="button"
        :disabled="swipeActionsLocked"
        @click="onLike"
      >
        <img :src="heartImg" alt="лайк" class="action-img" />
      </button>
      <button
        class="action action--boost"
        type="button"
        :class="{
          'action--boost-ad': !showEnergyBoost,
          'action--boost-loading': watchingAd,
        }"
        :disabled="watchingAd"
        :aria-label="
          showEnergyBoost ? `Энергия: ${energyBadgeLabel}` : 'Смотреть рекламу за энергию'
        "
        @click="onEnergyBoost"
      >
        <img
          v-if="showEnergyBoost"
          :src="energyImg"
          alt=""
          class="action-img action-img--energy"
        />
        <IconAdPlay v-else class="action-icon action-icon--ad" />
        <span
          v-if="showEnergyBoost"
          class="action-badge"
          :class="{ 'action-badge--empty': !isPremium && energy <= 0 }"
        >
          {{ energyBadgeLabel }}
        </span>
      </button>
    </EnterItem>

    <MatchOverlay
      :show="matchVisible"
      :their-name="matchedCharacter?.name || ''"
      :their-color="matchedCharacter?.color"
      :their-letter="matchedCharacter?.name.charAt(0)"
      :their-image="matchedCharacter?.image"
      @message="onMatchMessage"
      @close="onMatchContinue"
    />
  </div>
</template>

<style scoped>
.swipe {
  width: 100%;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.swipe-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 32px;
  text-align: center;
}

.swipe-empty__title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
}

.swipe-empty__hint {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--text-muted);
}

.swipe-empty__btn {
  padding: 12px 24px;
  border-radius: 999px;
  border: none;
  background: var(--gradient-brand-violet);
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.swipe > .stack,
.swipe > .actions {
  margin-left: 16px;
  margin-right: 16px;
}

.swipe > .stack {
  margin-top: 16px;
  margin-bottom: 12px;
}
.swipe > .actions {
  margin-bottom: 16px;
}

/* card stack */
.stack {
  flex: 1;
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: center;
  margin-bottom: 12px;
}

.swipe--match {
  pointer-events: none;
}

.stack--locked,
.actions--locked {
  pointer-events: none;
}

.card {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  overflow: hidden;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  touch-action: none;
  user-select: none;
}

.card--current {
  z-index: 2;
  cursor: grab;
}

.card--current:active {
  cursor: grabbing;
}

.card--no-energy {
  cursor: default;
}

.card--no-energy:active {
  cursor: default;
}

.card--next {
  z-index: 1;
  transform: scale(0.96) translateY(8px);
  opacity: 0.7;
  filter: blur(0.3px);
}

.card-image {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center top;
  min-height: 100%;
}

.energy-cta {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px 88px;
  pointer-events: none;
}

.energy-cta__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(12, 8, 24, 0.42);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.energy-cta__btn {
  position: relative;
  z-index: 1;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: min(100%, 300px);
  padding: 16px 18px;
  border: none;
  border-radius: 18px;
  font-family: inherit;
  color: #fff;
  background: linear-gradient(135deg, #b14bff 0%, #ff4d8e 100%);
  box-shadow:
    0 8px 28px rgba(177, 75, 255, 0.45),
    0 0 0 0 rgba(255, 77, 142, 0.5);
  cursor: pointer;
  animation: energy-cta-pulse 1.6s ease-in-out infinite;
}

.energy-cta__btn:disabled {
  opacity: 0.75;
  cursor: wait;
  animation: none;
}

.energy-cta__btn:active:not(:disabled) {
  transform: scale(0.97);
  animation: none;
}

.energy-cta__label {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
  text-align: center;
}

.energy-cta__hint {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.92;
  text-align: center;
}

@keyframes energy-cta-pulse {
  0%,
  100% {
    box-shadow:
      0 8px 28px rgba(177, 75, 255, 0.45),
      0 0 0 0 rgba(255, 77, 142, 0.45);
  }
  50% {
    box-shadow:
      0 10px 32px rgba(177, 75, 255, 0.55),
      0 0 0 12px rgba(255, 77, 142, 0);
  }
}

.rating-pill {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  display: flex;
  gap: 2px;
  padding: 4px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.rating-fire {
  width: 14px;
  height: 14px;
  color: #ff6b2c;
  flex-shrink: 0;
}

.info-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 48px 16px 16px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 0, 0, 0.55) 35%,
    rgba(0, 0, 0, 0.88) 100%
  );
  pointer-events: none;
}

.card-letter {
  font-size: 96px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.25);
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.skip-pill {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  outline: none;
  color: #fff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  z-index: 3;
}

.info-head {
  margin-bottom: 6px;
}

.card-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.verified {
  width: 16px;
  height: 16px;
  color: #5fb8ff;
}

.card-bio {
  font-size: 13px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 10px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(40, 40, 48, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

/* swipe color tint — opacity driven by dragX */
.swipe-tint {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  border-radius: inherit;
  will-change: opacity;
}

.swipe-tint--like {
  background: rgba(46, 199, 107, 0.72);
}

.swipe-tint--nope {
  background: rgba(255, 61, 90, 0.72);
}

/* action buttons */
.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-bottom: 12px;
}

.action {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--surface);
  color: var(--text);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  box-shadow: 0 6px 18px rgba(180, 80, 160, 0.18);
}

.action:active:not(:disabled) {
  transform: scale(0.94);
}
.action:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.action-icon {
  width: 26px;
  height: 26px;
}

.action-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  -webkit-user-drag: none;
}

.action--skip {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}

.action-icon--close {
  width: 22px;
  height: 22px;
}

.action--like {
  background: var(--surface);
  box-shadow: 0 6px 18px rgba(255, 77, 142, 0.3);
}

.action--boost {
  background: rgba(95, 184, 255, 0.22);
  border: 1px solid rgba(95, 184, 255, 0.45);
  box-shadow: 0 6px 18px rgba(95, 184, 255, 0.2);
  position: relative;
}

.action--boost-ad {
  background: rgba(255, 184, 61, 0.28);
  border: 1px solid rgba(255, 184, 61, 0.55);
  box-shadow: 0 6px 18px rgba(255, 184, 61, 0.25);
}

.action--boost-loading {
  opacity: 0.75;
}

.action-icon--ad {
  width: 34px;
  height: 34px;
  color: #ff9f1a;
}

.action-img--energy {
  width: 34px;
  height: 34px;
}

.action-badge {
  position: absolute;
  top: -3px;
  right: -4px;
  width: 18px;
  height: 18px;
  min-width: 18px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1422;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
  border: 2px solid var(--bg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

.action-badge--empty {
  background: var(--danger);
}
</style>
