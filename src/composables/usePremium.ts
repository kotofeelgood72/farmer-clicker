import { computed, ref } from 'vue'
import { PREMIUM_PRODUCT_ID } from '@/constants/game'
import { fetchOwnedPremium, purchasePremiumProduct } from '@/yandex/payments'
import { useAchievements } from '@/composables/useAchievements'

const STORAGE_KEY = 'swipe-premium-v1'

function loadOwned(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === '1' || raw === 'true') return true
  } catch {
    /* ignore */
  }
  return false
}

const owned = ref(loadOwned())
const syncing = ref(false)
const purchasing = ref(false)
let syncPromise: Promise<void> | null = null

function persistOwned(value: boolean) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

function grantPremium() {
  owned.value = true
  persistOwned(true)
  useAchievements().trackPremiumPurchase()
}

export function resetPremiumStore() {
  owned.value = false
  persistOwned(false)
}

/** Синхронизация с покупками Яндекс (non-consumable). */
export async function syncPremiumFromSdk(): Promise<void> {
  if (syncPromise) return syncPromise
  syncPromise = (async () => {
    syncing.value = true
    try {
      const remoteOwned = await fetchOwnedPremium()
      if (remoteOwned) grantPremium()
    } finally {
      syncing.value = false
      syncPromise = null
    }
  })()
  return syncPromise
}

export function usePremium() {
  const isPremium = computed(() => owned.value)

  async function purchasePremium(): Promise<boolean> {
    if (owned.value) return true
    if (purchasing.value) return false

    purchasing.value = true
    try {
      const ok = await purchasePremiumProduct()
      if (ok) grantPremium()
      return ok
    } finally {
      purchasing.value = false
    }
  }

  return {
    isPremium,
    syncing,
    purchasing,
    premiumProductId: PREMIUM_PRODUCT_ID,
    purchasePremium,
    syncPremiumFromSdk,
  }
}
