import { getGirlDialog } from '@/data/dialogs'
import { getMeetingDialog } from '@/data/meetings'
import { loadDialogState, isDialogCompleted } from '@/composables/useDialogChat'
import { girlChatStorageKey, isGirlChatCompleted } from '@/composables/useGirlChat'
import { meetingStorageKey } from '@/composables/useMeetingChat'

/** Очков прогресса на один уровень (переписка или свидание). */
export const REL_LEVEL_MAX = 500

export const REL_HEARTS_COUNT = 5

const MEETING_LOCATION_IDS = [1, 2, 3, 4, 5, 6] as const

export interface LevelProgress {
  current: number
  max: number
  percent: number
  complete: boolean
  heartsFilled: number
}

export interface GirlRelationship {
  /** Текущий активный уровень: 1 — переписка, 2 — свидание. */
  overallLevel: 1 | 2
  chat: LevelProgress
  date: LevelProgress & { unlocked: boolean }
}

function heartsFromProgress(current: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(REL_HEARTS_COUNT, Math.round((current / max) * REL_HEARTS_COUNT))
}

function progressFromDialog(
  state: ReturnType<typeof loadDialogState>,
  dialog: { nodes: unknown[] } | undefined,
  completed: boolean,
): LevelProgress {
  const max = REL_LEVEL_MAX
  if (completed) {
    return {
      current: max,
      max,
      percent: 100,
      complete: true,
      heartsFilled: REL_HEARTS_COUNT,
    }
  }

  if (!state || !dialog?.nodes.length) {
    return {
      current: 0,
      max,
      percent: 0,
      complete: false,
      heartsFilled: 0,
    }
  }

  const current = Math.min(
    max,
    Math.round((state.nodeIndex / dialog.nodes.length) * max),
  )
  const percent = Math.min(100, (current / max) * 100)

  return {
    current,
    max,
    percent,
    complete: false,
    heartsFilled: heartsFromProgress(current, max),
  }
}

function getChatProgress(girlId: number): LevelProgress {
  const dialog = getGirlDialog(girlId)
  const key = girlChatStorageKey(girlId)
  const state = loadDialogState(key)
  const complete = isGirlChatCompleted(girlId)
  return progressFromDialog(state, dialog, complete)
}

function getDateProgress(girlId: number): LevelProgress & { unlocked: boolean } {
  const unlocked = isGirlChatCompleted(girlId)
  if (!unlocked) {
    return {
      unlocked: false,
      current: 0,
      max: REL_LEVEL_MAX,
      percent: 0,
      complete: false,
      heartsFilled: 0,
    }
  }

  let bestState: ReturnType<typeof loadDialogState> = null
  let bestDialog: { nodes: unknown[] } | undefined
  let bestCurrent = 0
  let anyComplete = false

  for (const locationId of MEETING_LOCATION_IDS) {
    const key = meetingStorageKey(locationId, girlId)
    const dialog = getMeetingDialog(locationId)
    if (!dialog) continue

    if (isDialogCompleted(key, dialog)) {
      anyComplete = true
      break
    }

    const state = loadDialogState(key)
    if (!state) continue

    const current = Math.round((state.nodeIndex / dialog.nodes.length) * REL_LEVEL_MAX)
    if (current > bestCurrent) {
      bestCurrent = current
      bestState = state
      bestDialog = dialog
    }
  }

  if (anyComplete) {
    const maxed = progressFromDialog(null, { nodes: [1] }, true)
    return { unlocked: true, ...maxed }
  }

  const progress = progressFromDialog(bestState, bestDialog, false)
  return { unlocked: true, ...progress }
}

export function getGirlRelationship(girlId: number): GirlRelationship {
  const chat = getChatProgress(girlId)
  const date = getDateProgress(girlId)
  const overallLevel: 1 | 2 = chat.complete ? 2 : 1

  return { overallLevel, chat, date }
}

/** Уровень 1 или 2 для списков и карточек. */
export function getRelationshipLevel(girlId: number): number {
  return getGirlRelationship(girlId).overallLevel
}

/**
 * Что реально даёт прогресс в текущей игре:
 *
 * Уровень 1 (переписка) — только полоска/сердца по ходу диалога в чате.
 * Пока переписка не завершена, галерея и свидания заблокированы.
 *
 * Завершение переписки → overallLevel 2:
 * - личные фото в профиле девушки;
 * - свидания с ней во вкладке «Свидания» (после isGirlChatCompleted).
 *
 * Уровень 2 (свидание) — прогресс по сценам встреч (meeting/dialog),
 * отдельных «уровней 3» и новых фич за прогресс нет.
 */
export function getNextRelationshipUnlocks(rel: GirlRelationship): string[] {
  if (!rel.chat.complete) {
    return [
      'Личные фото в профиле',
      'Свидания с этой девушкой',
    ]
  }
  return []
}
