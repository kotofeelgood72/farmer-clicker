<script setup lang="ts">
import { computed, onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { useAchievements } from '@/composables/useAchievements'
import type { AchievementCategory, AchievementRarity } from '@/data/achievements'

import IconChat from '~icons/solar/chat-round-dots-bold'
import IconHeart from '~icons/solar/heart-bold'
import IconRanking from '~icons/solar/ranking-bold'
import IconCards from '~icons/solar/heart-shine-bold'
import IconKey from '~icons/solar/key-bold'
import IconGift from '~icons/solar/gift-bold'
import IconShop from '~icons/solar/shop-2-bold'
import IconLock from '~icons/solar/lock-bold'
import IconCheck from '~icons/solar/check-circle-bold'

const router = useRouter()
const {
  achievements,
  totals,
  categories,
  categoryOrder,
  refreshAchievements,
} = useAchievements()

const filter = ref<'all' | AchievementRarity>('all')

onMounted(refreshAchievements)
onActivated(refreshAchievements)

const grouped = computed(() => {
  const map = new Map<AchievementCategory, typeof achievements.value>()
  for (const cat of categoryOrder) map.set(cat, [])
  for (const a of achievements.value) {
    if (filter.value !== 'all' && a.rarity !== filter.value) continue
    map.get(a.category)?.push(a)
  }
  return categoryOrder
    .map((c) => ({
      key: c,
      title: categories[c].title,
      items: map.get(c) || [],
    }))
    .filter((g) => g.items.length > 0)
})

const rarityFilters: { value: 'all' | AchievementRarity; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'common', label: 'Обычные' },
  { value: 'rare', label: 'Редкие' },
  { value: 'epic', label: 'Эпические' },
  { value: 'legendary', label: 'Легендарные' },
]

function onBack() {
  void router.push('/profile')
}

function rarityLabel(r: AchievementRarity) {
  switch (r) {
    case 'common':
      return 'Обычное'
    case 'rare':
      return 'Редкое'
    case 'epic':
      return 'Эпическое'
    case 'legendary':
      return 'Легендарное'
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

      <section v-for="g in grouped" :key="g.key" class="group">
        <h2 class="group-title">{{ g.title }}</h2>
        <div class="list">
          <div
            v-for="a in g.items"
            :key="a.id"
            :class="['ach', `ach--${a.rarity}`, { unlocked: a.unlocked }]"
          >
            <div class="ach-icon">
              <IconChat v-if="a.category === 'chat'" />
              <IconHeart v-else-if="a.category === 'dates'" />
              <IconRanking v-else-if="a.category === 'progress'" />
              <IconCards v-else-if="a.category === 'swipes'" />
              <IconKey v-else-if="a.category === 'secret'" />
              <IconGift v-else-if="a.category === 'event'" />
              <IconShop v-else-if="a.category === 'economy'" />
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
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
}

.page :deep(.page-header) {
  background: var(--header-bg);
  border-bottom: 1px solid var(--border);
}

.counter {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  border: 1px solid rgba(177, 75, 255, 0.25);
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 20px;
}
.scroll::-webkit-scrollbar {
  display: none;
}

.filters {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  margin-bottom: 14px;
  padding: 2px 0;
}
.filters::-webkit-scrollbar {
  display: none;
}

.filter {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  outline: none;
  background: var(--surface);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.filter.active {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: rgba(177, 75, 255, 0.35);
}

.filter--common.active {
  background: #eef0f4;
  border-color: #a0a8b4;
  color: #4a5260;
}

.filter--rare.active {
  background: #e8f4ff;
  border-color: #5fb8ff;
  color: #2a7fc9;
}

.filter--epic.active {
  background: var(--accent-soft);
  border-color: rgba(177, 75, 255, 0.45);
  color: #8b3dd4;
}

.filter--legendary.active {
  background: #fff6e0;
  border-color: #e8b84a;
  color: #b8860b;
}

.group {
  margin-bottom: 18px;
}

.group-title {
  margin: 0 4px 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ach {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  position: relative;
  transition: opacity 0.15s ease;
}

.ach:not(.unlocked) {
  opacity: 0.72;
  background: var(--surface-soft);
}

.ach-icon {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ach-icon svg {
  width: 22px;
  height: 22px;
  color: #fff;
}

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
  0%,
  100% {
    box-shadow: 0 0 0 2px #ffe27a inset, 0 0 18px rgba(255, 210, 61, 0.45);
  }
  50% {
    box-shadow: 0 0 0 2px #fff1b0 inset, 0 0 28px rgba(255, 210, 61, 0.7);
  }
}

.lock-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lock-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.9);
}

.ach-body {
  min-width: 0;
}

.ach-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ach-desc {
  font-size: 11.5px;
  color: var(--text-muted);
  line-height: 1.35;
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
  color: var(--success);
}

.rarity-pill {
  font-size: 9px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.ach--common .rarity-pill {
  background: #eef0f4;
  color: #5a6472;
}

.ach--rare .rarity-pill {
  background: #e3f2ff;
  color: #2a7fc9;
}

.ach--epic .rarity-pill {
  background: #f3ebff;
  color: #7b2fd4;
}

.ach--legendary .rarity-pill {
  background: #fff6e0;
  color: #b8860b;
}

.ach--epic {
  border-color: rgba(177, 75, 255, 0.28);
  background: linear-gradient(180deg, #fdf9ff 0%, var(--surface) 100%);
}

.ach--legendary {
  border-color: rgba(255, 184, 61, 0.45);
  background: linear-gradient(180deg, #fffbf0 0%, var(--surface) 100%);
}

.empty {
  padding: 40px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
