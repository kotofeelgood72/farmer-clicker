import { resetAdPlacementsState } from '@/composables/useAdPlacements'
import { resetSwipePassesStore } from '@/composables/useSwipePasses'
import { resetGameReviewStore } from '@/composables/useGameReview'
import { resetReviewSession } from '@/yandex/sdk'
import { resetAchievementsStore } from '@/composables/useAchievements'
import { resetInAppNotificationsStore } from '@/composables/useInAppNotifications'
import { resetChatHistoryStore } from '@/composables/useChatHistory'
import { resetDailyRewardsStore } from '@/composables/useDailyRewards'
import { resetDiamondsStore } from '@/composables/useDiamonds'
import { resetEnergyStore } from '@/composables/useEnergy'
import { resetPlayerStatsStore } from '@/composables/usePlayerStats'

/** Премиум и аватар не сбрасываются вместе с прогрессом. */
const PRESERVED_KEYS = new Set(['swipe-user-avatar', 'swipe-premium-v1'])

function clearSwipeLocalStorage() {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('swipe-') && !PRESERVED_KEYS.has(key)) keys.push(key)
  }
  for (const key of keys) {
    localStorage.removeItem(key)
  }
}

/** Полный сброс прогресса: чаты, диалоги, свидания, статистика, энергия, алмазы. */
export function resetAllGameProgress() {
  clearSwipeLocalStorage()
  resetEnergyStore()
  resetDiamondsStore()
  resetChatHistoryStore()
  resetPlayerStatsStore()
  resetDailyRewardsStore()
  resetAchievementsStore()
  resetInAppNotificationsStore()
  resetAdPlacementsState()
  resetSwipePassesStore()
  resetGameReviewStore()
  resetReviewSession()
}
