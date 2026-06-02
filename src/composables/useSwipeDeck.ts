import { computed, ref } from 'vue'
import { canShowAds, showRewarded } from '@/ads/ads'
import { GIRLS } from '@/data/girls'
import { useChatHistory } from '@/composables/useChatHistory'
import { clearSwipePassedMany, useSwipePasses } from '@/composables/useSwipePasses'

const unlockingAd = ref(false)

/** Девушки, с которыми ещё не начат чат. */
function useMeetableGirls() {
  const { hasActiveChat } = useChatHistory()
  return computed(() => GIRLS.filter((g) => !hasActiveChat(g.id)))
}

export function useSwipeDeck() {
  const { passedGirlIds } = useSwipePasses()
  const meetableGirls = useMeetableGirls()

  const allGirlsInChats = computed(() => meetableGirls.value.length === 0)

  const swipeDeck = computed(() =>
    meetableGirls.value.filter((g) => !passedGirlIds.value.has(g.id)),
  )

  const hasSwipeCards = computed(() => swipeDeck.value.length > 0)

  const passedMeetableCount = computed(
    () => meetableGirls.value.filter((g) => passedGirlIds.value.has(g.id)).length,
  )

  const activeChatsCount = computed(() => GIRLS.length - meetableGirls.value.length)

  /** Есть пропущенные анкеты, с которыми ещё не начат чат. */
  const canRestorePassedProfile = computed(
    () =>
      !hasSwipeCards.value &&
      !allGirlsInChats.value &&
      passedMeetableCount.value > 0,
  )

  const canUnlockProfileViaAd = computed(
    () => canRestorePassedProfile.value && canShowAds(),
  )

  function restoreAllPassedMeetableProfiles(): number {
    const ids = meetableGirls.value
      .filter((g) => passedGirlIds.value.has(g.id))
      .map((g) => g.id)
    return clearSwipePassedMany(ids)
  }

  function restoreAllPassedProfiles(onUnlocked?: () => void): boolean {
    if (!canRestorePassedProfile.value) return false
    const restored = restoreAllPassedMeetableProfiles()
    if (restored > 0) onUnlocked?.()
    return restored > 0
  }

  function watchAdForExtraProfile(onUnlocked?: () => void) {
    if (unlockingAd.value || !canUnlockProfileViaAd.value) return false

    unlockingAd.value = true
    const started = showRewarded(
      () => {
        restoreAllPassedProfiles(onUnlocked)
      },
      {
        onFinish: () => {
          unlockingAd.value = false
        },
      },
    )
    if (!started) unlockingAd.value = false
    return started
  }

  return {
    meetableGirls,
    swipeDeck,
    hasSwipeCards,
    allGirlsInChats,
    canRestorePassedProfile,
    canUnlockProfileViaAd,
    passedMeetableCount,
    activeChatsCount,
    unlockingAd,
    restoreAllPassedProfiles,
    watchAdForExtraProfile,
  }
}
