// Thin wrapper around the Yandex Games SDK.
// In dev (or any page without window.YaGames) returns null and we fall back
// to dev stubs in the ads module.

export interface YsdkFullscreenCallbacks {
  onOpen?: () => void
  onClose?: (wasShown: boolean) => void
  onError?: (err: unknown) => void
  onOffline?: () => void
}

export interface YsdkRewardedCallbacks {
  onOpen?: () => void
  onRewarded?: () => void
  onClose?: () => void
  onError?: (err: unknown) => void
}

export interface YsdkAdv {
  showFullscreenAdv(opts: { callbacks?: YsdkFullscreenCallbacks }): void
  showRewardedVideo(opts: { callbacks?: YsdkRewardedCallbacks }): void
}

export interface Ysdk {
  adv: YsdkAdv
  features?: {
    LoadingAPI?: { ready: () => void }
  }
}

let ysdk: Ysdk | null = null
let initPromise: Promise<Ysdk | null> | null = null

export function initYandex(): Promise<Ysdk | null> {
  if (initPromise) return initPromise
  const YaGames = (window as any).YaGames
  if (!YaGames || typeof YaGames.init !== 'function') {
    // Local dev or platform without SDK — return null, caller uses fallbacks.
    initPromise = Promise.resolve(null)
    return initPromise
  }
  initPromise = YaGames.init()
    .then((sdk: Ysdk) => {
      ysdk = sdk
      try {
        sdk.features?.LoadingAPI?.ready()
      } catch {}
      return sdk
    })
    .catch((err: unknown) => {
      console.warn('[yandex sdk] init failed', err)
      return null
    })
  return initPromise
}

export function getYsdk(): Ysdk | null {
  return ysdk
}
