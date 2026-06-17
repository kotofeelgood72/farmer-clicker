import type { YsdkProduct } from '@/yandex/payments'

export interface IapPriceDisplay {
  /** Строка цены из SDK (`product.price`), меняется при currency mock. */
  text: string
  /** URL иконки из `getPriceCurrencyImage()`. */
  icon?: string
}

/** Цена и иконка портальной валюты из каталога SDK (п. 3.8). */
export function getIapPriceDisplay(product: YsdkProduct | null | undefined): IapPriceDisplay | null {
  if (!product) return null

  const text = product.price?.trim()
  if (!text) return null

  return {
    text,
    icon: product.currencyImageUrl,
  }
}
