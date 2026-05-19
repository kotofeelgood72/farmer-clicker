import { computed, ref } from 'vue'

export interface ChatSession {
  girlId: number
  lastActivityAt: number
  lastPreview?: string
  unread: number
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

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    /* ignore */
  }
}

const sessions = ref<ChatSession[]>(loadSessions())

const recentChats = computed(() =>
  [...sessions.value].sort((a, b) => b.lastActivityAt - a.lastActivityAt),
)

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
  }

  if (idx >= 0) {
    sessions.value[idx] = next
  } else {
    sessions.value.push(next)
  }

  saveSessions(sessions.value)
}

function markChatRead(girlId: number) {
  const idx = sessions.value.findIndex((s) => s.girlId === girlId)
  const session = sessions.value[idx]
  if (!session) return
  sessions.value[idx] = { ...session, unread: 0 }
  saveSessions(sessions.value)
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
    touchChat,
    markChatRead,
  }
}
