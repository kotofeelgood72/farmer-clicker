import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { getGirlDialog } from '@/data/dialogs'
import { getGirlById, getGirlGalleryPhotoByIndex } from '@/data/girls'
import { isDialogCompleted, loadDialogState, useDialogChat } from './useDialogChat'

export type { ChatSender, ChatMessage, ChatReply } from './useDialogChat'

export function girlChatStorageKey(girlId: number): string {
  return `swipe-dialog-v2-${girlId}`
}

export function isGirlChatCompleted(girlId: number): boolean {
  return isDialogCompleted(girlChatStorageKey(girlId), getGirlDialog(girlId))
}

/**
 * Чат «ждёт ответа», если последнее сохранённое сообщение — от девушки,
 * и диалог ещё не завершён. Используется для badge непрочитанного.
 */
export function isGirlChatAwaitingReply(girlId: number): boolean {
  const state = loadDialogState(girlChatStorageKey(girlId))
  if (!state || state.completed) return false
  return state.messages.at(-1)?.sender === 'them'
}

export function useGirlChat(girlIdSource: MaybeRefOrGetter<number>) {
  const girlId = computed(() => toValue(girlIdSource))
  const dialog = computed(() => getGirlDialog(girlId.value))
  const storageKey = computed(() => girlChatStorageKey(girlId.value))
  const girl = computed(() => getGirlById(girlId.value))
  return useDialogChat({
    dialog,
    storageKey,
    resolvePhoto: (index) => getGirlGalleryPhotoByIndex(girl.value, index),
  })
}
