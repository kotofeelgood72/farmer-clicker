const MOBILE_MQ = window.matchMedia('(max-width: 640px), (hover: none) and (pointer: coarse)')

function readViewportHeight(): number {
  return window.visualViewport?.height ?? window.innerHeight
}

/** Синхронизирует CSS-переменные высоты и классы мобильного / edge-to-edge режима. */
export function syncViewportLayout(): void {
  const root = document.documentElement
  const mobile = MOBILE_MQ.matches

  root.classList.toggle('is-mobile', mobile)
  root.classList.toggle('is-edge-to-edge', mobile)
  root.classList.toggle('is-desktop', !mobile)

  const vh = readViewportHeight()
  root.style.setProperty('--vh', `${vh * 0.01}px`)
  root.style.setProperty('--app-height', `${vh}px`)
}

export function markPlatformHost(): void {
  document.documentElement.classList.add('is-platform')
  syncViewportLayout()
}

export function initViewportLayout(): void {
  syncViewportLayout()
  window.addEventListener('resize', syncViewportLayout)
  window.visualViewport?.addEventListener('resize', syncViewportLayout)
  MOBILE_MQ.addEventListener('change', syncViewportLayout)
}
