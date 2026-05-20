import { computed, ref } from 'vue'
import {
  ACHIEVEMENT_DEFINITIONS,
  CATEGORY_ORDER,
  ACHIEVEMENT_CATEGORIES,
  DEFAULT_PROFILE_GRADIENT,
  PROFILE_ACHIEVEMENT_GRADIENTS,
  type AchievementCategory,
  type AchievementDefinition,
  type AchievementRarity,
} from '@/data/achievements'
import { GIRLS } from '@/data/girls'
import { getGirlDialog } from '@/data/dialogs'
import { girlChatStorageKey, isGirlChatCompleted } from '@/composables/useGirlChat'
import { loadDialogState } from '@/composables/useDialogChat'
import { isMeetingCompleted } from '@/composables/useMeetingChat'
import { REL_LEVEL_MAX } from '@/composables/useRelationshipLevel'

const STORAGE_KEY = 'swipe-achievements-v1'
const MEETING_LOCATION_IDS = [1, 2, 3, 4, 5, 6] as const

export interface AchievementView extends AchievementDefinition {
  unlocked: boolean
}

export interface ProfileAchievementPreview {
  id: string
  label: string
  gradient: string
  unlocked: boolean
}

interface AchievementFlags {
  nightChat: boolean
  fastReply: boolean
  instantMatch: boolean
  premiumOwned: boolean
  energyShopPurchase: boolean
  twoDatesSameDay: boolean
}

interface AchievementProgress {
  unlockedIds: string[]
  diamondsSpent: number
  energySpentSwipe: number
  maxLoginStreak: number
  flags: AchievementFlags
  lastThemMessageAt: number | null
  datesCompletedToday: number
  lastDatesDayKey: string | null
}

interface GameSnapshot {
  messagesSent: number
  maxMessagesInChat: number
  matches: number
  dialogs: number
  dates: number
  profilesSeen: number
  girlsChatted: number
  completedChats: number
  maxAffection: number
  maxChatProgress: number
  maxLoginStreak: number
  diamondsBalance: number
  diamondsSpent: number
  energySpentSwipe: number
  girlsTotal: number
  month: number
  day: number
  flags: AchievementFlags
}

function defaultProgress(): AchievementProgress {
  return {
    unlockedIds: [],
    diamondsSpent: 0,
    energySpentSwipe: 0,
    maxLoginStreak: 1,
    flags: {
      nightChat: false,
      fastReply: false,
      instantMatch: false,
      premiumOwned: false,
      energyShopPurchase: false,
      twoDatesSameDay: false,
    },
    lastThemMessageAt: null,
    datesCompletedToday: 0,
    lastDatesDayKey: null,
  }
}

function loadProgress(): AchievementProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw) as Partial<AchievementProgress>
    return {
      ...defaultProgress(),
      ...parsed,
      unlockedIds: Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds : [],
      flags: { ...defaultProgress().flags, ...parsed.flags },
    }
  } catch {
    return defaultProgress()
  }
}

function saveProgress(p: AchievementProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

const progress = ref<AchievementProgress>(loadProgress())
const tick = ref(0)

function bump() {
  tick.value++
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function countMatches(): number {
  try {
    const raw = localStorage.getItem('swipe-chat-history')
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { girlId?: number }[]
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

function countProfilesSeen(): number {
  try {
    const raw = localStorage.getItem('swipe-player-stats-v1')
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { profilesSeen?: number }
    return Number(parsed.profilesSeen) >= 0 ? Number(parsed.profilesSeen) : 0
  } catch {
    return 0
  }
}

function scanDialogs() {
  let messagesSent = 0
  let maxMessagesInChat = 0
  let dialogs = 0
  let girlsChatted = 0
  let completedChats = 0
  let maxAffection = 0
  let maxChatProgress = 0

  for (const girl of GIRLS) {
    const key = girlChatStorageKey(girl.id)
    const state = loadDialogState(key)
    if (!state?.messages.length) continue

    const mine = state.messages.filter((m) => m.sender === 'me').length
    if (mine > 0) {
      girlsChatted++
      dialogs++
    }
    messagesSent += mine
    maxMessagesInChat = Math.max(maxMessagesInChat, mine)

    if (state.affection > maxAffection) maxAffection = state.affection

    const dialog = getGirlDialog(girl.id)
    if (dialog?.nodes.length) {
      const pct = Math.round((state.nodeIndex / dialog.nodes.length) * 100)
      maxChatProgress = Math.max(maxChatProgress, pct)
    }

    if (isGirlChatCompleted(girl.id)) completedChats++
  }

  return {
    messagesSent,
    maxMessagesInChat,
    dialogs,
    girlsChatted,
    completedChats,
    maxAffection,
    maxChatProgress,
  }
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

function loadDiamondsBalance(): number {
  try {
    const raw = localStorage.getItem('swipe-diamonds-v1')
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { balance?: number }
    return Number.isFinite(Number(parsed.balance)) ? Number(parsed.balance) : 0
  } catch {
    return 0
  }
}

function buildSnapshot(): GameSnapshot {
  const dialogStats = scanDialogs()
  const now = new Date()

  return {
    ...dialogStats,
    matches: countMatches(),
    dates: countDates(),
    profilesSeen: countProfilesSeen(),
    maxLoginStreak: progress.value.maxLoginStreak,
    diamondsBalance: loadDiamondsBalance(),
    diamondsSpent: progress.value.diamondsSpent,
    energySpentSwipe: progress.value.energySpentSwipe,
    girlsTotal: GIRLS.length,
    month: now.getMonth() + 1,
    day: now.getDate(),
    flags: progress.value.flags,
  }
}

function isUnlocked(id: string, ctx: GameSnapshot): boolean {
  const f = ctx.flags

  switch (id) {
    case 'c1':
      return ctx.messagesSent >= 1
    case 'c2':
      return ctx.messagesSent >= 100
    case 'c3':
      return ctx.messagesSent >= 500
    case 'c4':
      return f.nightChat
    case 'c5':
      return f.fastReply
    case 'c6':
      return ctx.maxMessagesInChat >= 50
    case 'c7':
      return ctx.maxAffection >= 300
    case 'c8':
      return ctx.completedChats >= 3

    case 'd1':
      return ctx.dates >= 1
    case 'd2':
      return ctx.dates >= 3
    case 'd3':
      return ctx.maxAffection >= REL_LEVEL_MAX
    case 'd4':
      return ctx.dates >= 5
    case 'd5':
      return ctx.dates >= 10
    case 'd6':
      return ctx.matches >= 1 || f.instantMatch
    case 'd7':
      return ctx.girlsChatted >= 10

    case 'p1':
      return ctx.dialogs >= 1
    case 'p2':
      return ctx.maxChatProgress >= 50
    case 'p3':
      return ctx.completedChats >= 1
    case 'p4':
      return ctx.girlsChatted >= 5
    case 'p5':
      return ctx.girlsChatted >= ctx.girlsTotal
    case 'p6':
      return f.premiumOwned
    case 'p7':
      return ctx.maxLoginStreak >= 7
    case 'p8':
      return ctx.maxLoginStreak >= 30

    case 'sw1':
      return ctx.matches >= 1
    case 'sw2':
      return ctx.matches >= 10
    case 'sw3':
      return ctx.matches >= 10 && ctx.profilesSeen >= 20
    case 'sw4':
      return ctx.profilesSeen >= 50
    case 'sw5':
      return ctx.energySpentSwipe >= 50
    case 'sw6':
      return ctx.matches >= 20

    case 'se1':
      return ctx.completedChats >= 1 && ctx.maxAffection >= 200
    case 'se2':
      return ctx.completedChats >= 2
    case 'se3':
      return ctx.completedChats >= 1 && ctx.maxAffection < 80
    case 'se4':
      return ctx.maxAffection >= REL_LEVEL_MAX && ctx.dates >= 1
    case 'se5':
      return ctx.completedChats >= 5
    case 'se6':
      return f.twoDatesSameDay

    case 'e1':
      return ctx.month === 6
    case 'e2':
      return ctx.month === 1
    case 'e3':
      return ctx.month === 2 && ctx.day === 14
    case 'e4':
      return ctx.month === 10

    case 'm1':
      return ctx.diamondsSpent >= 1
    case 'm2':
      return ctx.diamondsBalance >= 500
    case 'm3':
      return f.energyShopPurchase
    case 'm4':
      return ctx.diamondsSpent >= 200
    case 'm5':
      return ctx.diamondsSpent >= 50

    default:
      return false
  }
}

function syncUnlocked() {
  const ctx = buildSnapshot()
  const set = new Set(progress.value.unlockedIds)
  let changed = false

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (isUnlocked(def.id, ctx) && !set.has(def.id)) {
      set.add(def.id)
      changed = true
    }
  }

  if (changed) {
    progress.value = { ...progress.value, unlockedIds: [...set] }
    saveProgress(progress.value)
  }
  bump()
}

const achievements = computed<AchievementView[]>(() => {
  tick.value
  const set = new Set(progress.value.unlockedIds)
  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    unlocked: set.has(def.id),
  }))
})

const totals = computed(() => {
  const list = achievements.value
  return {
    unlocked: list.filter((a) => a.unlocked).length,
    total: list.length,
  }
})

const profilePreview = computed<ProfileAchievementPreview[]>(() => {
  const list = achievements.value
  const unlocked = list.filter((a) => a.unlocked)
  const locked = list.filter((a) => !a.unlocked)
  const picked: AchievementView[] = []

  for (const a of unlocked.slice(0, 3)) picked.push(a)
  for (const a of locked) {
    if (picked.length >= 4) break
    picked.push(a)
  }

  return picked.map((a) => ({
    id: a.id,
    label: a.unlocked ? a.name : 'Скрыто',
    gradient: a.unlocked
      ? (PROFILE_ACHIEVEMENT_GRADIENTS[a.id] ?? DEFAULT_PROFILE_GRADIENT)
      : '',
    unlocked: a.unlocked,
  }))
})

function refreshAchievements() {
  syncUnlocked()
}

export function recordLoginStreak(streakDay: number) {
  const next = Math.max(progress.value.maxLoginStreak, streakDay)
  if (next !== progress.value.maxLoginStreak) {
    progress.value = { ...progress.value, maxLoginStreak: next }
    saveProgress(progress.value)
  }
  syncUnlocked()
}

function trackThemMessage() {
  progress.value = { ...progress.value, lastThemMessageAt: Date.now() }
}

function trackPlayerMessage() {
  const hour = new Date().getHours()
  const flags = { ...progress.value.flags }
  if (hour >= 22 || hour < 6) flags.nightChat = true

  if (progress.value.lastThemMessageAt) {
    const delta = Date.now() - progress.value.lastThemMessageAt
    if (delta <= 5000) flags.fastReply = true
  }

  progress.value = {
    ...progress.value,
    flags,
    lastThemMessageAt: null,
  }
  saveProgress(progress.value)
  syncUnlocked()
}

function trackDiamondsSpent(amount: number) {
  if (amount <= 0) return
  progress.value = {
    ...progress.value,
    diamondsSpent: progress.value.diamondsSpent + amount,
  }
  saveProgress(progress.value)
  syncUnlocked()
}

function trackSwipeEnergy(amount: number) {
  if (amount <= 0) return
  progress.value = {
    ...progress.value,
    energySpentSwipe: progress.value.energySpentSwipe + amount,
  }
  saveProgress(progress.value)
  syncUnlocked()
}

function trackMatch() {
  const flags = { ...progress.value.flags, instantMatch: true }
  progress.value = { ...progress.value, flags }
  saveProgress(progress.value)
  syncUnlocked()
}

function trackPremiumPurchase() {
  const flags = { ...progress.value.flags, premiumOwned: true }
  progress.value = { ...progress.value, flags }
  saveProgress(progress.value)
  syncUnlocked()
}

function trackEnergyShopPurchase() {
  const flags = { ...progress.value.flags, energyShopPurchase: true }
  progress.value = { ...progress.value, flags }
  saveProgress(progress.value)
  syncUnlocked()
}

function trackDateCompleted() {
  const key = todayKey()
  let datesToday = progress.value.datesCompletedToday
  if (progress.value.lastDatesDayKey !== key) {
    datesToday = 0
  }
  datesToday += 1

  const flags = { ...progress.value.flags }
  if (datesToday >= 2) flags.twoDatesSameDay = true

  progress.value = {
    ...progress.value,
    datesCompletedToday: datesToday,
    lastDatesDayKey: key,
    flags,
  }
  saveProgress(progress.value)
  syncUnlocked()
}

export function resetAchievementsStore() {
  progress.value = defaultProgress()
  saveProgress(progress.value)
  bump()
}

export function useAchievements() {
  return {
    achievements,
    totals,
    profilePreview,
    categories: ACHIEVEMENT_CATEGORIES,
    categoryOrder: CATEGORY_ORDER,
    refreshAchievements,
    trackThemMessage,
    trackPlayerMessage,
    trackDiamondsSpent,
    trackSwipeEnergy,
    trackMatch,
    trackPremiumPurchase,
    trackEnergyShopPurchase,
    trackDateCompleted,
  }
}
