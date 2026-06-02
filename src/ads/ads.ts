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

/** Премиум не отключает interstitial/rewarded — только setAdsDisabled (отладка). */
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

function canShowStartupInterstitial(): boolean {
  if (!shouldShowAds()) return false
  if (isAdPlaying) return false
  const now = Date.now()
  if (lastInterstitialAt > 0 && now - lastInterstitialAt < INTERSTITIAL_MIN_GAP) return false
  if (lastAnyAdAt > 0 && now - lastAnyAdAt < INTER_TO_REWARD_GAP) return false
  return true
}

function invokeFullscreenAdv(reason: string | undefined, finish: () => void): boolean {
  const ysdk = getYsdk()
  if (!ysdk?.adv) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] interstitial (dev stub)', reason)
      lastInterstitialAt = Date.now()
      lastAnyAdAt = lastInterstitialAt
      finish()
      return true
    }
    return false
  }

  lastInterstitialAt = Date.now()
  lastAnyAdAt = lastInterstitialAt

  emitPause()
  try {
    ysdk.adv.showFullscreenAdv({
      callbacks: {
        onOpen: () => {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.info('[ads] interstitial opened', reason)
          }
        },
        onClose: () => {
          emitResume()
          finish()
        },
        onError: (err) => {
          console.warn('[ads] interstitial error', reason, err)
          emitResume()
          finish()
        },
      },
    })
  } catch (err) {
    console.warn('[ads] interstitial failed', reason, err)
    emitResume()
    finish()
  }
  return true
}

/**
 * Полноэкранная реклама при запуске (один раз за сессию, без FIRST_AD_GAP).
 * @returns false если SDK ещё не готов — можно повторить через scheduleStartupInterstitial.
 */
export function showStartupInterstitial(opts?: { onClose?: () => void }): boolean {
  if (startupAdShown) return false
  if (!canShowStartupInterstitial()) return false

  const onDone = () => opts?.onClose?.()
  if (!invokeFullscreenAdv('startup', onDone)) return false

  startupAdShown = true
  return true
}

const STARTUP_AD_RETRY_MS = 250
const STARTUP_AD_MAX_RETRIES = 24

let startupScheduleActive = false
let pendingStartupClose: (() => void) | null = null

/** Повторяет показ стартовой рекламы, пока не готов ysdk.adv (Яндекс Игры). */
export function scheduleStartupInterstitial(opts?: { onClose?: () => void }): void {
  if (opts?.onClose) {
    if (startupAdShown) {
      opts.onClose()
      return
    }
    pendingStartupClose = opts.onClose
  }

  const done = () => {
    startupScheduleActive = false
    const cb = pendingStartupClose
    pendingStartupClose = null
    cb?.()
  }

  if (startupAdShown) {
    done()
    return
  }
  if (startupScheduleActive) return

  startupScheduleActive = true
  let tries = 0

  const attempt = () => {
    if (startupAdShown) {
      done()
      return
    }
    if (showStartupInterstitial({ onClose: done })) return

    tries += 1
    if (tries < STARTUP_AD_MAX_RETRIES) {
      window.setTimeout(attempt, STARTUP_AD_RETRY_MS)
      return
    }
    console.warn('[ads] startup interstitial: SDK not ready after retries')
    done()
  }

  attempt()
}

/** Полноэкранная реклама по клику. Если показ невозможен — сразу вызывает onClose. */
export function showInterstitial(
  _reason?: string,
  opts?: { onClose?: () => void },
): boolean {
  const finish = () => opts?.onClose?.()

  if (!canShowInterstitial()) {
    finish()
    return false
  }

  if (!invokeFullscreenAdv(_reason, finish)) {
    finish()
    return false
  }
  return true
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
