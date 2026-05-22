import { adsPlaying, isSafeForReview, msUntilSafeForReview } from '@/ads/ads'
import { tryRequestReview } from '@/yandex/sdk'

const SESSION_START = Date.now()
/** Не предлагать оценку в первые минуты сессии. */
const REVIEW_MIN_SESSION_MS = 90_000
/** Минимальный интервал между попытками schedule. */
const REVIEW_ATTEMPT_GAP_MS = 180_000

let lastScheduleAt = 0
let waitTimer: ReturnType<typeof setTimeout> | null = null

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

/**
 * Запланировать окно оценки Яндекс Игр после «хорошего» момента.
 * Ждёт окончания рекламы и буфер REVIEW_AFTER_AD_MS, не вызывается параллельно с ads.
 */
export function scheduleGameReview(reason: string): void {
  if (Date.now() - SESSION_START < REVIEW_MIN_SESSION_MS) return
  if (Date.now() - lastScheduleAt < REVIEW_ATTEMPT_GAP_MS) return

  lastScheduleAt = Date.now()
  clearWaitTimer()

  waitTimer = setTimeout(() => {
    waitTimer = null
    void (async () => {
      const safe = await waitUntilSafeForReview()
      if (!safe) {
        console.info('[review] skipped (ad active):', reason)
        return
      }
      const shown = await tryRequestReview()
      if (shown) console.info('[review] prompted:', reason)
    })()
  }, 600)
}

/** Кнопка «Оценить игру» — ждёт безопасного момента без рекламы. */
export async function requestGameReviewNow(): Promise<boolean> {
  clearWaitTimer()
  const safe = await waitUntilSafeForReview()
  if (!safe) return false
  return tryRequestReview()
}

export function resetGameReviewScheduler(): void {
  clearWaitTimer()
  lastScheduleAt = 0
}
