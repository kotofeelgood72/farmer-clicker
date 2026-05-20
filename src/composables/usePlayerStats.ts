import { computed, ref } from 'vue'
import { GIRLS } from '@/data/girls'
import { girlChatStorageKey } from '@/composables/useGirlChat'
import { isMeetingCompleted } from '@/composables/useMeetingChat'
import { loadDialogState } from '@/composables/useDialogChat'

const STATS_KEY = 'swipe-player-stats-v1'
const CHAT_HISTORY_KEY = 'swipe-chat-history'
const MEETING_LOCATION_IDS = [1, 2, 3, 4, 5, 6] as const

interface StoredStats {
  profilesSeen: number
}

export interface PlayerStats {
  profiles: number
  matches: number
  dialogs: number
  dates: number
}

function loadStored(): StoredStats {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return { profilesSeen: 0 }
    const parsed = JSON.parse(raw) as Partial<StoredStats>
    const profilesSeen = Number(parsed.profilesSeen)
    return {
      profilesSeen: Number.isFinite(profilesSeen) && profilesSeen >= 0 ? profilesSeen : 0,
    }
  } catch {
    return { profilesSeen: 0 }
  }
}

function saveStored(data: StoredStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

const stored = ref<StoredStats>(loadStored())
const tick = ref(0)

function bump() {
  tick.value++
}

function countMatches(): number {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { girlId?: number }[]
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

function countDialogs(): number {
  let count = 0
  for (const girl of GIRLS) {
    const state = loadDialogState(girlChatStorageKey(girl.id))
    if (state?.messages.some((m) => m.sender === 'me')) count++
  }
  return count
}

function countDates(): number {
  let count = 0
  for (const girl of GIRLS) {
    for (const locationId of MEETING_LOCATION_IDS) {
      if (isMeetingCompleted(locationId, girl.id)) count++
    }
  }
  return count
}

function computeStats(): PlayerStats {
  return {
    profiles: stored.value.profilesSeen,
    matches: countMatches(),
    dialogs: countDialogs(),
    dates: countDates(),
  }
}

const stats = computed<PlayerStats>(() => {
  tick.value
  return computeStats()
})

function recordProfileSeen() {
  stored.value = { profilesSeen: stored.value.profilesSeen + 1 }
  saveStored(stored.value)
  bump()
}

function refresh() {
  stored.value = loadStored()
  bump()
}

export function resetPlayerStatsStore() {
  stored.value = { profilesSeen: 0 }
  saveStored(stored.value)
  bump()
}

export function usePlayerStats() {
  return {
    stats,
    recordProfileSeen,
    refresh,
  }
}
