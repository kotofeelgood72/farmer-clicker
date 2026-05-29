import { computed, onUnmounted, ref, watch, type ComputedRef } from 'vue'
import { extractPhotoPlaceholder } from '@/domain/dialog/parseDialog'
import type { GirlDialog, DialogNode } from '@/domain/dialog/types'

export type ChatSender = 'them' | 'me'

export interface ChatMessage {
  id: number
  sender: ChatSender
  text: string
  time: string
  image?: string
}

export interface ChatReply {
  id: number
  text: string
  /** Стоимость ответа в алмазах. */
  cost: number
}

/** Максимальная стоимость одного ответа в алмазах. */
export const MAX_REPLY_COST = 7

/**
 * Стабильная стоимость ответа (1–7), разная у каждого варианта в узле диалога.
 */
export function computeReplyCost(nodeIdx: number, choiceIdx: number, text: string): number {
  const seed =
    nodeIdx * 17 +
    choiceIdx * 13 +
    text.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return (Math.abs(seed) % MAX_REPLY_COST) + 1
}

export interface SavedDialogState {
  nodeIndex: number
  affection: number
  messages: ChatMessage[]
  completed?: boolean
}

export function loadDialogState(key: string): SavedDialogState | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as SavedDialogState
  } catch {
    return null
  }
}

export function saveDialogState(key: string, state: SavedDialogState): void {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Проверяет, завершён ли диалог. Сначала смотрит на сохранённый флаг,
 * затем — на сравнение nodeIndex с длиной диалога (для обратной совместимости
 * со старыми сейвами, которые не писали `completed`).
 */
export function isDialogCompleted(key: string, dialog?: GirlDialog): boolean {
  const state = loadDialogState(key)
  if (!state) return false
  if (state.completed) return true
  if (!dialog) return false
  return (
    state.nodeIndex >= dialog.nodes.length &&
    state.messages.at(-1)?.sender === 'me'
  )
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function typingDelayMs(text: string): number {
  const base = 800
  const perChar = 32
  return Math.min(base + text.length * perChar, 3500)
}

function messageFromNode(
  node: DialogNode,
  resolvePhoto?: (photoIndex: number) => string | undefined,
): Pick<ChatMessage, 'text' | 'image'> {
  if (node.photoIndex && resolvePhoto) {
    const image = resolvePhoto(node.photoIndex)
    if (image) return { text: node.text, image }
  }
  return { text: node.text }
}

function seedMessages(
  node: DialogNode,
  resolvePhoto?: (photoIndex: number) => string | undefined,
): ChatMessage[] {
  return [{ id: 1, sender: 'them', time: nowTime(), ...messageFromNode(node, resolvePhoto) }]
}

function enrichPhotoMessages(
  msgs: ChatMessage[],
  dialog: GirlDialog,
  resolvePhoto?: (photoIndex: number) => string | undefined,
): ChatMessage[] {
  if (!resolvePhoto) return msgs
  const photoIndices = dialog.nodes
    .filter((n) => n.photoIndex)
    .map((n) => n.photoIndex!)
  let photoMsgIdx = 0
  return msgs.map((m) => {
    if (m.image) return m
    if (m.sender !== 'them') return m

    const { hasPhoto, explicitIndex, text } = extractPhotoPlaceholder(m.text)
    if (!hasPhoto) return m

    const idx = explicitIndex ?? photoIndices[photoMsgIdx++]
    if (!idx) return { ...m, text }

    const image = resolvePhoto(idx)
    return image ? { ...m, text, image } : { ...m, text }
  })
}

export interface UseDialogChatOptions {
  dialog: ComputedRef<GirlDialog | undefined>
  storageKey: ComputedRef<string>
  resolvePhoto?: (photoIndex: number) => string | undefined
}

export function useDialogChat({ dialog, storageKey, resolvePhoto }: UseDialogChatOptions) {
  const nodeIndex = ref(0)
  const affection = ref(0)
  const messages = ref<ChatMessage[]>([])
  const nextId = ref(2)
  const isTyping = ref(false)
  let typingTimer: ReturnType<typeof setTimeout> | null = null

  function stopTypingTimer() {
    if (typingTimer) {
      clearTimeout(typingTimer)
      typingTimer = null
    }
  }

  function clearTypingTimer() {
    stopTypingTimer()
    isTyping.value = false
  }

  function initFromDialog(d: GirlDialog) {
    const saved = loadDialogState(storageKey.value)
    if (saved && saved.messages.length > 0) {
      nodeIndex.value = saved.nodeIndex
      affection.value = saved.affection
      messages.value = enrichPhotoMessages(saved.messages, d, resolvePhoto)
      nextId.value = Math.max(...saved.messages.map((m) => m.id), 1) + 1
      return
    }

    const first = d.nodes[0]
    if (!first) return

    nodeIndex.value = 0
    affection.value = 0
    messages.value = seedMessages(first, resolvePhoto)
    nextId.value = 2
    persist()
  }

  function reset() {
    clearTypingTimer()
    const d = dialog.value
    if (d) initFromDialog(d)
    else {
      nodeIndex.value = 0
      affection.value = 0
      messages.value = []
    }
  }

  reset()

  watch([storageKey, dialog], () => reset())

  const currentNode = computed(() => dialog.value?.nodes[nodeIndex.value])

  const replies = computed<ChatReply[]>(() => {
    const node = currentNode.value
    if (!node) return []
    return node.choices.map((choice, idx) => ({
      id: idx + 1,
      text: choice.text,
      cost: computeReplyCost(nodeIndex.value, idx, choice.text),
    }))
  })

  const dialogComplete = computed(() => {
    const d = dialog.value
    if (!d) return false
    return nodeIndex.value >= d.nodes.length && messages.value.at(-1)?.sender === 'me'
  })

  const hasReplies = computed(
    () => !isTyping.value && replies.value.length > 0 && !dialogComplete.value,
  )

  function computeCompleted(): boolean {
    const d = dialog.value
    if (!d) return false
    return (
      nodeIndex.value >= d.nodes.length &&
      messages.value.at(-1)?.sender === 'me'
    )
  }

  function persist() {
    saveDialogState(storageKey.value, {
      nodeIndex: nodeIndex.value,
      affection: affection.value,
      messages: messages.value,
      completed: computeCompleted(),
    })
  }

  function pickReply(reply: ChatReply) {
    const d = dialog.value
    if (!d || dialogComplete.value || isTyping.value) return

    const node = currentNode.value
    if (!node) return

    messages.value.push({
      id: nextId.value++,
      sender: 'me',
      text: reply.text,
      time: nowTime(),
    })
    affection.value += node.affection

    const next = d.nodes[nodeIndex.value + 1]
    nodeIndex.value += 1

    if (next) {
      isTyping.value = true
      persist()

      stopTypingTimer()
      typingTimer = setTimeout(() => {
        typingTimer = null
        isTyping.value = false
        messages.value.push({
          id: nextId.value++,
          sender: 'them',
          time: nowTime(),
          ...messageFromNode(next, resolvePhoto),
        })
        persist()
      }, typingDelayMs(next.text))
    } else {
      persist()
    }
  }

  onUnmounted(() => clearTypingTimer())

  return {
    dialog,
    messages,
    replies,
    affection,
    isTyping,
    hasReplies,
    dialogComplete,
    pickReply,
    persist,
    reset,
    nodeIndex,
    currentNode,
  }
}
