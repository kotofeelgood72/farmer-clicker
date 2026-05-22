import { ref } from 'vue'
import { canShowAds, showRewarded } from '@/ads/ads'
import { REWARDED_DIAMONDS_AMOUNT } from '@/constants/game'
import { useDiamonds } from '@/composables/useDiamonds'

const watching = ref(false)

export function useRewardedDiamonds() {
  const { add } = useDiamonds()

  function watchAdForDiamonds(onDone?: () => void) {
    if (watching.value || !canShowAds()) return

    watching.value = true
    const started = showRewarded(
      () => add(REWARDED_DIAMONDS_AMOUNT),
      { onFinish: () => {
        watching.value = false
        onDone?.()
      } },
    )
    if (!started) watching.value = false
  }

  return {
    watching,
    watchAdForDiamonds,
  }
}
