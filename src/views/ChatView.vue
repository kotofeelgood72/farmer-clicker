<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import IconArrowLeft from '~icons/solar/arrow-left-linear'
import { GIRLS } from '@/data/girls'
import { hasGirlDialog } from '@/data/dialogs'
import { getDailyDateByGirlId } from '@/data/dates'
import { useAchievements } from '@/composables/useAchievements'
import { fireConfetti } from '@/composables/useConfetti'
import {
  checkRelationshipLevelUps,
  notifyDateAvailable,
} from '@/composables/useInAppNotifications'
import {
  syncAwaitingReplyForGirl,
  useChatHistory,
} from '@/composables/useChatHistory'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { maybeInterstitialOnReply, runAfterInterstitial } from '@/composables/useAdPlacements'
import { useDiamonds } from '@/composables/useDiamonds'
import { computeReplyCost } from '@/composables/useDialogChat'
import { useGirlChat, type ChatReply } from '@/composables/useGirlChat'
import IconCheckRead from '~icons/solar/check-read-outline'
import iconStone from '@/assets/ui/stone.png'
import QuickReply from '@/components/QuickReply.vue'
import ChatTypingIndicator from '@/components/ChatTypingIndicator.vue'
import chatBgUrl from '@/assets/ui/chat-bg.jpg'
import EnterItem from '@/components/EnterItem.vue'

type Sender = 'them' | 'me'
interface Message {
  id: number
  sender: Sender
  text: string
  time: string
  image?: string
}

interface FallbackReply {
  id: number
  text: string
  cost: number
}

const route = useRoute()
const { pushFrom, back } = useAppNavigation()
const { touchChat, markChatRead } = useChatHistory()
const { diamonds, canSpend, spend } = useDiamonds()
const {
  trackPlayerMessage,
  trackDiamondsSpent,
  trackThemMessage,
  refreshAchievements,
} = useAchievements()

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

const fallbackReplies = ref<FallbackReply[]>([
  {
    id: 1,
    text: 'Конечно, попробую! ✋',
    cost: computeReplyCost(0, 0, 'Конечно, попробую! ✋'),
  },
  {
    id: 2,
    text: 'Я постараюсь изо всех сил.',
    cost: computeReplyCost(0, 1, 'Я постараюсь изо всех сил.'),
  },
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

const chatComplete = computed(
  () => hasDialog.value && dialogChat.dialogComplete.value,
)

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

function messagePreview(m: Message) {
  if (m.image) return '📷 Фото'
  return m.text
}

function syncChatPreview() {
  const last = messages.value.at(-1)
  touchChat(girlId.value, { preview: last ? messagePreview(last) : undefined })
}

function sendReply(reply: ChatReply | FallbackReply) {
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

function onPickReply(reply: ChatReply | FallbackReply) {
  if (!canSpend(reply.cost)) {
    void pushFrom('/shop')
    return
  }
  if (!spend(reply.cost)) {
    void pushFrom('/shop')
    return
  }

  trackDiamondsSpent(reply.cost)
  trackPlayerMessage()
  maybeInterstitialOnReply(() => sendReply(reply))
}

watch(
  () => dialogChat.messages.value.length,
  () => {
    if (!hasDialog.value) return
    const last = dialogChat.messages.value.at(-1)
    if (last?.sender === 'them') {
      trackThemMessage()
      touchChat(girlId.value, { preview: messagePreview(last) })
    }
    syncChatPreview()
    void scrollToBottom()
  },
)

watch(
  () => dialogChat.dialogComplete.value,
  (done, wasDone) => {
    if (!done || wasDone) return
    fireConfetti()
    refreshAchievements()
    notifyDateAvailable(girlId.value)
    checkRelationshipLevelUps()
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

onUnmounted(() => {
  syncAwaitingReplyForGirl(girlId.value)
})

function onBack() {
  const go = () => back('/chats')
  if (chatComplete.value) {
    runAfterInterstitial(go, 'chat_complete', { reviewAfter: true })
  } else {
    go()
  }
}

function onOpenShop() {
  void pushFrom('/shop')
}

function onOpenProfile() {
  void pushFrom(`/relationship/${girlId.value}`)
}

function onGoToDate() {
  const daily = getDailyDateByGirlId(girlId.value)
  runAfterInterstitial(
    () => {
      if (daily) void pushFrom(`/date/${daily.id}`)
      else void pushFrom('/dates')
    },
    'chat_complete_date',
    { reviewAfter: true },
  )
}
</script>

<template>
  <div class="chat-view" :style="{ '--chat-bg': `url(${chatBgUrl})` }">
    <EnterItem :order="0" solo tag="header" class="chat-header">
      <button class="back-btn" aria-label="назад" @click="onBack">
        <IconArrowLeft class="back-icon" />
      </button>

      <button type="button" class="head-user" @click="onOpenProfile">
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
      </button>

      <button type="button" class="diamonds-btn" aria-label="алмазы" @click="onOpenShop">
        <img :src="iconStone" alt="" class="diamonds-btn__icon" />
        <span class="diamonds-btn__value">{{ diamonds }}</span>
      </button>
    </EnterItem>

    <div ref="scroller" class="messages">
      <TransitionGroup name="msg" tag="div" class="msg-list">
        <div v-for="m in messages" :key="m.id" :class="['message', `message--${m.sender}`]">
          <div class="bubble" :class="{ 'bubble--photo': m.image }">
            <p v-if="m.image && m.text" class="bubble-caption">{{ m.text }}</p>
            <img
              v-if="m.image"
              :src="m.image"
              alt=""
              class="bubble-photo"
              loading="lazy"
            />
            <template v-else>{{ m.text }}</template>
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

    <footer v-if="showReplies && !chatComplete" class="replies-bar">
      <QuickReply
        v-for="r in replies"
        :key="r.id"
        :text="r.text"
        :cost="r.cost"
        @pick="onPickReply(r)"
      />
    </footer>

    <div v-if="chatComplete" class="completion-overlay phone-modal-overlay">
      <div class="completion-card modal-surface">
        <div class="completion-emoji">💞</div>
        <div class="completion-title">Скоро на свидание</div>
        <div class="completion-text">
          {{ character.name }} ждёт тебя в реальном мире
        </div>
        <button class="completion-btn" type="button" @click="onGoToDate">
          На свидание с {{ character.name }}
        </button>
        <button class="completion-ghost" type="button" @click="onBack">
          Назад
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--bg);
  color: var(--text);
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
  opacity: 0.18;
  z-index: 0;
  pointer-events: none;
}

.chat-view > * {
  position: relative;
  z-index: 1;
}

/* chat header */
.chat-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 56px 12px 10px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--hairline);
  z-index: 2;
}

.back-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.back-icon { width: 20px; height: 20px; }

.diamonds-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: opacity 0.15s ease;
}

.diamonds-btn:active {
  opacity: 0.8;
}

.diamonds-btn__icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  -webkit-user-drag: none;
}

.diamonds-btn__value {
  font-size: 14px;
  font-weight: 800;
  color: var(--text);
  line-height: 1;
}

.head-user {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  text-align: left;
}

.head-user:active { opacity: 0.7; }

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
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.head-avatar-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--success);
  border: 2px solid var(--header-bg);
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
  color: var(--text);
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
  color: var(--text-muted);
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
  white-space: pre-line;
}

.message--them .bubble {
  background: var(--bubble-them-bg);
  color: var(--bubble-them-text);
  border-bottom-left-radius: 6px;
  box-shadow: var(--shadow-sm);
}

.message--me .bubble {
  background: var(--bubble-me-bg);
  color: var(--bubble-me-text);
  border-bottom-right-radius: 6px;
  box-shadow: 0 4px 14px rgba(177, 75, 255, 0.22);
}

.bubble--photo {
  padding: 4px;
  max-width: min(72vw, 220px);
}

.bubble-caption {
  margin: 0;
  padding: 8px 10px 6px;
  font-size: 14px;
  line-height: 1.35;
}

.bubble-photo {
  display: block;
  width: 100%;
  border-radius: 14px;
  aspect-ratio: 3 / 4;
  object-fit: cover;
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

.message--them .bubble-meta {
  color: var(--text-muted);
}

.message--me .bubble-meta {
  color: rgba(255, 255, 255, 0.92);
}

.check {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* панель ответов — как хедер, всегда внизу экрана */
.replies-bar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 20px;
  background: var(--header-bg);
  border-top: 1px solid var(--hairline);
  z-index: 2;
}

/* completion modal */
.completion-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: completion-fade 0.32s ease-out;
}

@keyframes completion-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.completion-card {
  width: 100%;
  max-width: 320px;
  padding: 28px 24px 24px;
  background: var(--surface);
  border-radius: 22px;
  text-align: center;
  animation: completion-pop 0.4s cubic-bezier(0.22, 1.2, 0.36, 1);
}

@keyframes completion-pop {
  from { opacity: 0; transform: translateY(20px) scale(0.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.completion-emoji {
  font-size: 44px;
  line-height: 1;
  margin-bottom: 14px;
}

.completion-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 6px;
}

.completion-text {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-bottom: 20px;
}

.completion-btn {
  display: inline-block;
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  border: none;
  outline: none;
  background: var(--gradient-brand-violet);
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(177, 75, 255, 0.32);
  transition: transform 0.1s ease;
}

.completion-btn:active { transform: scale(0.98); }

.completion-ghost {
  display: inline-block;
  width: 100%;
  margin-top: 10px;
  padding: 12px 18px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: color 0.15s ease;
}

.completion-ghost:hover { color: var(--text); }
.completion-ghost:active { color: var(--text); }
</style>
