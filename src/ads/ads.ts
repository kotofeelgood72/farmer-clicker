// Ads orchestration: cooldowns, dev stubs, pause / mute lifecycle.
// Game loop pause + audio mute are dispatched via window CustomEvents so
// non-Vue code (this module) doesn't need to import the game/store.

import { getYsdk } from '@/yandex/sdk'

const SESSION_START = Date.now()
const FIRST_AD_GAP = 60_000 // no interstitial in first minute (Yandex requirement)
const INTERSTITIAL_MIN_GAP = 90_000 // our cooldown — 30s stricter than SDK
const INTER_TO_REWARD_GAP = 30_000 // don't pile ads back-to-back

let lastInterstitialAt = 0
let lastAnyAdAt = 0
let isAdPlaying = false

function emitPause() {
  isAdPlaying = true
  window.dispatchEvent(new CustomEvent('ads:pause'))
}
function emitResume() {
  isAdPlaying = false
  window.dispatchEvent(new CustomEvent('ads:resume'))
}

export function adsPlaying(): boolean {
  return isAdPlaying
}

export function canShowInterstitial(): boolean {
  if (isAdPlaying) return false
  const now = Date.now()
  if (now - SESSION_START < FIRST_AD_GAP) return false
  if (now - lastInterstitialAt < INTERSTITIAL_MIN_GAP) return false
  if (now - lastAnyAdAt < INTER_TO_REWARD_GAP) return false
  return true
}

/**
 * Try to show a fullscreen interstitial. No-op if cooldown is not satisfied
 * or the SDK is unavailable. Always safe to call.
 */
export function showInterstitial(_reason?: string): void {
  if (!canShowInterstitial()) return
  lastInterstitialAt = Date.now()
  lastAnyAdAt = lastInterstitialAt

  const ysdk = getYsdk()
  if (!ysdk) {
    // Dev / no platform — pretend the ad played briefly so cooldown engages.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] interstitial (dev stub)', _reason)
    }
    return
  }

  emitPause()
  try {
    ysdk.adv.showFullscreenAdv({
      callbacks: {
        onClose: () => emitResume(),
        onError: () => emitResume(),
      },
    })
  } catch (err) {
    console.warn('[ads] interstitial failed', err)
    emitResume()
  }
}

/**
 * Show a rewarded video. Reward is delivered ONLY if onRewarded fires.
 * In dev (no SDK), reward is granted immediately for testing.
 */
export function showRewarded(onReward: () => void): void {
  if (isAdPlaying) return
  lastAnyAdAt = Date.now()

  const ysdk = getYsdk()
  if (!ysdk) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] rewarded (dev stub) — granting immediately')
      onReward()
    }
    return
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
        },
        onError: () => {
          emitResume()
        },
      },
    })
  } catch (err) {
    console.warn('[ads] rewarded failed', err)
    emitResume()
  }
}
