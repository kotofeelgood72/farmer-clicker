import { canShowAds, showInterstitial } from '@/ads/ads'
import { scheduleGameReview } from '@/composables/useGameReview'

/** Вероятность interstitial при отправке ответа в чате/свидании. */
const RANDOM_REPLY_CHANCE = 0.1
/** Минимальный интервал между «случайными» рекламами при ответах. */
const RANDOM_REPLY_MIN_GAP_MS = 120_000

let lastRandomReplyAdAt = 0
const SWIPES_PER_INTERSTITIAL = 3
let swipeCountSinceAd = 0

export interface RunAfterInterstitialOptions {
  /** После действия (и рекламы, если была) — окно оценки, не параллельно с ads. */
  reviewAfter?: boolean
}

/** Реклама перед открытием чата (список, главная, профиль). */
export function openChatWithAd(action: () => void): void {
  runAfterInterstitial(action, 'chat_open')
}

/** Каждые 3 смахивания влево/вправо — interstitial, затем продолжение. */
export function afterSwipeCompleted(action: () => void): void {
  swipeCountSinceAd += 1
  if (swipeCountSinceAd < SWIPES_PER_INTERSTITIAL) {
    action()
    return
  }
  swipeCountSinceAd = 0
  runAfterInterstitial(action, 'swipe_every_3')
}

/** Interstitial только по действию пользователя; при недоступности — сразу action. */
export function runAfterInterstitial(
  action: () => void,
  reason: string,
  opts?: RunAfterInterstitialOptions,
): void {
  const finish = () => {
    action()
    if (opts?.reviewAfter) scheduleGameReview(reason)
  }

  if (!canShowAds()) {
    finish()
    return
  }
  showInterstitial(reason, { onClose: finish })
}

/** Случайная реклама при ответе (не на каждый клик). */
export function maybeInterstitialOnReply(action: () => void): void {
  if (!canShowAds()) {
    action()
    return
  }

  const now = Date.now()
  if (now - lastRandomReplyAdAt < RANDOM_REPLY_MIN_GAP_MS) {
    action()
    return
  }
  if (Math.random() > RANDOM_REPLY_CHANCE) {
    action()
    return
  }

  showInterstitial('random_reply', {
    onClose: () => {
      lastRandomReplyAdAt = Date.now()
      action()
    },
  })
}

export function resetAdPlacementsState(): void {
  lastRandomReplyAdAt = 0
  swipeCountSinceAd = 0
}
