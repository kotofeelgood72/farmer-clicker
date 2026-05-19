<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import BottomNav from '@/components/BottomNav.vue'

import IconSearch from '~icons/solar/magnifer-linear'
import IconClose from '~icons/solar/close-circle-bold'
import {
  formatChatPreview,
  formatChatTime,
  useChatHistory,
} from '@/composables/useChatHistory'
import { GIRLS } from '@/data/girls'

interface ChatListItem {
  id: number
  name: string
  message: string
  time: string
  unread?: number
  color: string
}

const router = useRouter()
const { recentChats, markChatRead } = useChatHistory()

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
      unread: session.unread > 0 ? session.unread : undefined,
      color: girl?.color ?? '#3a3a48',
    }
  }),
)

const unreadTotal = computed(() =>
  recentChats.value.reduce((sum, s) => sum + s.unread, 0),
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
  void router.push('/main')
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
  return GIRLS.find((g) => g.id === id)?.image
}

function onOpenChat(chat: ChatListItem) {
  markChatRead(chat.id)
  void router.push(`/chat/${chat.id}`)
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
    <PageHeader title="Чаты" @back="onBack">
      <template #right>
        <button class="icon-btn" aria-label="поиск" @click="onToggleSearch">
          <IconSearch v-if="!searching" class="head-icon" />
          <IconClose v-else class="head-icon" />
        </button>
      </template>
    </PageHeader>

    <Transition name="slide-search">
      <div v-if="searching" class="search-bar">
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
      </div>
    </Transition>

    <div class="list">
      <button
        v-for="chat in filtered"
        :key="chat.id"
        class="chat"
        @click="onOpenChat(chat)"
      >
        <div class="avatar" :style="{ background: chat.color }">
          <img
            v-if="girlImage(chat.id)"
            :src="girlImage(chat.id)"
            :alt="chat.name"
            class="avatar-img"
          />
          <span v-else class="avatar-letter">{{ chat.name.charAt(0) }}</span>
        </div>

        <div class="body">
          <div class="name">{{ chat.name }}</div>
          <div class="message">{{ chat.message }}</div>
        </div>

        <div class="meta">
          <span v-if="chat.unread" class="badge">{{ chat.unread }}</span>
          <span class="time">{{ chat.time }}</span>
        </div>
      </button>

      <div v-if="!chats.length && !searching" class="empty">
        Пока нет чатов — найдите пару в свайпах
      </div>

      <div v-else-if="searching && !filtered.length" class="empty">
        Ничего не найдено
      </div>
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
  background: #0a0a14;
  color: #fff;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
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
  color: rgba(255, 255, 255, 0.75);
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
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.search-icon {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.55);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  caret-color: #b14bff;
}

.search-input::placeholder { color: rgba(255, 255, 255, 0.4); }

.clear-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.5);
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
  grid-template-columns: 52px 1fr auto;
  gap: 12px;
  align-items: stretch;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 18px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: inherit;
  outline: none;
  width: 100%;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-letter {
  font-size: 22px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
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
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  background: #ff3d5a;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
}

.empty {
  padding: 30px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}
</style>
