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
  const payments = await getPaymentsApi()
  if (!payments) return null
  try {
    const catalog = await payments.getCatalog()
    return catalog.find((p) => p.id === PREMIUM_PRODUCT_ID) ?? null
  } catch (err) {
    console.warn('[yandex payments] getCatalog failed', err)
    return null
  }
}

export async function fetchOwnedPremium(): Promise<boolean> {
  const payments = await getPaymentsApi()
  if (!payments) return false
  try {
    const purchases = await payments.getPurchases()
    return purchases.some((p) => p.productID === PREMIUM_PRODUCT_ID)
  } catch (err) {
    console.warn('[yandex payments] getPurchases failed', err)
    return false
  }
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
