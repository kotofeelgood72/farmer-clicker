/** Девушки, доступные только с Премиумом (новый мэтч и чат). */
export const PREMIUM_GIRL_IDS: ReadonlySet<number> = new Set([
  4, // Вероника
  7, // Виктория
  11, // София
  13, // Диана
  15, // Луна
  18, // Рокси
  20, // Изабелла
])

/** Локации свиданий только для Премиум (id папки meeting). */
export const PREMIUM_LOCATION_IDS: ReadonlySet<number> = new Set([
  4, // Выставка
  5, // Концерт
  6, // Ресторан
])

export function isPremiumGirlId(girlId: number): boolean {
  return PREMIUM_GIRL_IDS.has(girlId)
}

export function isPremiumLocationId(locationId: number): boolean {
  return PREMIUM_LOCATION_IDS.has(locationId)
}

export function dateNeedsPremium(girlId: number, locationId: number): boolean {
  return isPremiumGirlId(girlId) || isPremiumLocationId(locationId)
}
