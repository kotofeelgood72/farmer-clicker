<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import CoverImage from '@/components/CoverImage.vue'
import EnterItem from '@/components/EnterItem.vue'

import IconSearch from '~icons/solar/magnifer-linear'
import IconClose from '~icons/solar/close-circle-bold'
import {
  formatChatPreview,
  formatChatTime,
  useChatHistory,
} from '@/composables/useChatHistory'
import { isGirlChatAwaitingReply, isGirlChatCompleted } from '@/composables/useGirlChat'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { GIRLS, getGirlAvatarImage } from '@/data/girls'
import { openChatWithAd } from '@/composables/useAdPlacements'
import { usePremiumAccess } from '@/composables/usePremiumAccess'
import { isPremiumGirlId } from '@/constants/premiumContent'

interface ChatListItem {
  id: number
  name: string
  message: string
  time: string
  unread?: number
  color: string
  completed: boolean
  premiumLocked: boolean
}

const { pushFrom, back, router } = useAppNavigation()
const { recentChats, markChatRead, unreadTotal } = useChatHistory()
const { canAccessGirl, openPremiumShop } = usePremiumAccess()

const chats = computed<ChatListItem[]>(() =>
  recentChats.value.map((session) => {
    const girl = GIRLS.find((g) => g.id === session.girlId)
    return {
      id: session.girlId,
      name: girl?.name ?? '???',
      message: session.lastPreview
        ? formatChatPreview(session.lastPreview)
        : 'Начните общение',
      time: formatChatTime(session.lastActivityAt),
      unread: isGirlChatAwaitingReply(session.girlId) ? 1 : undefined,
      color: girl?.color ?? '#3a3a48',
      completed: isGirlChatCompleted(session.girlId),
      premiumLocked:
        isPremiumGirlId(session.girlId) && !canAccessGirl(session.girlId),
    }
  }),
)

const searching = ref(false)
const query = ref('')
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return chats.value
  return chats.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.message.toLowerCase().includes(q),
  )
})

function onBack() {
  back('/main')
}

async function onToggleSearch() {
  searching.value = !searching.value
  if (searching.value) {
    await nextTick()
    searchInput.value?.focus()
  } else {
    query.value = ''
  }
}

function onClearQuery() {
  query.value = ''
  searchInput.value?.focus()
}

function girlImage(id: number) {
  const girl = GIRLS.find((g) => g.id === id)
  return girl ? getGirlAvatarImage(girl) : undefined
}

function onOpenProfile(girlId: number) {
  void pushFrom(`/relationship/${girlId}`)
}

function onOpenChat(chat: ChatListItem) {
  if (chat.premiumLocked) {
    openPremiumShop()
    return
  }
  markChatRead(chat.id)
  openChatWithAd(() => void pushFrom(`/chat/${chat.id}`))
}

function onNav(tab: 'home' | 'chats' | 'swipe' | 'dates' | 'profile') {
  if (tab === 'chats') return
  if (tab === 'home') void router.push('/main')
  else if (tab === 'swipe') void router.push('/swipe')
  else if (tab === 'dates') void router.push('/dates')
  else if (tab === 'profile') void router.push('/profile')
}
</script>

<template>
  <div class="chats">
    <EnterItem :order="0" solo>
      <PageHeader title="Чаты" @back="onBack">
      <template #right>
        <button class="icon-btn" aria-label="поиск" @click="onToggleSearch">
          <IconSearch v-if="!searching" class="head-icon" />
          <IconClose v-else class="head-icon" />
        </button>
      </template>
      </PageHeader>
    </EnterItem>

    <Transition name="slide-search">
      <EnterItem v-if="searching" :order="1" solo class="search-bar">
        <IconSearch class="search-icon" />
        <input
          ref="searchInput"
          v-model="query"
          class="search-input"
          type="text"
          placeholder="Поиск по чатам..."
        />
        <button
          v-if="query"
          class="clear-btn"
          aria-label="очистить"
          @click="onClearQuery"
        >
          <IconClose class="clear-icon" />
        </button>
      </EnterItem>
    </Transition>

    <div class="list page-enter">
      <EnterItem
        v-for="(chat, i) in filtered"
        :key="chat.id"
        :index="i"
        :base="2"
        tag="article"
        class="chat"
      >
        <button
          type="button"
          class="avatar-btn"
          :aria-label="`Профиль ${chat.name}`"
          @click="onOpenProfile(chat.id)"
        >
          <div class="avatar-wrap">
            <div class="avatar" :style="{ background: chat.color }">
              <CoverImage
                v-if="girlImage(chat.id)"
                :src="girlImage(chat.id)!"
                :alt="chat.name"
                class="avatar-cover"
                image-slot="avatar"
                position="center top"
              />
              <span v-else class="avatar-letter">{{ chat.name.charAt(0) }}</span>
            </div>
            <span class="online-dot" aria-label="онлайн" />
          </div>
        </button>

        <button type="button" class="chat-main" @click="onOpenChat(chat)">
          <div class="body">
            <div class="name">{{ chat.name }}</div>
            <div class="message">{{ chat.message }}</div>
            <span v-if="chat.completed" class="chip-complete">
              ✓ Диалог завершён
            </span>
          </div>

          <div class="meta">
            <span v-if="chat.unread" class="badge">{{ chat.unread }}</span>
            <span class="time">{{ chat.time }}</span>
          </div>
        </button>
      </EnterItem>

      <EnterItem v-if="!chats.length && !searching" :order="2" class="empty">
        Пока нет чатов — найдите пару в свайпах
      </EnterItem>

      <EnterItem v-else-if="searching && !filtered.length" :order="2" class="empty">
        Ничего не найдено
      </EnterItem>
    </div>

    <BottomNav
      active="chats"
      :chats-badge="unreadTotal > 0 ? unreadTotal : undefined"
      @navigate="onNav"
    />
  </div>
</template>

<style scoped>
.chats {
  width: 100%;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.head-icon { width: 20px; height: 20px; }

/* search bar */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 12px 0;
  padding: 0 12px;
  height: 42px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  caret-color: var(--accent);
}

.search-input::placeholder { color: var(--text-dim); }

.clear-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}

.clear-icon { width: 18px; height: 18px; }

/* slide-down transition */
.slide-search-enter-active,
.slide-search-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease, max-height 0.18s ease, margin-top 0.18s ease;
  overflow: hidden;
}
.slide-search-enter-from,
.slide-search-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
  margin-top: 0;
}
.slide-search-enter-to,
.slide-search-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 60px;
}

.list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.list::-webkit-scrollbar { display: none; }

.chat {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 12px;
  align-items: stretch;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  width: 100%;
  box-shadow: var(--shadow-sm);
}

.avatar-btn {
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  cursor: pointer;
  align-self: center;
}

.avatar-btn:active {
  opacity: 0.85;
}

.chat-main {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: stretch;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: inherit;
  min-width: 0;
}

.chat-main:active {
  opacity: 0.92;
}

.avatar-wrap {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.online-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--success);
  border: 2px solid var(--surface);
  box-sizing: border-box;
}

.avatar-cover {
  width: 100%;
  height: 100%;
}

.avatar-letter {
  font-size: 22px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-complete {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(177, 75, 255, 0.16);
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2px;
  line-height: 1.4;
  white-space: nowrap;
}

.meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  min-width: 44px;
}

.badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time {
  font-size: 11px;
  color: var(--text-dim);
  white-space: nowrap;
}

.empty {
  padding: 30px 0;
  text-align: center;
  color: var(--text-dim);
  font-size: 13px;
}
</style>
