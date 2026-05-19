import { computed, onUnmounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { GirlDialog, DialogNode } from '@/domain/dialog/types'
import { getGirlDialog } from '@/data/dialogs'

export type ChatSender = 'them' | 'me'

export interface ChatMessage {
  id: number
  sender: ChatSender
  text: string
  time: string
}

export interface ChatReply {
  id: number
  text: string
  affinity: number
}

interface SavedDialogState {
  nodeIndex: number
  affection: number
  messages: ChatMessage[]
}

function storageKey(girlId: number) {
  return `swipe-dialog-${girlId}`
}

function loadState(girlId: number): SavedDialogState | null {
  try {
    const raw = localStorage.getItem(storageKey(girlId))
    if (!raw) return null
    return JSON.parse(raw) as SavedDialogState
  } catch {
    return null
  }
}

function saveState(girlId: number, state: SavedDialogState) {
  try {
    localStorage.setItem(storageKey(girlId), JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function typingDelayMs(text: string): number {
  const base = 800
  const perChar = 32
  return Math.min(base + text.length * perChar, 3500)
}

function seedMessages(node: DialogNode): ChatMessage[] {
  return [
    {
      id: 1,
      sender: 'them',
      text: node.text,
      time: nowTime(),
    },
  ]
}

export function useGirlChat(girlIdSource: MaybeRefOrGetter<number>) {
  const girlId = computed(() => toValue(girlIdSource))
  const dialog = computed(() => getGirlDialog(girlId.value))

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
    const id = girlId.value
    const saved = loadState(id)
    if (saved && saved.messages.length > 0) {
      nodeIndex.value = saved.nodeIndex
      affection.value = saved.affection
      messages.value = saved.messages
      nextId.value = Math.max(...saved.messages.map((m) => m.id), 1) + 1
      return
    }

    const first = d.nodes[0]
    if (!first) return

    nodeIndex.value = 0
    affection.value = 0
    messages.value = seedMessages(first)
    nextId.value = 2
    persist()
  }

  function resetForGirl() {
    clearTypingTimer()
    const d = dialog.value
    if (d) initFromDialog(d)
    else {
      nodeIndex.value = 0
      affection.value = 0
      messages.value = []
    }
  }

  resetForGirl()

  watch(girlId, () => resetForGirl())

  const currentNode = computed(() => dialog.value?.nodes[nodeIndex.value])

  const replies = computed<ChatReply[]>(() => {
    const node = currentNode.value
    if (!node) return []
    const aff = node.affection
    return [
      { id: 1, text: node.choices[0].text, affinity: aff },
      { id: 2, text: node.choices[1].text, affinity: aff },
    ]
  })

  const dialogComplete = computed(() => {
    const d = dialog.value
    if (!d) return false
    return nodeIndex.value >= d.nodes.length && messages.value.at(-1)?.sender === 'me'
  })

  const hasReplies = computed(
    () => !isTyping.value && replies.value.length > 0 && !dialogComplete.value,
  )

  function persist() {
    saveState(girlId.value, {
      nodeIndex: nodeIndex.value,
      affection: affection.value,
      messages: messages.value,
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
          text: next.text,
          time: nowTime(),
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
    resetForGirl,
  }
}
