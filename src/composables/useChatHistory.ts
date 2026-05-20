import { computed, ref } from 'vue'
import { isGirlChatAwaitingReply } from './useGirlChat'

export interface ChatSession {
  girlId: number
  lastActivityAt: number
  lastPreview?: string
  unread: number
  /** Когда девушка ждёт ответа (последнее сообщение — от неё). */
  awaitingReplySince?: number | null
}

const STORAGE_KEY = 'swipe-chat-history'

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatSession[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (s) => typeof s.girlId === 'number' && typeof s.lastActivityAt === 'number',
    )
  } catch {
    return []
  }
}

function saveSessions(list: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

const sessions = ref<ChatSession[]>(loadSessions())

export { sessions }

export function getAwaitingReplySessions(): ChatSession[] {
  return sessions.value.filter(
    (s) => s.awaitingReplySince != null && s.awaitingReplySince > 0,
  )
}

export function clearAwaitingReply(girlId: number) {
  const idx = sessions.value.findIndex((s) => s.girlId === girlId)
  if (idx < 0) return
  const session = sessions.value[idx]
  if (!session?.awaitingReplySince) return
  sessions.value[idx] = { ...session, awaitingReplySince: null }
  saveSessions(sessions.value)
}

function syncAwaitingReply(girlId: number) {
  const idx = sessions.value.findIndex((s) => s.girlId === girlId)
  if (idx < 0) return
  const session = sessions.value[idx]
  if (!session) return

  if (isGirlChatAwaitingReply(girlId)) {
    if (!session.awaitingReplySince) {
      sessions.value[idx] = { ...session, awaitingReplySince: Date.now() }
      saveSessions(sessions.value)
    }
  } else if (session.awaitingReplySince) {
    sessions.value[idx] = { ...session, awaitingReplySince: null }
    saveSessions(sessions.value)
  }
}

export function resetChatHistoryStore() {
  sessions.value = []
  saveSessions([])
}

const recentChats = computed(() =>
  [...sessions.value].sort((a, b) => b.lastActivityAt - a.lastActivityAt),
)

/**
 * Сколько чатов ждут ответа игрока (последнее сообщение — от девушки,
 * диалог не завершён). Источник правды — сохранённое состояние диалога;
 * перечитывается при изменении `sessions` (любой `touchChat` / `markChatRead`).
 */
const unreadTotal = computed(() =>
  sessions.value.reduce(
    (sum, s) => sum + (isGirlChatAwaitingReply(s.girlId) ? 1 : 0),
    0,
  ),
)

const activeChatGirlIds = computed(
  () => new Set(sessions.value.map((s) => s.girlId)),
)

function hasActiveChat(girlId: number): boolean {
  return activeChatGirlIds.value.has(girlId)
}

function touchChat(
  girlId: number,
  options?: { preview?: string; unreadDelta?: number },
) {
  const now = Date.now()
  const idx = sessions.value.findIndex((s) => s.girlId === girlId)
  const prev = idx >= 0 ? sessions.value[idx] : null
  const unread =
    (prev?.unread ?? 0) + (options?.unreadDelta ?? 0)

  const next: ChatSession = {
    girlId,
    lastActivityAt: now,
    lastPreview: options?.preview ?? prev?.lastPreview,
    unread: Math.max(0, unread),
    awaitingReplySince: prev?.awaitingReplySince ?? null,
  }

  if (idx >= 0) {
    sessions.value[idx] = next
  } else {
    sessions.value.push(next)
  }

  saveSessions(sessions.value)
  syncAwaitingReply(girlId)
}

function markChatRead(girlId: number) {
  const idx = sessions.value.findIndex((s) => s.girlId === girlId)
  const session = sessions.value[idx]
  if (!session) return
  sessions.value[idx] = { ...session, unread: 0 }
  saveSessions(sessions.value)
}

/** Обновить таймер ожидания ответа по сохранённому диалогу. */
export function syncAwaitingReplyForGirl(girlId: number) {
  syncAwaitingReply(girlId)
}

export function syncAllAwaitingReplies() {
  for (const session of sessions.value) {
    syncAwaitingReply(session.girlId)
  }
}

export function formatChatPreview(text: string): string {
  return text.length > 52 ? `${text.slice(0, 52)}…` : text
}

export function formatChatTime(activityAt: number): string {
  const d = new Date(activityAt)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  if (isToday) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()

  if (isYesterday) return 'Вчера'

  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays < 7) return `${diffDays} дн. назад`

  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function formatChatStatus(session: ChatSession): string {
  if (session.lastPreview) {
    return formatChatPreview(session.lastPreview)
  }
  return formatChatTime(session.lastActivityAt)
}

export function useChatHistory() {
  return {
    sessions,
    recentChats,
    activeChatGirlIds,
    unreadTotal,
    hasActiveChat,
    touchChat,
    markChatRead,
  }
}
