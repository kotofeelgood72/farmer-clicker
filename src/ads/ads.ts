// Ads orchestration: cooldowns, dev stubs, pause / mute lifecycle.
// Game loop pause + audio mute are dispatched via window CustomEvents so
// non-Vue code (this module) doesn't need to import the game/store.

import { getYsdk, gameplayPause, gameplayResume } from '@/yandex/sdk'

let adsDisabled = false

/** Принудительно отключает рекламу (только для отладки). */
export function setAdsDisabled(disabled: boolean): void {
  adsDisabled = disabled
}

export function canShowAds(): boolean {
  return !adsDisabled
}

function shouldShowAds(): boolean {
  return canShowAds()
}

const SESSION_START = Date.now()
const FIRST_AD_GAP = 60_000 // no interstitial in first minute (Yandex requirement)
const INTERSTITIAL_MIN_GAP = 90_000 // our cooldown — 30s stricter than SDK
const INTER_TO_REWARD_GAP = 30_000 // don't pile ads back-to-back
/** Пауза после рекламы перед окном оценки (Яндекс SDK). */
export const REVIEW_AFTER_AD_MS = 5_000

let lastInterstitialAt = 0
let lastAnyAdAt = 0
let isAdPlaying = false
let startupAdShown = false

function emitPause() {
  isAdPlaying = true
  gameplayPause()
  window.dispatchEvent(new CustomEvent('ads:pause'))
}
function emitResume() {
  isAdPlaying = false
  gameplayResume()
  window.dispatchEvent(new CustomEvent('ads:resume'))
}

export function adsPlaying(): boolean {
  return isAdPlaying
}

/** Можно показывать окно оценки: реклама не идёт и прошёл буфер после последней. */
export function isSafeForReview(): boolean {
  if (isAdPlaying) return false
  return Date.now() - lastAnyAdAt >= REVIEW_AFTER_AD_MS
}

export function msUntilSafeForReview(): number {
  if (isAdPlaying) return REVIEW_AFTER_AD_MS
  const left = REVIEW_AFTER_AD_MS - (Date.now() - lastAnyAdAt)
  return Math.max(0, left)
}

export function canShowInterstitial(): boolean {
  if (!shouldShowAds()) return false
  if (isAdPlaying) return false
  const now = Date.now()
  if (now - SESSION_START < FIRST_AD_GAP) return false
  if (now - lastInterstitialAt < INTERSTITIAL_MIN_GAP) return false
  if (now - lastAnyAdAt < INTER_TO_REWARD_GAP) return false
  return true
}

function playFullscreenAdv(reason: string | undefined, finish: () => void): boolean {
  const ysdk = getYsdk()
  if (!ysdk) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] interstitial (dev stub)', reason)
    }
    finish()
    return true
  }

  emitPause()
  try {
    ysdk.adv.showFullscreenAdv({
      callbacks: {
        onClose: () => {
          emitResume()
          finish()
        },
        onError: () => {
          emitResume()
          finish()
        },
      },
    })
  } catch (err) {
    console.warn('[ads] interstitial failed', err)
    emitResume()
    finish()
  }
  return true
}

/**
 * Полноэкранная реклама при первом входе в игру (один раз за сессию).
 * Не учитывает FIRST_AD_GAP — стартовый показ разрешён платформой.
 */
export function showStartupInterstitial(opts?: { onClose?: () => void }): boolean {
  const finish = () => opts?.onClose?.()

  if (startupAdShown) {
    finish()
    return false
  }
  startupAdShown = true

  if (!shouldShowAds() || isAdPlaying) {
    finish()
    return false
  }

  lastInterstitialAt = Date.now()
  lastAnyAdAt = lastInterstitialAt
  return playFullscreenAdv('startup', finish)
}

/** Сброс флага стартовой рекламы (отладка / сброс прогресса). */
export function resetStartupAdState(): void {
  startupAdShown = false
}

/**
 * Полноэкранная реклама по клику. Если показ невозможен — сразу вызывает onClose.
 */
export function showInterstitial(
  _reason?: string,
  opts?: { onClose?: () => void },
): boolean {
  const finish = () => opts?.onClose?.()

  if (!canShowInterstitial()) {
    finish()
    return false
  }

  lastInterstitialAt = Date.now()
  lastAnyAdAt = lastInterstitialAt
  return playFullscreenAdv(_reason, finish)
}

/**
 * Show a rewarded video. Reward is delivered ONLY if onRewarded fires.
 * In dev (no SDK), reward is granted immediately for testing.
 */
/** @returns true если показ рекламы запущен (или dev-stub). */
export function showRewarded(
  onReward: () => void,
  opts?: { onFinish?: () => void },
): boolean {
  if (!shouldShowAds()) return false
  if (isAdPlaying) return false
  lastAnyAdAt = Date.now()

  const ysdk = getYsdk()
  if (!ysdk) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] rewarded (dev stub) — granting immediately')
      onReward()
      opts?.onFinish?.()
      return true
    }
    return false
  }

  let granted = false
  emitPause()
  try {
    ysdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => {
          granted = true
        },
        onClose: () => {
          emitResume()
          if (granted) onReward()
          opts?.onFinish?.()
        },
        onError: () => {
          emitResume()
          opts?.onFinish?.()
        },
      },
    })
  } catch (err) {
    console.warn('[ads] rewarded failed', err)
    emitResume()
    opts?.onFinish?.()
  }
  return true
}
