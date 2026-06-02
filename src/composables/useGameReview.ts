import { computed, ref } from 'vue'
import { adsPlaying, isSafeForReview, msUntilSafeForReview } from '@/ads/ads'
import { tryRequestReview } from '@/yandex/sdk'

const STORAGE_KEY = 'swipe-game-reviewed-v1'
const SESSION_START = Date.now()
/** Не предлагать оценку в первые минуты сессии (кроме отдельных триггеров). */
const REVIEW_MIN_SESSION_MS = 90_000
/** Минимальный интервал между попытками. */
const REVIEW_ATTEMPT_GAP_MS = 180_000

const REASONS_BYPASS_SESSION_MIN = new Set(['daily_reward_day_2'])

let lastScheduleAt = 0
let waitTimer: ReturnType<typeof setTimeout> | null = null
let promptInFlight = false

const hasRated = ref(loadHasRated())

function loadHasRated(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === '1' || raw === 'true'
  } catch {
    return false
  }
}

function persistHasRated() {
  hasRated.value = true
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

function clearWaitTimer() {
  if (waitTimer) {
    clearTimeout(waitTimer)
    waitTimer = null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitUntilSafeForReview(): Promise<boolean> {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    if (isSafeForReview()) return true
    const delay = adsPlaying() ? 400 : Math.min(msUntilSafeForReview(), 800)
    await sleep(delay)
  }
  return isSafeForReview()
}

async function promptGameReview(reason: string): Promise<boolean> {
  if (hasRated.value || promptInFlight) return false

  promptInFlight = true
  try {
    const safe = await waitUntilSafeForReview()
    if (!safe) {
      console.info('[review] skipped (ad active):', reason)
      return false
    }

    const { shown, rated } = await tryRequestReview()
    if (rated) {
      persistHasRated()
      console.info('[review] rated:', reason)
      return true
    }
    if (shown) {
      console.info('[review] dismissed:', reason)
    }
    return shown
  } finally {
    promptInFlight = false
  }
}

/**
 * Запланировать окно оценки после «хорошего» момента.
 * Не вызывается параллельно с рекламой; повторяется на триггерах, пока игрок не оценит.
 */
export function scheduleGameReview(reason: string): void {
  if (hasRated.value) return

  const bypassSessionMin = REASONS_BYPASS_SESSION_MIN.has(reason)
  if (!bypassSessionMin && Date.now() - SESSION_START < REVIEW_MIN_SESSION_MS) return
  if (Date.now() - lastScheduleAt < REVIEW_ATTEMPT_GAP_MS) return

  lastScheduleAt = Date.now()
  clearWaitTimer()

  waitTimer = setTimeout(() => {
    waitTimer = null
    void promptGameReview(reason)
  }, 600)
}

export function resetGameReviewScheduler(): void {
  clearWaitTimer()
  lastScheduleAt = 0
  promptInFlight = false
}

export function resetGameReviewStore(): void {
  resetGameReviewScheduler()
  hasRated.value = false
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function useGameReview() {
  const showRateButton = computed(() => false)

  return {
    hasRatedGame: computed(() => hasRated.value),
    showRateButton,
    scheduleGameReview,
  }
}
