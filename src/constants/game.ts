/** Отображаемое название игры. */
export const GAME_NAME = 'Свайпай и Флиртуй'

/** ID товара премиума в консоли (вкладка In-app purchases). */
export const PREMIUM_PRODUCT_ID = 'premium'

/**
 * ID consumable-товаров магазина в консоли (In-app purchases).
 * Должны совпадать с таблицей покупок в консоли разработчика.
 */
export const SHOP_IAP_PRODUCT_IDS = {
  diamonds_500: 'diamonds_500',
  diamonds_250: 'diamonds_250',
  diamonds_550: 'diamonds_550',
  diamonds_2750: 'diamonds_2750',
  diamonds_6000: 'diamonds_6000',
  diamonds_12000: 'diamonds_12000',
  energy_30: 'energy_30',
  energy_80: 'energy_80',
  energy_200: 'energy_200',
} as const

/** Награда за просмотр rewarded-рекламы (энергия). */
export const REWARDED_ENERGY_AMOUNT = 1

/** Награда за просмотр rewarded-рекламы (алмазы). */
export const REWARDED_DIAMONDS_AMOUNT = 10

/** Множитель ежедневной награды за просмотр рекламы. */
export const DAILY_REWARD_AD_MULTIPLIER = 2
