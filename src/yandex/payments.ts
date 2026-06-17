import { PREMIUM_PRODUCT_ID } from '@/constants/game'
import { getYsdk, initYandex } from '@/yandex/sdk'

export interface YsdkPurchase {
  productID: string
  purchaseToken: string
  developerPayload?: string
}

export interface YsdkProduct {
  id: string
  title: string
  description: string
  imageURI: string
  price: string
  priceValue: string
  priceCurrencyCode: string
  /** Иконка портальной валюты из SDK (getPriceCurrencyImage). */
  currencyImageUrl?: string
}

type YsdkProductRaw = YsdkProduct & {
  getPriceCurrencyImage?: (size: 'small' | 'medium' | 'svg') => string
}

function readCurrencyImageUrl(raw: YsdkProductRaw): string | undefined {
  if (typeof raw.getPriceCurrencyImage !== 'function') return undefined

  for (const size of ['small', 'medium', 'svg'] as const) {
    try {
      const url = raw.getPriceCurrencyImage(size)?.trim()
      if (url) return url
    } catch {
      /* ignore */
    }
  }
  return undefined
}

function normalizeProduct(raw: YsdkProductRaw): YsdkProduct {
  const currencyImageUrl = readCurrencyImageUrl(raw)
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    imageURI: raw.imageURI,
    price: raw.price,
    priceValue: raw.priceValue,
    priceCurrencyCode: raw.priceCurrencyCode,
    currencyImageUrl,
  }
}

export interface PortalCurrencyMeta {
  imageUrl?: string
  code?: string
}

export interface ShopCatalogData {
  premium: YsdkProduct | null
  productsById: Record<string, YsdkProduct>
  portalCurrency: PortalCurrencyMeta
}

let catalogCache: ShopCatalogData | null = null
let catalogPromise: Promise<ShopCatalogData> | null = null

function buildProductsById(products: YsdkProduct[]): Record<string, YsdkProduct> {
  const map: Record<string, YsdkProduct> = {}
  for (const product of products) {
    map[product.id] = product
  }
  return map
}

async function loadShopCatalogFromApi(): Promise<ShopCatalogData> {
  const empty: ShopCatalogData = { premium: null, productsById: {}, portalCurrency: {} }
  const payments = await getPaymentsApi()
  if (!payments) return empty

  try {
    const catalog = await payments.getCatalog()
    const normalized = catalog.map((item) => normalizeProduct(item as YsdkProductRaw))
    const productsById = buildProductsById(normalized)
    const premium = productsById[PREMIUM_PRODUCT_ID] ?? null
    const source = premium ?? normalized[0]
    const portalCurrency: PortalCurrencyMeta = source
      ? {
          imageUrl: source.currencyImageUrl,
          code: source.priceCurrencyCode?.trim() || undefined,
        }
      : {}

    return { premium, productsById, portalCurrency }
  } catch (err) {
    console.warn('[yandex payments] getCatalog failed', err)
    return empty
  }
}

/** Каталог IAP: премиум + метаданные портальной валюты (п. 3.8). */
export function fetchShopCatalog(): Promise<ShopCatalogData> {
  if (catalogCache) return Promise.resolve(catalogCache)
  if (catalogPromise) return catalogPromise

  catalogPromise = loadShopCatalogFromApi()
    .then((data) => {
      catalogCache = data
      return data
    })
    .finally(() => {
      catalogPromise = null
    })

  return catalogPromise
}

export interface YsdkPayments {
  getCatalog(): Promise<YsdkProduct[]>
  getPurchases(): Promise<YsdkPurchase[]>
  purchase(opts: { id: string; developerPayload?: string }): Promise<YsdkPurchase>
  consumePurchase(purchaseToken: string): Promise<void>
}

let paymentsPromise: Promise<YsdkPayments | null> | null = null

async function resolvePayments(): Promise<YsdkPayments | null> {
  await initYandex()
  const ysdk = getYsdk() as {
    getPayments?: (opts?: { signed?: boolean }) => Promise<YsdkPayments>
    payments?: YsdkPayments
  } | null
  if (!ysdk) return null

  try {
    if (typeof ysdk.getPayments === 'function') {
      return await ysdk.getPayments({ signed: false })
    }
    if (ysdk.payments) return ysdk.payments
  } catch (err) {
    console.warn('[yandex payments] init failed', err)
  }
  return null
}

export function getPaymentsApi(): Promise<YsdkPayments | null> {
  if (!paymentsPromise) paymentsPromise = resolvePayments()
  return paymentsPromise
}

export async function fetchPremiumCatalogProduct(): Promise<YsdkProduct | null> {
  const { premium } = await fetchShopCatalog()
  return premium
}

/** Список покупок игрока (для постоянных — без consumePurchase). */
export async function fetchPurchases(): Promise<YsdkPurchase[]> {
  const payments = await getPaymentsApi()
  if (!payments) return []
  try {
    return await payments.getPurchases()
  } catch (err) {
    console.warn('[yandex payments] getPurchases failed', err)
    return []
  }
}

export async function fetchOwnedPremium(): Promise<boolean> {
  const purchases = await fetchPurchases()
  return purchases.some((p) => p.productID === PREMIUM_PRODUCT_ID)
}

/**
 * Обработка необработанных покупок при запуске (требование SDK / модерации).
 * Постоянные товары — только проверка productID, consume не вызывается.
 */
export async function processPendingPurchases(): Promise<{
  hasPremium: boolean
  purchases: YsdkPurchase[]
}> {
  const purchases = await fetchPurchases()
  const hasPremium = purchases.some((p) => p.productID === PREMIUM_PRODUCT_ID)
  return { hasPremium, purchases }
}

export async function purchasePremiumProduct(): Promise<boolean> {
  const payments = await getPaymentsApi()
  if (!payments) {
    if (import.meta.env.DEV) {
      console.info('[yandex payments] purchase premium (dev stub)')
      return true
    }
    return false
  }

  try {
    const purchase = await payments.purchase({ id: PREMIUM_PRODUCT_ID })
    return purchase.productID === PREMIUM_PRODUCT_ID
  } catch (err) {
    console.info('[yandex payments] purchase cancelled or failed', err)
    return false
  }
}

/** Consumable-покупка: purchase + consumePurchase. */
export async function purchaseConsumableProduct(productId: string): Promise<boolean> {
  const payments = await getPaymentsApi()
  if (!payments) {
    if (import.meta.env.DEV) {
      console.info('[yandex payments] purchase consumable (dev stub)', productId)
      return true
    }
    return false
  }

  try {
    const purchase = await payments.purchase({ id: productId })
    if (purchase.productID !== productId) return false
    await payments.consumePurchase(purchase.purchaseToken)
    return true
  } catch (err) {
    console.info('[yandex payments] consumable purchase cancelled or failed', err)
    return false
  }
}
