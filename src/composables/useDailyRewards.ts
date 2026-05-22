import { computed, ref } from 'vue'
import { showRewarded } from '@/ads/ads'
import { recordLoginStreak } from '@/composables/useAchievements'
import { fireConfetti } from '@/composables/useConfetti'
import { useDiamonds } from '@/composables/useDiamonds'
import { useEnergy } from '@/composables/useEnergy'
import { usePremium } from '@/composables/usePremium'
import { scheduleGameReview } from '@/composables/useGameReview'
import { DAILY_REWARD_AD_MULTIPLIER } from '@/constants/game'

const STORAGE_KEY = 'swipe-daily-rewards-v1'

export type DailyRewardType = 'diamonds' | 'energy'

export interface DailyRewardDef {
  day: number
  type: DailyRewardType
  amount: number
}

export const DAILY_REWARD_DEFS: DailyRewardDef[] = [
  { day: 1, type: 'diamonds', amount: 20 },
  { day: 2, type: 'energy', amount: 5 },
  { day: 3, type: 'diamonds', amount: 50 },
  { day: 4, type: 'energy', amount: 5 },
  { day: 5, type: 'diamonds', amount: 200 },
  { day: 6, type: 'energy', amount: 5 },
  { day: 7, type: 'diamonds', amount: 300 },
]

export type DailyRewardCardStatus = 'claimed' | 'today' | 'locked'

export interface DailyRewardCard {
  day: number
  type: DailyRewardType
  amount: number
  status: DailyRewardCardStatus
}

interface DailyRewardsState {
  /** Текущий день цикла (1–7). */
  streakDay: number
  /** Последний заход в игру (не экран логина). */
  lastVisitDate: string | null
  /** Последнее получение награды. */
  lastClaimDate: string | null
}

function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00`)
  const b = new Date(`${to}T12:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function loadState(): DailyRewardsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { streakDay: 1, lastVisitDate: null, lastClaimDate: null }
    }
    const parsed = JSON.parse(raw) as Partial<DailyRewardsState>
    const streakDay = Number(parsed.streakDay)
    const lastVisitDate =
      typeof parsed.lastVisitDate === 'string' ? parsed.lastVisitDate : null
    const lastClaimDate =
      typeof parsed.lastClaimDate === 'string' ? parsed.lastClaimDate : null
    return {
      streakDay:
        Number.isFinite(streakDay) && streakDay >= 1 && streakDay <= 7
          ? Math.floor(streakDay)
          : 1,
      lastVisitDate,
      lastClaimDate,
    }
  } catch {
    return { streakDay: 1, lastVisitDate: null, lastClaimDate: null }
  }
}

function saveState(s: DailyRewardsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

const state = ref<DailyRewardsState>(loadState())
const isModalOpen = ref(false)
const claimingAd = ref(false)
const { isPremium } = usePremium()

const todayReward = computed(
  () => DAILY_REWARD_DEFS[state.value.streakDay - 1] ?? DAILY_REWARD_DEFS[0],
)

const claimedToday = computed(() => state.value.lastClaimDate === todayKey())

const canClaimToday = computed(() => !claimedToday.value)

const todayRewardDoubled = computed(() => {
  const reward = todayReward.value
  if (!reward) return null
  return { ...reward, amount: reward.amount * DAILY_REWARD_AD_MULTIPLIER }
})

const canClaimDoubledViaAd = computed(
  () => canClaimToday.value && !isPremium.value,
)

/** Сколько дней цикла уже получено (включая сегодняшний, если забрали). */
const completedDays = computed(() => {
  if (claimedToday.value) return state.value.streakDay
  return Math.max(0, state.value.streakDay - 1)
})

const cards = computed<DailyRewardCard[]>(() => {
  const streak = state.value.streakDay
  const done = completedDays.value

  return DAILY_REWARD_DEFS.map((def) => {
    let status: DailyRewardCardStatus = 'locked'
    if (def.day <= done) {
      status = 'claimed'
    } else if (def.day === streak && !claimedToday.value) {
      status = 'today'
    }
    return { ...def, status }
  })
})

/** Синхронизация при заходе: пропуск календарного дня сбрасывает серию на 1. */
function syncOnVisit() {
  const today = todayKey()

  if (state.value.lastClaimDate === today) {
    if (state.value.lastVisitDate !== today) {
      state.value = { ...state.value, lastVisitDate: today }
      saveState(state.value)
    }
    recordLoginStreak(state.value.streakDay)
    isModalOpen.value = false
    return
  }

  if (state.value.lastVisitDate === today) {
    recordLoginStreak(state.value.streakDay)
    isModalOpen.value = true
    return
  }

  let streakDay = state.value.streakDay

  if (!state.value.lastVisitDate) {
    streakDay = 1
  } else {
    const gap = daysBetween(state.value.lastVisitDate, today)
    if (gap > 1) {
      streakDay = 1
    } else if (gap === 1) {
      streakDay = streakDay >= 7 ? 1 : streakDay + 1
    }
  }

  state.value = {
    streakDay,
    lastVisitDate: today,
    lastClaimDate: state.value.lastClaimDate,
  }
  saveState(state.value)
  recordLoginStreak(streakDay)
  isModalOpen.value = true
}

function openModal() {
  if (canClaimToday.value) {
    isModalOpen.value = true
  }
}

/** Синхронизация + показ модалки (для главного экрана). */
function syncAndShowModal() {
  syncOnVisit()
  if (canClaimToday.value) {
    isModalOpen.value = true
  }
}

function closeModal() {
  isModalOpen.value = false
}

function grantReward(reward: DailyRewardDef, multiplier: number) {
  const amount = reward.amount * multiplier
  const { add: addDiamonds } = useDiamonds()
  const { add: addEnergy } = useEnergy()
  if (reward.type === 'diamonds') addDiamonds(amount)
  else addEnergy(amount)
}

function claimToday(multiplier = 1) {
  if (!canClaimToday.value) return false

  const reward = todayReward.value
  if (!reward) return false

  const safeMultiplier = Math.max(1, Math.floor(multiplier))
  grantReward(reward, safeMultiplier)

  state.value = {
    ...state.value,
    lastClaimDate: todayKey(),
  }
  saveState(state.value)
  claimingAd.value = false
  isModalOpen.value = false
  fireConfetti()
  scheduleGameReview('daily_reward')
  return true
}

/** Удвоенная награда после просмотра rewarded-рекламы. */
function claimTodayDoubledViaAd(): boolean {
  if (!canClaimDoubledViaAd.value || claimingAd.value) return false

  claimingAd.value = true
  const started = showRewarded(
    () => claimToday(DAILY_REWARD_AD_MULTIPLIER),
    { onFinish: () => { claimingAd.value = false } },
  )
  if (!started) claimingAd.value = false
  return started
}

export function resetDailyRewardsStore() {
  state.value = { streakDay: 1, lastVisitDate: null, lastClaimDate: null }
  isModalOpen.value = false
  claimingAd.value = false
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function useDailyRewards() {
  return {
    streakDay: computed(() => state.value.streakDay),
    completedDays,
    claimedToday,
    cards,
    todayReward,
    todayRewardDoubled,
    canClaimToday,
    canClaimDoubledViaAd,
    claimingAd: computed(() => claimingAd.value),
    isModalOpen,
    syncOnVisit,
    syncAndShowModal,
    openModal,
    closeModal,
    claimToday,
    claimTodayDoubledViaAd,
  }
}
