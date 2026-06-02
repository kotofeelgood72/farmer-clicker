import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { usePremium } from '@/composables/usePremium'

export const PREMIUM_INFINITY_LABEL = '∞'

/** Число ресурса или ∞ для премиум-игрока. */
export function usePremiumResourceLabel(source: MaybeRefOrGetter<number>) {
  const { isPremium } = usePremium()
  return computed(() =>
    isPremium.value ? PREMIUM_INFINITY_LABEL : String(toValue(source)),
  )
}
