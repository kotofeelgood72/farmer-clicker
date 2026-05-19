<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import AppTabs from '@/components/AppTabs.vue'

import IconChat from '~icons/solar/chat-round-dots-bold'
import IconHeart from '~icons/solar/heart-bold'
import IconRanking from '~icons/solar/ranking-bold'
import IconCards from '~icons/solar/heart-shine-bold'
import IconKey from '~icons/solar/key-bold'
import IconGift from '~icons/solar/gift-bold'
import IconShop from '~icons/solar/shop-2-bold'
import IconLock from '~icons/solar/lock-bold'
import IconCheck from '~icons/solar/check-circle-bold'

type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
type Category = 'chat' | 'dates' | 'progress' | 'swipes' | 'secret' | 'event' | 'economy'

interface Achievement {
  id: string
  name: string
  desc: string
  category: Category
  rarity: Rarity
  unlocked?: boolean
}

const router = useRouter()

const categories: Record<Category, { title: string; iconKey: Category }> = {
  chat:     { title: 'Общение',         iconKey: 'chat' },
  dates:    { title: 'Свидания',        iconKey: 'dates' },
  progress: { title: 'Прогресс',        iconKey: 'progress' },
  swipes:   { title: 'Свайпы',          iconKey: 'swipes' },
  secret:   { title: 'Секретные',       iconKey: 'secret' },
  event:    { title: 'Ивентовые',       iconKey: 'event' },
  economy:  { title: 'Донат / экономика', iconKey: 'economy' },
}

const order: Category[] = ['chat', 'dates', 'progress', 'swipes', 'secret', 'event', 'economy']

const achievements = ref<Achievement[]>([
  // Общение
  { id: 'c1', category: 'chat', rarity: 'common',    name: 'Первый шаг',        desc: 'Начать первый чат',                 unlocked: true },
  { id: 'c2', category: 'chat', rarity: 'common',    name: 'Общительный',       desc: 'Отправить 100 сообщений',           unlocked: true },
  { id: 'c3', category: 'chat', rarity: 'rare',      name: 'Болтун',            desc: 'Отправить 500 сообщений' },
  { id: 'c4', category: 'chat', rarity: 'rare',      name: 'Ночной чатер',      desc: 'Общаться ночью' },
  { id: 'c5', category: 'chat', rarity: 'rare',      name: 'Скоростной ответ',  desc: 'Ответить за 5 секунд' },
  { id: 'c6', category: 'chat', rarity: 'epic',      name: 'Длинная переписка', desc: '50 сообщений подряд' },
  { id: 'c7', category: 'chat', rarity: 'epic',      name: 'Любимчик',          desc: 'Получить 100 лайков' },
  { id: 'c8', category: 'chat', rarity: 'legendary', name: 'Красноречивый',     desc: 'Выбрать 50 удачных ответов' },

  // Свидания
  { id: 'd1', category: 'dates', rarity: 'common',    name: 'Первое свидание',         desc: 'Открыть первое событие', unlocked: true },
  { id: 'd2', category: 'dates', rarity: 'rare',      name: 'Романтик',                desc: 'Пройти романтическую сцену' },
  { id: 'd3', category: 'dates', rarity: 'rare',      name: 'Идеальная пара',          desc: 'Получить максимальную симпатию' },
  { id: 'd4', category: 'dates', rarity: 'epic',      name: 'Незабываемый вечер',      desc: 'Пройти special date' },
  { id: 'd5', category: 'dates', rarity: 'epic',      name: 'Король флирта',           desc: '10 успешных свиданий' },
  { id: 'd6', category: 'dates', rarity: 'legendary', name: 'Любовь с первого свайпа', desc: 'Моментальный match' },
  { id: 'd7', category: 'dates', rarity: 'legendary', name: 'Сердцеед',                desc: 'Познакомиться с 25 персонажами' },

  // Прогресс
  { id: 'p1', category: 'progress', rarity: 'common',    name: 'Новичок',          desc: 'Достичь 5 уровня', unlocked: true },
  { id: 'p2', category: 'progress', rarity: 'rare',      name: 'Опытный',          desc: 'Достичь 15 уровня' },
  { id: 'p3', category: 'progress', rarity: 'epic',      name: 'Ветеран',          desc: 'Достичь 30 уровня' },
  { id: 'p4', category: 'progress', rarity: 'rare',      name: 'Коллекционер',     desc: 'Открыть 20 персонажей' },
  { id: 'p5', category: 'progress', rarity: 'legendary', name: 'Легенда чатов',    desc: 'Открыть всех персонажей' },
  { id: 'p6', category: 'progress', rarity: 'epic',      name: 'VIP игрок',        desc: 'Купить premium' },
  { id: 'p7', category: 'progress', rarity: 'rare',      name: 'Постоянный игрок', desc: 'Заходить 7 дней подряд' },
  { id: 'p8', category: 'progress', rarity: 'legendary', name: 'Верный фанат',     desc: 'Заходить 30 дней подряд' },

  // Свайпы
  { id: 'sw1', category: 'swipes', rarity: 'common',    name: 'Первый match',     desc: 'Получить первый match', unlocked: true },
  { id: 'sw2', category: 'swipes', rarity: 'rare',      name: 'Магнит симпатий',  desc: '50 матчей' },
  { id: 'sw3', category: 'swipes', rarity: 'epic',      name: 'Идеальный вкус',   desc: '90% успешных свайпов' },
  { id: 'sw4', category: 'swipes', rarity: 'epic',      name: 'Свайп-машина',     desc: 'Сделать 1000 свайпов' },
  { id: 'sw5', category: 'swipes', rarity: 'rare',      name: 'Суперлайк',        desc: 'Использовать super like' },
  { id: 'sw6', category: 'swipes', rarity: 'legendary', name: 'Неотразимый',      desc: 'Получить legendary match' },

  // Секретные
  { id: 'se1', category: 'secret', rarity: 'epic',      name: 'Тайная ветка',         desc: 'Открыть hidden route' },
  { id: 'se2', category: 'secret', rarity: 'epic',      name: 'Ревность',             desc: 'Вызвать ревность персонажа' },
  { id: 'se3', category: 'secret', rarity: 'rare',      name: 'Драматичная концовка', desc: 'Получить bad ending' },
  { id: 'se4', category: 'secret', rarity: 'legendary', name: 'Истинная любовь',      desc: 'Получить true ending' },
  { id: 'se5', category: 'secret', rarity: 'legendary', name: 'Коллекция сердец',     desc: 'Собрать все romance endings' },
  { id: 'se6', category: 'secret', rarity: 'epic',      name: 'Неожиданный поворот',  desc: 'Открыть secret event' },

  // Ивентовые
  { id: 'e1', category: 'event', rarity: 'rare',      name: 'Летний вайб',        desc: 'Пройти summer event' },
  { id: 'e2', category: 'event', rarity: 'rare',      name: 'Новогоднее чудо',    desc: 'Завершить winter event' },
  { id: 'e3', category: 'event', rarity: 'common',    name: 'Валентинка',         desc: 'Зайти 14 февраля' },
  { id: 'e4', category: 'event', rarity: 'epic',      name: 'Хэллоуинская ночь',  desc: 'Пройти spooky dialogue' },

  // Донат
  { id: 'm1', category: 'economy', rarity: 'common',    name: 'Первые алмазы',  desc: 'Заработать gems', unlocked: true },
  { id: 'm2', category: 'economy', rarity: 'epic',      name: 'Богач',          desc: 'Накопить 10 000 валюты' },
  { id: 'm3', category: 'economy', rarity: 'rare',      name: 'Шопоголик',      desc: 'Купить 20 подарков' },
  { id: 'm4', category: 'economy', rarity: 'legendary', name: 'Щедрый',         desc: 'Подарить legendary gift' },
  { id: 'm5', category: 'economy', rarity: 'rare',      name: 'Без ожидания',   desc: 'Ускорить таймер 25 раз' },
])

const filter = ref<'all' | Rarity>('all')

const grouped = computed(() => {
  const map = new Map<Category, Achievement[]>()
  for (const cat of order) map.set(cat, [])
  for (const a of achievements.value) {
    if (filter.value !== 'all' && a.rarity !== filter.value) continue
    map.get(a.category)?.push(a)
  }
  return order
    .map((c) => ({ key: c, title: categories[c].title, items: map.get(c) || [] }))
    .filter((g) => g.items.length > 0)
})

const totals = computed(() => {
  const unlocked = achievements.value.filter((a) => a.unlocked).length
  return { unlocked, total: achievements.value.length }
})

const rarityFilters: { value: 'all' | Rarity; label: string }[] = [
  { value: 'all',       label: 'Все' },
  { value: 'common',    label: 'Обычные' },
  { value: 'rare',      label: 'Редкие' },
  { value: 'epic',      label: 'Эпические' },
  { value: 'legendary', label: 'Легендарные' },
]

function onBack() { void router.push('/profile') }

function rarityLabel(r: Rarity) {
  switch (r) {
    case 'common':    return 'Обычное'
    case 'rare':      return 'Редкое'
    case 'epic':      return 'Эпическое'
    case 'legendary': return 'Легендарное'
  }
}
</script>

<template>
  <div class="page">
    <PageHeader title="Достижения" @back="onBack">
      <template #right>
        <span class="counter">{{ totals.unlocked }}/{{ totals.total }}</span>
      </template>
    </PageHeader>

    <div class="scroll">
      <!-- rarity filter -->
      <div class="filters">
        <button
          v-for="f in rarityFilters"
          :key="f.value"
          :class="['filter', `filter--${f.value}`, { active: filter === f.value }]"
          @click="filter = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <!-- groups -->
      <section v-for="g in grouped" :key="g.key" class="group">
        <h2 class="group-title">{{ g.title }}</h2>
        <div class="list">
          <div
            v-for="a in g.items"
            :key="a.id"
            :class="['ach', `ach--${a.rarity}`, { unlocked: a.unlocked }]"
          >
            <div class="ach-icon">
              <IconChat    v-if="a.category === 'chat'" />
              <IconHeart   v-else-if="a.category === 'dates'" />
              <IconRanking v-else-if="a.category === 'progress'" />
              <IconCards   v-else-if="a.category === 'swipes'" />
              <IconKey     v-else-if="a.category === 'secret'" />
              <IconGift    v-else-if="a.category === 'event'" />
              <IconShop    v-else-if="a.category === 'economy'" />
              <span v-if="!a.unlocked" class="lock-overlay">
                <IconLock class="lock-icon" />
              </span>
            </div>

            <div class="ach-body">
              <div class="ach-name">{{ a.name }}</div>
              <div class="ach-desc">{{ a.desc }}</div>
            </div>

            <div class="ach-status">
              <IconCheck v-if="a.unlocked" class="check" />
              <span class="rarity-pill">{{ rarityLabel(a.rarity) }}</span>
            </div>
          </div>
        </div>
      </section>

      <div v-if="!grouped.length" class="empty">Ничего не найдено</div>
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  background: #0a0a14;
  color: #fff;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
}

.counter {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(177, 75, 255, 0.18);
  border: 1px solid rgba(177, 75, 255, 0.4);
  font-size: 12px;
  font-weight: 700;
  color: #c79bff;
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 20px;
}
.scroll::-webkit-scrollbar { display: none; }

/* filters */
.filters {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  margin-bottom: 14px;
  padding: 2px 0;
}
.filters::-webkit-scrollbar { display: none; }

.filter {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  outline: none;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.filter.active            { background: rgba(255, 255, 255, 0.12); color: #fff; border-color: rgba(255, 255, 255, 0.2); }
.filter--common.active    { background: rgba(160, 168, 180, 0.18); border-color: #a0a8b4; color: #cfd5e0; }
.filter--rare.active      { background: rgba(95, 184, 255, 0.18); border-color: #5fb8ff; color: #5fb8ff; }
.filter--epic.active      { background: rgba(177, 75, 255, 0.2);  border-color: #b14bff; color: #c79bff; }
.filter--legendary.active { background: rgba(255, 210, 61, 0.18); border-color: #ffd23d; color: #ffd23d; }

/* groups */
.group { margin-bottom: 18px; }

.group-title {
  margin: 0 4px 10px;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* achievement card */
.ach {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  transition: opacity 0.15s ease;
}

.ach:not(.unlocked) { opacity: 0.65; }

.ach-icon {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
}

.ach-icon svg { width: 22px; height: 22px; color: #fff; }

/* rarity colored ring + gradient bg */
.ach--common .ach-icon {
  background: linear-gradient(135deg, #4a4f5b 0%, #2a2e36 100%);
  box-shadow: 0 0 0 2px #5a6070 inset;
}

.ach--rare .ach-icon {
  background: linear-gradient(135deg, #2a7fc9 0%, #1f4f80 100%);
  box-shadow:
    0 0 0 2px #5fb8ff inset,
    0 0 14px rgba(95, 184, 255, 0.35);
}

.ach--epic .ach-icon {
  background: linear-gradient(135deg, #b14bff 0%, #5b3df0 100%);
  box-shadow:
    0 0 0 2px #d49bff inset,
    0 0 16px rgba(177, 75, 255, 0.45);
}

.ach--legendary .ach-icon {
  background: linear-gradient(135deg, #ffd23d 0%, #ff7a3d 100%);
  box-shadow:
    0 0 0 2px #ffe27a inset,
    0 0 22px rgba(255, 210, 61, 0.5);
  animation: legendaryPulse 2.4s ease-in-out infinite;
}

@keyframes legendaryPulse {
  0%, 100% { box-shadow: 0 0 0 2px #ffe27a inset, 0 0 18px rgba(255, 210, 61, 0.45); }
  50%      { box-shadow: 0 0 0 2px #fff1b0 inset, 0 0 28px rgba(255, 210, 61, 0.7); }
}

.lock-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lock-icon { width: 18px; height: 18px; color: rgba(255, 255, 255, 0.8); }

.ach-body { min-width: 0; }

.ach-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ach-desc {
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.3;
}

.ach-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 70px;
}

.check {
  width: 16px;
  height: 16px;
  color: #3ddc84;
}

.rarity-pill {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.ach--common    .rarity-pill { background: rgba(160, 168, 180, 0.15); color: #a0a8b4; }
.ach--rare      .rarity-pill { background: rgba(95, 184, 255, 0.15); color: #5fb8ff; }
.ach--epic      .rarity-pill { background: rgba(177, 75, 255, 0.18); color: #c79bff; }
.ach--legendary .rarity-pill { background: rgba(255, 210, 61, 0.18); color: #ffd23d; }

/* legendary border glow on entire row */
.ach--legendary {
  border: 1px solid rgba(255, 210, 61, 0.35);
  background: linear-gradient(180deg, rgba(255, 210, 61, 0.05) 0%, rgba(255, 255, 255, 0.03) 100%);
}

.ach--epic {
  border: 1px solid rgba(177, 75, 255, 0.25);
}

.empty {
  padding: 40px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}
</style>
