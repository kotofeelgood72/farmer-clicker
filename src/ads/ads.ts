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
/** Первая минута без interstitial, если стартовая реклама не была показана. */
const FIRST_AD_GAP = 60_000
/** Минимум между fullscreen (Яндекс: обычно ≥60 с). */
const INTERSTITIAL_MIN_GAP = 60_000
/** Пауза после rewarded перед следующим fullscreen. */
const INTER_TO_REWARD_GAP = 15_000
/** Пауза после рекламы перед окном оценки (Яндекс SDK). */
export const REVIEW_AFTER_AD_MS = 5_000

let lastInterstitialAt = 0
let lastAnyAdAt = 0
let isAdPlaying = false
let adPauseDepth = 0
let startupAdShown = false
let adStuckTimer: ReturnType<typeof setTimeout> | null = null

/** Если SDK не вызвал onClose/onError — снимаем залипшую паузу. */
const AD_STUCK_TIMEOUT_MS = 90_000

function clearAdStuckWatchdog(): void {
  if (adStuckTimer) {
    clearTimeout(adStuckTimer)
    adStuckTimer = null
  }
}

function armAdStuckWatchdog(reason: string | undefined): void {
  clearAdStuckWatchdog()
  adStuckTimer = window.setTimeout(() => {
    if (!isAdPlaying) return
    console.warn('[ads] force release stale ad playback', reason)
    resetAdPlaybackState()
  }, AD_STUCK_TIMEOUT_MS)
}

function emitPause() {
  isAdPlaying = true
  adPauseDepth++
  gameplayPause()
  window.dispatchEvent(new CustomEvent('ads:pause'))
}

function emitResume() {
  clearAdStuckWatchdog()
  if (adPauseDepth > 0) {
    adPauseDepth--
    gameplayResume()
  }
  if (adPauseDepth <= 0) {
    adPauseDepth = 0
    isAdPlaying = false
    window.dispatchEvent(new CustomEvent('ads:resume'))
  }
}

/** Полный сброс паузы от рекламы (все вложенные emitPause). */
export function resetAdPlaybackState(): void {
  clearAdStuckWatchdog()
  while (adPauseDepth > 0) {
    adPauseDepth--
    gameplayResume()
  }
  adPauseDepth = 0
  isAdPlaying = false
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

function passesSessionFirstMinuteGate(now: number): boolean {
  // Стартовая реклама = разрешённый показ в начале; не блокируем игру ещё 60 с.
  if (startupAdShown) return true
  return now - SESSION_START >= FIRST_AD_GAP
}

function passesInterstitialInterval(now: number): boolean {
  if (lastInterstitialAt <= 0) return true
  return now - lastInterstitialAt >= INTERSTITIAL_MIN_GAP
}

function passesRewardedBuffer(now: number): boolean {
  if (lastAnyAdAt <= 0) return true
  return now - lastAnyAdAt >= INTER_TO_REWARD_GAP
}

function logInterstitialBlocked(reason: string | undefined, why: string): void {
  if (!import.meta.env.DEV || !reason) return
  // eslint-disable-next-line no-console
  console.info('[ads] interstitial skipped', reason, why)
}

function ensureAdNotStuck(reason?: string): void {
  if (isAdPlaying) {
    console.warn('[ads] clearing stale ad state before show', reason)
    resetAdPlaybackState()
  }
}

export function canShowInterstitial(reason?: string): boolean {
  if (!shouldShowAds()) {
    logInterstitialBlocked(reason, 'ads disabled')
    return false
  }
  ensureAdNotStuck(reason)
  const now = Date.now()
  if (!passesSessionFirstMinuteGate(now)) {
    logInterstitialBlocked(reason, 'first minute (no startup ad)')
    return false
  }
  if (!passesInterstitialInterval(now)) {
    logInterstitialBlocked(reason, 'interstitial cooldown')
    return false
  }
  if (!passesRewardedBuffer(now)) {
    logInterstitialBlocked(reason, 'after rewarded cooldown')
    return false
  }
  return true
}

function canShowStartupInterstitial(): boolean {
  if (!shouldShowAds()) return false
  ensureAdNotStuck('startup')
  const now = Date.now()
  if (lastInterstitialAt > 0 && now - lastInterstitialAt < INTERSTITIAL_MIN_GAP) return false
  if (lastAnyAdAt > 0 && now - lastAnyAdAt < INTER_TO_REWARD_GAP) return false
  return true
}

function markInterstitialShown(): void {
  lastInterstitialAt = Date.now()
  lastAnyAdAt = lastInterstitialAt
}

function invokeFullscreenAdv(reason: string | undefined, finish: () => void): boolean {
  const ysdk = getYsdk()
  if (!ysdk?.adv) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] interstitial (dev stub)', reason)
      markInterstitialShown()
      finish()
      return true
    }
    console.warn('[ads] interstitial: no ysdk.adv', reason)
    return false
  }

  emitPause()
  armAdStuckWatchdog(reason)
  let marked = false
  const markOnce = () => {
    if (marked) return
    marked = true
    markInterstitialShown()
  }
  const done = () => {
    emitResume()
    finish()
  }

  try {
    ysdk.adv.showFullscreenAdv({
      callbacks: {
        onOpen: () => {
          markOnce()
          // eslint-disable-next-line no-console
          console.info('[ads] interstitial opened', reason)
        },
        onClose: () => done(),
        onError: (err) => {
          console.warn('[ads] interstitial error', reason, err)
          done()
        },
        onOffline: () => {
          console.warn('[ads] interstitial offline', reason)
          done()
        },
      },
    })
  } catch (err) {
    console.warn('[ads] interstitial failed', reason, err)
    done()
    return false
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

const STARTUP_AD_RETRY_MS = 300
const STARTUP_AD_MAX_RETRIES = 40

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
    resetAdPlaybackState()
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

/** Полноэкранная реклама по клику. */
export function showInterstitial(
  _reason?: string,
  opts?: { onClose?: () => void; onBlocked?: () => void },
): boolean {
  const finish = () => opts?.onClose?.()
  const blocked = () => (opts?.onBlocked ?? finish)()

  if (!canShowInterstitial(_reason)) {
    blocked()
    return false
  }

  if (!invokeFullscreenAdv(_reason, finish)) {
    blocked()
    return false
  }
  return true
}

/**
 * Interstitial без кулдаунов FIRST_AD / INTERSTITIAL_MIN / REWARDED buffer.
 * @returns false если SDK недоступен — вызывающий может повторить попытку.
 */
export function showInterstitialIgnoringCooldown(
  _reason?: string,
  opts?: { onClose?: () => void; onBlocked?: () => void },
): boolean {
  const finish = () => opts?.onClose?.()
  const blocked = () => opts?.onBlocked?.() ?? finish()

  if (!shouldShowAds()) {
    console.warn('[ads] forced interstitial skipped: ads disabled', _reason)
    blocked()
    return false
  }

  resetAdPlaybackState()

  if (!invokeFullscreenAdv(_reason, finish)) {
    return false
  }
  return true
}

const FORCED_AD_RETRY_MS = 200
const FORCED_AD_MAX_RETRIES = 20

/** Показ без кулдаунов с повторами, пока не готов ysdk.adv. */
export function runForcedInterstitialWithRetry(
  reason: string,
  action: () => void,
): void {
  if (!canShowAds()) {
    action()
    return
  }

  const opts = { onClose: action, onBlocked: action }
  if (showInterstitialIgnoringCooldown(reason, opts)) return

  let tries = 0
  const attempt = () => {
    resetAdPlaybackState()
    if (showInterstitialIgnoringCooldown(reason, opts)) return
    tries += 1
    if (tries < FORCED_AD_MAX_RETRIES) {
      window.setTimeout(attempt, FORCED_AD_RETRY_MS)
      return
    }
    console.warn('[ads] forced interstitial unavailable after retries', reason)
    action()
  }
  window.setTimeout(attempt, FORCED_AD_RETRY_MS)
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
  ensureAdNotStuck('rewarded')
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
  const finish = () => {
    emitResume()
    if (granted) onReward()
    opts?.onFinish?.()
  }

  emitPause()
  armAdStuckWatchdog('rewarded')
  try {
    ysdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => {
          granted = true
        },
        onClose: () => finish(),
        onError: () => {
          console.warn('[ads] rewarded error')
          finish()
        },
      },
    })
  } catch (err) {
    console.warn('[ads] rewarded failed', err)
    finish()
  }
  return true
}
