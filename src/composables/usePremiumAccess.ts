import {
  dateNeedsPremium,
  isPremiumGirlId,
} from '@/constants/premiumContent'
import { useChatHistory } from '@/composables/useChatHistory'
import { usePremium } from '@/composables/usePremium'
import { useAppNavigation } from '@/composables/useAppNavigation'

export function usePremiumAccess() {
  const { isPremium } = usePremium()
  const { hasActiveChat } = useChatHistory()
  const { pushFrom } = useAppNavigation()

  function canAccessGirl(girlId: number): boolean {
    if (isPremium.value) return true
    if (!isPremiumGirlId(girlId)) return true
    return hasActiveChat(girlId)
  }

  function canStartDate(girlId: number, locationId: number): boolean {
    if (isPremium.value) return true
    return !dateNeedsPremium(girlId, locationId)
  }

  function isGirlLockedForUser(girlId: number): boolean {
    return !canAccessGirl(girlId)
  }

  function openPremiumShop() {
    void pushFrom({ path: '/shop', query: { tab: 'premium' } })
  }

  return {
    isPremium,
    canAccessGirl,
    canStartDate,
    isGirlLockedForUser,
    isPremiumGirlId,
    openPremiumShop,
  }
}
