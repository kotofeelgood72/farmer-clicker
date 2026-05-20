<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import IconArrowLeft from '~icons/solar/arrow-left-linear'
import { GIRLS } from '@/data/girls'
import { hasGirlDialog } from '@/data/dialogs'
import { useChatHistory } from '@/composables/useChatHistory'
import { useGirlChat, type ChatReply } from '@/composables/useGirlChat'
import IconMenuDots from '~icons/solar/menu-dots-bold'
import IconCheckRead from '~icons/solar/check-read-outline'
import QuickReply from '@/components/QuickReply.vue'
import ChatTypingIndicator from '@/components/ChatTypingIndicator.vue'
import chatBgUrl from '@/assets/ui/chat-bg.png'

type Sender = 'them' | 'me'
interface Message {
  id: number
  sender: Sender
  text: string
  time: string
}

interface QuickReply {
  id: number
  text: string
  affinity: number
}

const router = useRouter()
const route = useRoute()
const { touchChat, markChatRead } = useChatHistory()

const girlId = computed(() => {
  const id = Number(route.params.id)
  return Number.isFinite(id) && id > 0 ? id : 1
})

const girl = computed(() => GIRLS.find((g) => g.id === girlId.value) ?? GIRLS[0]!)

const hasDialog = computed(() => hasGirlDialog(girlId.value))
const dialogChat = useGirlChat(girlId)

const character = ref({
  name: girl.value.name,
  online: true,
  color: girl.value.color,
})

watch(
  girl,
  (g) => {
    character.value = { name: g.name, online: true, color: g.color }
  },
  { immediate: true },
)

const fallbackMessages = ref<Message[]>([
  { id: 1, sender: 'them', text: 'Привет! Ты новенький? 🙂', time: '12:30' },
  { id: 2, sender: 'me', text: 'Да, только недавно начал играть.', time: '12:31' },
])

const fallbackReplies = ref<QuickReply[]>([
  { id: 1, text: 'Конечно, попробую! ✋', affinity: 10 },
  { id: 2, text: 'Я постараюсь изо всех сил.', affinity: 5 },
])

const messages = computed(() =>
  hasDialog.value ? dialogChat.messages.value : fallbackMessages.value,
)

const replies = computed(() =>
  hasDialog.value ? dialogChat.replies.value : fallbackReplies.value,
)

const showReplies = computed(() =>
  hasDialog.value ? dialogChat.hasReplies.value : true,
)

const isTyping = computed(() => hasDialog.value && dialogChat.isTyping.value)

const showOnlineDot = computed(
  () => character.value.online && !isTyping.value,
)

const scroller = useTemplateRef<HTMLDivElement>('scroller')

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function scrollToBottom() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

function syncChatPreview() {
  const last = messages.value.at(-1)
  touchChat(girlId.value, { preview: last?.text })
}

function onPickReply(reply: ChatReply | QuickReply) {
  if (hasDialog.value) {
    dialogChat.pickReply(reply as ChatReply)
    syncChatPreview()
    void scrollToBottom()
    return
  }

  fallbackMessages.value.push({
    id: Date.now(),
    sender: 'me',
    text: reply.text,
    time: nowTime(),
  })
  syncChatPreview()
  void scrollToBottom()
}

watch(
  () => dialogChat.messages.value.length,
  () => {
    if (!hasDialog.value) return
    syncChatPreview()
    void scrollToBottom()
  },
)

watch(isTyping, (typing) => {
  if (!hasDialog.value) {
    if (typing) void scrollToBottom()
    return
  }
  if (typing) {
    touchChat(girlId.value, { preview: 'печатает...' })
  } else {
    syncChatPreview()
  }
  void scrollToBottom()
})

onMounted(() => {
  syncChatPreview()
  markChatRead(girlId.value)
  void scrollToBottom()
})

function onBack() {
  void router.push('/chats')
}

function onMenu() {
  // eslint-disable-next-line no-console
  console.info('[chat] menu')
}
</script>

<template>
  <div class="chat-view" :style="{ '--chat-bg': `url(${chatBgUrl})` }">
    <header class="chat-header">
      <button class="back-btn" aria-label="назад" @click="onBack">
        <IconArrowLeft class="back-icon" />
      </button>

      <div class="head-user">
        <div class="head-avatar-wrap">
          <div class="head-avatar" :style="{ background: character.color }">
            <img
              v-if="girl.image"
              :src="girl.image"
              :alt="character.name"
              class="head-avatar-img"
            />
            <span v-else>{{ character.name.charAt(0) }}</span>
          </div>
          <span v-if="showOnlineDot" class="head-avatar-dot" aria-hidden="true" />
        </div>
        <div class="head-info">
          <div class="head-name">{{ character.name }}</div>
          <div v-if="isTyping" class="head-typing">печатает...</div>
        </div>
      </div>

      <button class="menu-btn" aria-label="меню" @click="onMenu">
        <IconMenuDots class="menu-icon" />
      </button>
    </header>

    <div ref="scroller" class="messages">
      <TransitionGroup name="msg" tag="div" class="msg-list">
        <div v-for="m in messages" :key="m.id" :class="['message', `message--${m.sender}`]">
          <div class="bubble">
            {{ m.text }}
            <span class="bubble-meta">
              <span class="time">{{ m.time }}</span>
              <IconCheckRead v-if="m.sender === 'me'" class="check" />
            </span>
          </div>
        </div>
      </TransitionGroup>
      <ChatTypingIndicator
        v-if="isTyping"
        :avatar-url="girl.image"
        :avatar-color="girl.color"
        :letter="girl.name.charAt(0)"
      />
    </div>

    <div v-if="showReplies" class="replies">
      <QuickReply
        v-for="r in replies"
        :key="r.id"
        :text="r.text"
        :affinity="r.affinity"
        @pick="onPickReply(r)"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #0a0a14;
  color: #fff;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-view::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--chat-bg);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
}

.chat-view > * {
  position: relative;
  z-index: 1;
}

/* chat header */
.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 56px 12px 10px;
  background: #14141f;
  border-bottom: 1px solid #ffffff0c;
}

.back-btn,
.menu-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.back-icon { width: 20px; height: 20px; }

.menu-icon {
  width: 20px;
  height: 20px;
  transform: rotate(90deg);
  color: rgba(255, 255, 255, 0.75);
}

.head-user {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.head-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.head-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
}

.head-avatar-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #3ddc84;
  border: 2px solid #14141f;
  box-sizing: border-box;
}

.head-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.head-info {
  flex: 1;
  min-width: 0;
}

.head-name {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.head-typing {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
}

/* messages */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.messages::-webkit-scrollbar {
  display: none;
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.msg-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.96);
}
.msg-enter-active {
  transition: opacity 0.28s ease-out, transform 0.32s cubic-bezier(0.22, 1.2, 0.36, 1);
}
.msg-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.message {
  transform-origin: bottom left;
}
.message--me {
  transform-origin: bottom right;
}

.message {
  display: flex;
  max-width: 100%;
}

.message--them {
  justify-content: flex-start;
}
.message--me {
  justify-content: flex-end;
}

.bubble {
  max-width: 78%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.35;
  position: relative;
  word-wrap: break-word;
}

.message--them .bubble {
  background: #1d1b2a;
  color: rgba(255, 255, 255, 0.92);
  border-bottom-left-radius: 6px;
}

.message--me .bubble {
  background: #5b3df0;
  color: #fff;
  border-bottom-right-radius: 6px;
}

.bubble-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  margin-left: 8px;
  vertical-align: bottom;
  white-space: nowrap;
  opacity: 0.7;
}

.message--me .bubble-meta {
  color: rgba(255, 255, 255, 0.85);
}

.check {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* quick replies */
.replies {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 12px 22px;
}
</style>
