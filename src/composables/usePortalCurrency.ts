import { computed, readonly, ref } from 'vue'
import fallbackIcon from '@/assets/ui/yan-coin.png'
import { fetchShopCatalog, type PortalCurrencyMeta } from '@/yandex/payments'
import { isYsdkReady } from '@/yandex/sdk'

const sdkIconUrl = ref<string | null>(null)
const code = ref('')

let synced = false
let syncPromise: Promise<void> | null = null

function applyPortalCurrency(meta: PortalCurrencyMeta): void {
  if (meta.imageUrl) sdkIconUrl.value = meta.imageUrl
  if (meta.code) code.value = meta.code
}

/** Подгружает иконку и код портальной валюты из SDK (п. 3.8). */
export function syncPortalCurrency(): Promise<void> {
  if (synced) return Promise.resolve()
  if (syncPromise) return syncPromise

  syncPromise = fetchShopCatalog()
    .then(({ portalCurrency }) => {
      if (portalCurrency.imageUrl || portalCurrency.code) {
        applyPortalCurrency(portalCurrency)
        synced = true
      }
    })
    .finally(() => {
      syncPromise = null
    })

  return syncPromise
}

export function usePortalCurrency() {
  const iconUrl = computed(() => {
    if (sdkIconUrl.value) return sdkIconUrl.value
    if (import.meta.env.DEV && !isYsdkReady()) return fallbackIcon
    return ''
  })

  const currencyAlt = computed(() =>
    code.value ? `Валюта ${code.value}` : 'Портальная валюта',
  )

  const hasSdkCurrency = computed(() => Boolean(sdkIconUrl.value))

  return {
    iconUrl,
    code: readonly(code),
    currencyAlt,
    hasSdkCurrency,
    syncPortalCurrency,
  }
}
