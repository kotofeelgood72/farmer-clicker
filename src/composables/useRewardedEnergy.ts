import { ref } from 'vue'
import { showRewarded } from '@/ads/ads'
import { REWARDED_ENERGY_AMOUNT } from '@/constants/game'
import { useEnergy } from '@/composables/useEnergy'
import { usePremium } from '@/composables/usePremium'

const watching = ref(false)

export function useRewardedEnergy() {
  const { add } = useEnergy()
  const { isPremium } = usePremium()

  function watchAdForEnergy(onDone?: () => void) {
    if (watching.value || isPremium.value) return

    watching.value = true
    const started = showRewarded(() => {
      add(REWARDED_ENERGY_AMOUNT)
      watching.value = false
      onDone?.()
    })
    if (!started) watching.value = false
  }

  return {
    watching,
    watchAdForEnergy,
  }
}
