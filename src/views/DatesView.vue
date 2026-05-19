<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import BottomNav from '@/components/BottomNav.vue'

import IconLock from '~icons/solar/lock-bold'

type Tab = 'available' | 'past'

interface DateItem {
  id: number
  title: string
  character: string
  color: string
  status: 'new' | 'available' | 'locked' | 'past'
}

const router = useRouter()

const tab = ref<Tab>('available')

const allDates = ref<DateItem[]>([
  { id: 1, title: 'Прогулка в парке', character: 'Училка', color: '#7d5a3a', status: 'new' },
  { id: 2, title: 'Кофейня',          character: 'Маша',   color: '#5b3a3a', status: 'available' },
  { id: 3, title: 'Кино',             character: 'Аня',    color: '#6e4a3a', status: 'available' },
  { id: 4, title: 'Выставка',         character: 'Катя',   color: '#6b4856', status: 'locked' },
  { id: 5, title: 'Концерт',          character: 'Лиза',   color: '#5a4030', status: 'locked' },
])

const visible = computed(() =>
  tab.value === 'available'
    ? allDates.value.filter((d) => d.status !== 'past')
    : allDates.value.filter((d) => d.status === 'past'),
)

function onBack() { void router.push('/main') }

function onOpen(item: DateItem) {
  if (item.status === 'locked') return
  void router.push(`/date/${item.id}`)
}

function onNav(t: 'home' | 'chats' | 'swipe' | 'dates' | 'profile') {
  if (t === 'dates') return
  if (t === 'home') void router.push('/main')
  else if (t === 'chats') void router.push('/chats')
  else if (t === 'swipe') void router.push('/swipe')
  else if (t === 'profile') void router.push('/profile')
}
</script>

<template>
  <div class="dates">
    <PageHeader title="Свидания" @back="onBack" />

    <div class="scroll">
      <div class="tabs">
        <button
          :class="['tab', { active: tab === 'available' }]"
          @click="tab = 'available'"
        >
          Доступные
        </button>
        <button
          :class="['tab', { active: tab === 'past' }]"
          @click="tab = 'past'"
        >
          Прошедшие
        </button>
      </div>

      <div class="list">
        <button
          v-for="d in visible"
          :key="d.id"
          :class="['card', { locked: d.status === 'locked' }]"
          :disabled="d.status === 'locked'"
          @click="onOpen(d)"
        >
          <div class="thumb" :style="{ background: d.color }">
            <span class="thumb-letter">{{ d.character.charAt(0) }}</span>
          </div>
          <div class="body">
            <div class="title">{{ d.title }}</div>
            <div class="character">{{ d.character }}</div>
          </div>
          <div class="meta">
            <span v-if="d.status === 'new'" class="badge-new">NEW</span>
            <IconLock v-else-if="d.status === 'locked'" class="lock-icon" />
          </div>
        </button>
      </div>

      <div v-if="!visible.length" class="empty">Пока ничего нет</div>
    </div>

    <BottomNav active="dates" :chats-badge="3" @navigate="onNav" />
  </div>
</template>

<style scoped>
.dates {
  width: 100%;
  height: 100%;
  background: #0a0a14;
  color: #fff;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px 12px;
}
.scroll::-webkit-scrollbar { display: none; }

/* Tabs */
.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.tab {
  padding: 10px 16px;
  border-radius: 12px;
  border: none;
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.tab.active {
  background: linear-gradient(135deg, #b14bff 0%, #6e3df0 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(177, 75, 255, 0.25);
}

/* List */
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card {
  display: grid;
  grid-template-columns: 76px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px 10px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: inherit;
  outline: none;
  transition: transform 0.1s ease, opacity 0.15s ease;
}

.card:active:not(.locked) { transform: scale(0.99); }

.card.locked {
  cursor: not-allowed;
  opacity: 0.7;
}

.thumb {
  width: 76px;
  height: 56px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.thumb-letter {
  font-size: 26px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.55);
}

.body {
  min-width: 0;
}

.title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 4px;
}

.character {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

.meta {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
}

.badge-new {
  padding: 4px 10px;
  border-radius: 999px;
  background: #ff3d5a;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.lock-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.55);
}

.empty {
  padding: 40px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}
</style>
