<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import AppButton from '@/components/AppButton.vue'

import iconStone from '@/assets/ui/stone.png'
import iconStones from '@/assets/ui/cluster.png'
import iconEnergy from '@/assets/ui/energy.png'
import iconMedalion from '@/assets/ui/medalion.png'
import { useAchievements } from '@/composables/useAchievements'
import { useDiamonds } from '@/composables/useDiamonds'
import { useEnergy } from '@/composables/useEnergy'
import IconCheck from '~icons/solar/check-circle-bold'

type TabKey = 'diamonds' | 'energy' | 'premium'

interface ShopItem {
  id: number
  amount: number
  price: number
  icon: string
  discount?: number
  tab: TabKey
  unit: 'diamonds' | 'energy' | 'premium-lifetime'
  /** Кастомная подпись на карточке (например, премиум навсегда). */
  label?: string
}

const router = useRouter()
const route = useRoute()
const { energy, add: addEnergy } = useEnergy()
const { diamonds, add: addDiamonds } = useDiamonds()
const { trackPremiumPurchase, trackEnergyShopPurchase } = useAchievements()

function parseShopTab(value: unknown): TabKey | null {
  if (value === 'diamonds' || value === 'energy' || value === 'premium') return value
  return null
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'diamonds', label: 'Алмазы' },
  { key: 'energy', label: 'Энергия' },
  { key: 'premium', label: 'Премиум' },
]
const activeTab = ref<TabKey>(parseShopTab(route.query.tab) ?? 'diamonds')

function selectTab(tab: TabKey) {
  activeTab.value = tab
  void router.replace({ path: '/shop', query: { tab } })
}

function syncTabFromRoute() {
  const tab = parseShopTab(route.query.tab)
  if (tab) activeTab.value = tab
}

onMounted(syncTabFromRoute)
watch(() => route.query.tab, syncTabFromRoute)

const allItems: ShopItem[] = [
  // Алмазы
  { id: 11, amount: 100, price: 75, icon: iconStone, tab: 'diamonds', unit: 'diamonds' },
  { id: 12, amount: 250, price: 149, icon: iconStone, tab: 'diamonds', unit: 'diamonds' },
  { id: 13, amount: 550, price: 299, icon: iconStones, discount: 10, tab: 'diamonds', unit: 'diamonds' },
  { id: 14, amount: 2750, price: 1190, icon: iconStones, discount: 30, tab: 'diamonds', unit: 'diamonds' },
  { id: 15, amount: 6000, price: 2290, icon: iconStones, discount: 30, tab: 'diamonds', unit: 'diamonds' },
  { id: 16, amount: 12000, price: 4290, icon: iconStones, discount: 40, tab: 'diamonds', unit: 'diamonds' },

  // Энергия
  { id: 21, amount: 30, price: 49, icon: iconEnergy, tab: 'energy', unit: 'energy' },
  { id: 22, amount: 80, price: 99, icon: iconEnergy, tab: 'energy', unit: 'energy' },
  { id: 23, amount: 200, price: 199, icon: iconEnergy, discount: 15, tab: 'energy', unit: 'energy' },

  // Премиум
  {
    id: 31,
    amount: 1,
    price: 299,
    icon: iconMedalion,
    tab: 'premium',
    unit: 'premium-lifetime',
  },
]

const premiumBenefits = [
  'Безлимитная энергия на свайпы',
  'Эксклюзивные диалоги и сюжетные ветки',
  'Ранний доступ к новым персонажам',
  'Уникальные свидания и особые сцены',
  'Удвоенный ежедневный бонус алмазов',
  'Премиум-значок в профиле',
  'Без рекламы',
] as const

const items = computed(() => allItems.filter((i) => i.tab === activeTab.value))
const premiumItem = computed(() => allItems.find((i) => i.tab === 'premium'))

function formatAmount(item: ShopItem): string {
  if (item.label) return item.label
  return String(item.amount)
}

function onBack() {
  void router.push('/main')
}

function onBuy(item: ShopItem) {
  if (item.unit === 'energy') {
    addEnergy(item.amount)
    trackEnergyShopPurchase()
  } else if (item.unit === 'diamonds') {
    addDiamonds(item.amount)
  } else if (item.unit === 'premium-lifetime') {
    trackPremiumPurchase()
  }
  console.info('[shop] buy', item)
}

function onBuyMore() {
  selectTab('premium')
}
</script>

<template>
  <div class="shop">
    <PageHeader title="Магазин" @back="onBack">
      <template #right>
        <div class="balances">
          <button type="button" class="balance balance--clickable" @click="selectTab('energy')">
            <img :src="iconEnergy" alt="энергия" class="balance-icon" />
            <span>{{ energy }}</span>
          </button>
          <button type="button" class="balance balance--clickable" @click="selectTab('diamonds')">
            <img :src="iconStone" alt="алмазы" class="balance-icon" />
            <span>{{ diamonds }}</span>
          </button>
        </div>
      </template>
    </PageHeader>

    <div class="scroll">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab', { active: tab.key === activeTab }]"
          @click="selectTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'premium' && premiumItem" class="premium">
        <button type="button" class="premium-card" @click="onBuy(premiumItem)">
          <span class="premium-card__shine" aria-hidden="true" />
          <div class="premium-card__icon-wrap">
            <span class="premium-card__glow" aria-hidden="true" />
            <img :src="premiumItem.icon" alt="премиум" class="premium-card__icon" />
          </div>
          <h3 class="premium-card__title">
            <span class="premium-card__title-main">Премиум</span>
            <span class="premium-card__title-tag">навсегда</span>
          </h3>
          <div class="premium-card__price">
            <span class="premium-card__price-value">{{ premiumItem.price }}</span>
            <span class="premium-card__price-currency">₽</span>
          </div>
        </button>

        <section class="premium-benefits">
          <h3 class="premium-benefits__title">Преимущества премиума</h3>
          <ul class="premium-benefits__list">
            <li v-for="benefit in premiumBenefits" :key="benefit" class="premium-benefits__item">
              <IconCheck class="premium-benefits__icon" />
              <span>{{ benefit }}</span>
            </li>
          </ul>
        </section>
      </div>

      <div v-else class="grid">
        <button v-for="item in items" :key="item.id" class="card" @click="onBuy(item)">
          <span v-if="item.discount" class="discount">-{{ item.discount }}%</span>
          <div class="card-icon">
            <img :src="item.icon" :alt="`${item.amount}`" />
          </div>
          <div class="card-amount">{{ formatAmount(item) }}</div>
          <div class="card-price">{{ item.price }} ₽</div>
        </button>
      </div>
    </div>

    <div class="cta">
      <AppButton variant="violet" @click="onBuyMore">Получить премиум</AppButton>
    </div>
  </div>
</template>

<style scoped>
.shop {
  width: 100%;
  height: 100%;
  background: var(--bg);
  color: var(--text);
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

.balances {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.balance {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.balance--clickable {
  border: none;
  outline: none;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.balance--clickable:active {
  opacity: 0.8;
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
  border: 1px solid var(--border);
  outline: none;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.tab.active {
  background: var(--gradient-brand-violet);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(177, 75, 255, 0.28);
}

/* Premium */
.premium {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.premium-card {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 20px 22px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(155deg, #ffffff 0%, #faf0ff 38%, #fff3f8 100%);
  box-shadow:
    var(--shadow-lg),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  outline: none;
  overflow: hidden;
  transition: transform 0.12s ease;
}

.premium-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(135deg, #b14bff 0%, #ff4d8e 55%, #ffb83d 100%);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
}

.premium-card:active {
  transform: scale(0.98);
}

.premium-card__shine {
  position: absolute;
  top: -40%;
  left: -30%;
  width: 160%;
  height: 160%;
  background: linear-gradient(
    115deg,
    transparent 42%,
    rgba(255, 255, 255, 0.45) 50%,
    transparent 58%
  );
  pointer-events: none;
}

.premium-card__icon-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.premium-card__glow {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 184, 61, 0.55) 0%,
    rgba(177, 75, 255, 0.4) 45%,
    transparent 72%
  );
  filter: blur(10px);
  animation: premiumGlow 2.5s ease-in-out infinite;
}

@keyframes premiumGlow {
  0%,
  100% {
    opacity: 0.85;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}

.premium-card__icon {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 6px 14px rgba(177, 75, 255, 0.35));
  -webkit-user-drag: none;
}

.premium-card__title {
  margin: 0 0 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.15;
  text-align: center;
  letter-spacing: -0.02em;
}

.premium-card__title-main {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.premium-card__title-tag {
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--danger);
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.1;
  box-shadow: 0 3px 10px rgba(255, 61, 90, 0.35);
}

.premium-card__price {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 3px;
  padding: 12px 32px;
  border-radius: 999px;
  background: var(--gradient-brand-violet);
  box-shadow: 0 6px 18px rgba(91, 61, 240, 0.38);
  color: #fff;
}

.premium-card__price-value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}

.premium-card__price-currency {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  opacity: 0.95;
}

.premium-benefits {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.premium-benefits__title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
}

.premium-benefits__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.premium-benefits__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.35;
}

.premium-benefits__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--accent);
  margin-top: 1px;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
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
  box-shadow: var(--shadow-sm);
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
  background: var(--danger);
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
  color: var(--text);
  line-height: 1.15;
}

.card-amount--compact {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.card-price {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

/* CTA */
.cta {
  padding: 12px 16px 24px;
  display: flex;
  justify-content: center;
}
</style>
