import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { syncAllAwaitingReplies } from '@/composables/useChatHistory'
import { useAchievements } from '@/composables/useAchievements'
import {
  checkRelationshipLevelUps,
  checkUnreadChatReminders,
  notifyNewAchievements,
} from '@/composables/useInAppNotifications'

const ACHIEVEMENT_STORAGE_KEY = 'swipe-achievements-v1'

function loadUnlockedIds(): string[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { unlockedIds?: string[] }
    return Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds : []
  } catch {
    return []
  }
}

function isInChatScreen(path: string, name: string | undefined): boolean {
  return name === 'chat' || path.startsWith('/chat/')
}

/** Глобальный наблюдатель уведомлений: достижения, уровни, напоминания о чатах. */
export function useNotificationWatcher() {
  const route = useRoute()
  const { refreshAchievements } = useAchievements()

  let intervalId: ReturnType<typeof setInterval> | null = null
  let previousAchievementIds = new Set(loadUnlockedIds())

  function syncAchievements() {
    refreshAchievements()
    const current = loadUnlockedIds()
    notifyNewAchievements(previousAchievementIds, current)
    previousAchievementIds = new Set(current)
    checkRelationshipLevelUps()
  }

  function pollChatReminders() {
    syncAllAwaitingReplies()
    const inChat = isInChatScreen(route.path, route.name as string | undefined)
    checkUnreadChatReminders(inChat ? -1 : null)
  }

  onMounted(() => {
    syncAchievements()
    pollChatReminders()
    intervalId = setInterval(pollChatReminders, 20_000)
  })

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
  })

  watch(
    () => route.path,
    () => {
      syncAchievements()
      pollChatReminders()
    },
  )
}
