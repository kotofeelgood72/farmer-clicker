import { computed, ref } from 'vue'
import { PREMIUM_PRODUCT_ID } from '@/constants/game'
import { processPendingPurchases, purchasePremiumProduct } from '@/yandex/payments'
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

/** Синхронизация с покупками Яндекс (non-consumable). */
export async function syncPremiumFromSdk(): Promise<void> {
  if (syncPromise) return syncPromise
  syncPromise = (async () => {
    syncing.value = true
    try {
      const { hasPremium } = await processPendingPurchases()
      if (hasPremium) grantPremium()
    } finally {
      syncing.value = false
      syncPromise = null
    }
  })()
  return syncPromise
}

/** Синхронная проверка вне Vue (даты, data layer). */
export function isPremiumOwned(): boolean {
  return owned.value
}

export function usePremium() {
  const isPremium = computed(() => owned.value)

  async function purchasePremium(): Promise<boolean> {
    if (owned.value) return true
    if (purchasing.value) return false

    purchasing.value = true
    try {
      const ok = await purchasePremiumProduct()
      if (!ok) return false

      grantPremium()
      const { hasPremium } = await processPendingPurchases()
      if (!hasPremium && !import.meta.env.DEV) {
        console.warn('[premium] purchase ok but getPurchases has no premium yet')
      }
      return true
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
