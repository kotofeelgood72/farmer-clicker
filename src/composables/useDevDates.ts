import { ref } from 'vue'

const STORAGE_KEY = 'swipe-dev-unlock-dates'

function loadFlag(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Временно: все свидания доступны без завершённого чата. */
export const devUnlockAllDates = ref(loadFlag())

export function setDevUnlockAllDates(enabled: boolean) {
  devUnlockAllDates.value = enabled
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function toggleDevUnlockAllDates() {
  setDevUnlockAllDates(!devUnlockAllDates.value)
}
