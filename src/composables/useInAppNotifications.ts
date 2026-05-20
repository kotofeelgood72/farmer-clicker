import { computed, ref } from 'vue'
import { GIRLS } from '@/data/girls'
import { ACHIEVEMENT_DEFINITIONS } from '@/data/achievements'
import {
  clearAwaitingReply,
  getAwaitingReplySessions,
} from '@/composables/useChatHistory'
import { getRelationshipLevel } from '@/composables/useRelationshipLevel'
import { isGirlChatAwaitingReply } from '@/composables/useGirlChat'

const LEVEL_STORAGE_KEY = 'swipe-rel-levels-v1'
const SHOWN_STORAGE_KEY = 'swipe-notif-shown-v1'

export type InAppNotificationType =
  | 'achievement'
  | 'date_available'
  | 'level_up'
  | 'slow_reply'
  | 'misses_you'

export interface InAppNotification {
  id: string
  type: InAppNotificationType
  title: string
  body: string
  /** Маршрут по тапу. */
  to?: string
  girlId?: number
}

const AUTO_DISMISS_MS = 5000

const QUEUE: InAppNotification[] = []
const visible = ref<InAppNotification | null>(null)
const dismissing = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null
let processTimer: ReturnType<typeof setTimeout> | null = null

const shownKeys = ref<Set<string>>(loadShownKeys())

function loadShownKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(SHOWN_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function saveShownKeys() {
  try {
    localStorage.setItem(SHOWN_STORAGE_KEY, JSON.stringify([...shownKeys.value]))
  } catch {
    /* ignore */
  }
}

function rememberShown(key: string) {
  shownKeys.value.add(key)
  saveShownKeys()
}

function hasShown(key: string): boolean {
  return shownKeys.value.has(key)
}

function girlName(girlId: number): string {
  return GIRLS.find((g) => g.id === girlId)?.name ?? 'Она'
}

function loadRelationshipLevels(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LEVEL_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, number>
  } catch {
    return {}
  }
}

function saveRelationshipLevels(levels: Record<string, number>) {
  try {
    localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(levels))
  } catch {
    /* ignore */
  }
}

function enqueue(item: Omit<InAppNotification, 'id'>) {
  QUEUE.push({
    ...item,
    id: `${item.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  })
  scheduleProcess()
}

function scheduleProcess() {
  if (visible.value || dismissing.value || processTimer) return
  processTimer = setTimeout(() => {
    processTimer = null
    showNext()
  }, 80)
}

function showNext() {
  const next = QUEUE.shift()
  if (!next) return
  dismissing.value = false
  visible.value = next
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => dismissCurrent(), AUTO_DISMISS_MS)
}

function dismissCurrent() {
  if (!visible.value) return
  dismissing.value = true
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  setTimeout(() => {
    visible.value = null
    dismissing.value = false
    scheduleProcess()
  }, 280)
}

export function notifyAchievementUnlocked(achievementId: string) {
  const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId)
  if (!def) return
  const key = `ach-${achievementId}`
  if (hasShown(key)) return
  rememberShown(key)
  enqueue({
    type: 'achievement',
    title: 'Достижение получено',
    body: def.name,
    to: '/achievements',
  })
}

export function notifyDateAvailable(girlId: number) {
  const key = `date-${girlId}`
  if (hasShown(key)) return
  rememberShown(key)
  enqueue({
    type: 'date_available',
    title: 'Доступно свидание',
    body: `С ${girlName(girlId)} можно встретиться`,
    to: '/dates',
    girlId,
  })
}

export function notifyRelationshipLevel2(girlId: number) {
  const key = `lvl2-${girlId}`
  if (hasShown(key)) return
  rememberShown(key)
  enqueue({
    type: 'level_up',
    title: 'Новый уровень отношений',
    body: `${girlName(girlId)} — уровень 2`,
    to: `/relationship/${girlId}`,
    girlId,
  })
}

export function notifySlowReply(girlId: number) {
  const key = `slow-${girlId}`
  if (hasShown(key)) return
  rememberShown(key)
  enqueue({
    type: 'slow_reply',
    title: girlName(girlId),
    body: 'Вы долго не отвечаете',
    to: `/chat/${girlId}`,
    girlId,
  })
}

export function notifyMissesYou(girlId: number) {
  const key = `miss-${girlId}`
  if (hasShown(key)) return
  rememberShown(key)
  enqueue({
    type: 'misses_you',
    title: girlName(girlId),
    body: 'По вам скучают 💜',
    to: `/chat/${girlId}`,
    girlId,
  })
}

/** Сравнить уровни отношений и показать уведомление при переходе на 2. */
export function checkRelationshipLevelUps() {
  const stored = loadRelationshipLevels()
  const next: Record<string, number> = { ...stored }

  for (const girl of GIRLS) {
    const level = getRelationshipLevel(girl.id)
    const prev = stored[String(girl.id)] ?? 1
    if (prev < 2 && level >= 2) {
      notifyRelationshipLevel2(girl.id)
    }
    next[String(girl.id)] = level
  }

  saveRelationshipLevels(next)
}

/** Вызвать после refreshAchievements — показать новые достижения. */
export function notifyNewAchievements(previousIds: Set<string>, currentIds: string[]) {
  for (const id of currentIds) {
    if (!previousIds.has(id)) notifyAchievementUnlocked(id)
  }
}

const SLOW_REPLY_MS = 2 * 60 * 1000
const MISSES_YOU_MS = 4 * 60 * 1000

/**
 * @param activeChatGirlId `null` — можно показывать; `-1` — пользователь в любом чате; `>0` — в чате с этой девушкой.
 */
export function checkUnreadChatReminders(activeChatGirlId: number | null) {
  if (activeChatGirlId !== null) return

  const now = Date.now()

  for (const session of getAwaitingReplySessions()) {
    if (!isGirlChatAwaitingReply(session.girlId)) {
      clearAwaitingReply(session.girlId)
      continue
    }

    const since = session.awaitingReplySince ?? session.lastActivityAt
    const elapsed = now - since

    if (elapsed >= MISSES_YOU_MS) {
      notifyMissesYou(session.girlId)
    } else if (elapsed >= SLOW_REPLY_MS) {
      notifySlowReply(session.girlId)
    }
  }
}

export function resetInAppNotificationsStore() {
  QUEUE.length = 0
  visible.value = null
  dismissing.value = false
  shownKeys.value = new Set()
  try {
    localStorage.removeItem(SHOWN_STORAGE_KEY)
    localStorage.removeItem(LEVEL_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function useInAppNotifications() {
  return {
    visible: computed(() => visible.value),
    dismissing: computed(() => dismissing.value),
    dismiss: dismissCurrent,
    tapNotification: (n: InAppNotification) => {
      dismissCurrent()
      return n.to
    },
  }
}
