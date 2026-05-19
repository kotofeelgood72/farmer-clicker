<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import AppButton from '@/components/AppButton.vue'

import iconStone from '@/assets/ui/stone.png'
import iconStones from '@/assets/ui/cluster.png'

interface ShopItem {
  id: number
  amount: number
  price: number
  icon: string
  discount?: number
}

const router = useRouter()

const balance = ref(120)

const tabs = ['Алмазы', 'Энергия', 'Подарки', 'Премиум']
const activeTab = ref(0)

const items = ref<ShopItem[]>([
  { id: 1, amount: 100, price: 75, icon: iconStone },
  { id: 2, amount: 250, price: 149, icon: iconStone },
  { id: 3, amount: 550, price: 299, icon: iconStones, discount: 10 },
  { id: 4, amount: 2750, price: 1190, icon: iconStones, discount: 30 },
  { id: 5, amount: 6000, price: 2290, icon: iconStones, discount: 30 },
  { id: 6, amount: 12000, price: 4290, icon: iconStones, discount: 40 },
])

function onBack() {
  void router.push('/main')
}

function onBuy(item: ShopItem) {
  // eslint-disable-next-line no-console
  console.info('[shop] buy', item)
}

function onBuyMore() {
  // eslint-disable-next-line no-console
  console.info('[shop] open premium')
}
</script>

<template>
  <div class="shop">
    <PageHeader title="Магазин" @back="onBack">
      <template #right>
        <div class="balance">
          <img :src="iconStone" alt="алмазы" class="balance-icon" />
          <span>{{ balance }}</span>
        </div>
      </template>
    </PageHeader>

    <div class="scroll">
      <div class="tabs">
        <button
          v-for="(tab, i) in tabs"
          :key="tab"
          :class="['tab', { active: i === activeTab }]"
          @click="activeTab = i"
        >
          {{ tab }}
        </button>
      </div>

      <div class="grid">
        <button v-for="item in items" :key="item.id" class="card" @click="onBuy(item)">
          <span v-if="item.discount" class="discount">-{{ item.discount }}%</span>
          <div class="card-icon">
            <img :src="item.icon" :alt="`${item.amount} алмазов`" />
          </div>
          <div class="card-amount">{{ item.amount }}</div>
          <div class="card-price">{{ item.price }} ₽</div>
        </button>
      </div>
    </div>

    <div class="cta">
      <AppButton variant="violet" @click="onBuyMore">Получить больше алмазов</AppButton>
    </div>
  </div>
</template>

<style scoped>
.shop {
  width: 100%;
  height: 100%;
  background: #0a0a14;
  color: #fff;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
  display: flex;
  flex-direction: column;
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 8px;
}
.scroll::-webkit-scrollbar {
  display: none;
}

.balance {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.balance-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  outline: none;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.tab.active {
  background: linear-gradient(135deg, #b14bff 0%, #8e3dff 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(177, 75, 255, 0.3);
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.card {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 14px 8px 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  outline: none;
  transition:
    transform 0.1s ease,
    background 0.15s ease;
}

.card:active {
  transform: scale(0.97);
}

.discount {
  position: absolute;
  top: -6px;
  right: 8px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #ff3d5a;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.card-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 0 2px;
}

.card-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  -webkit-user-drag: none;
}

.card-amount {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
}

.card-price {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

/* CTA */
.cta {
  padding: 12px 16px 24px;
  display: flex;
  justify-content: center;
}
</style>
