<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import AppButton from '@/components/AppButton.vue'

import iconStone from '@/assets/ui/stone.png'
import iconStones from '@/assets/ui/cluster.png'
import iconEnergy from '@/assets/ui/energy.png'
import iconMedalion from '@/assets/ui/medalion.png'
import { PREMIUM_PRODUCT_ID, REWARDED_DIAMONDS_AMOUNT, REWARDED_ENERGY_AMOUNT, SHOP_IAP_PRODUCT_IDS } from '@/constants/game'
import { useAchievements } from '@/composables/useAchievements'
import { useDiamonds } from '@/composables/useDiamonds'
import { useEnergy } from '@/composables/useEnergy'
import { usePortalCurrency } from '@/composables/usePortalCurrency'
import { usePremium } from '@/composables/usePremium'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { useRewardedDiamonds } from '@/composables/useRewardedDiamonds'
import { useRewardedEnergy } from '@/composables/useRewardedEnergy'
import { fetchShopCatalog, purchaseConsumableProduct, type YsdkProduct } from '@/yandex/payments'
import { getIapPriceDisplay, type IapPriceDisplay } from '@/yandex/iapPrice'
import IconCheck from '~icons/solar/check-circle-bold'
import IconAdVideo from '~icons/solar/clapperboard-play-bold'
import EnterItem from '@/components/EnterItem.vue'

type TabKey = 'diamonds' | 'energy' | 'premium'

interface ShopItem {
  id: number
  productId: string
  amount: number
  price: number
  icon: string
  discount?: number
  tab: TabKey
  unit: 'diamonds' | 'energy' | 'premium-lifetime'
  /** Кастомная подпись на карточке (например, премиум навсегда). */
  label?: string
}

const route = useRoute()
const { back, replaceKeepingBack } = useAppNavigation()
const { energy, add: addEnergy } = useEnergy()
const { diamonds, add: addDiamonds } = useDiamonds()
const { isPremium, purchasing, purchasePremium } = usePremium()
const { watchAdForEnergy, watching: watchingEnergyAd } = useRewardedEnergy()
const { watchAdForDiamonds, watching: watchingDiamondsAd } = useRewardedDiamonds()
const watchingAd = computed(() => watchingEnergyAd.value || watchingDiamondsAd.value)
const { trackEnergyShopPurchase } = useAchievements()
const { iconUrl: portalCurrencyIcon, currencyAlt, hasSdkCurrency, syncPortalCurrency } = usePortalCurrency()

const catalogById = ref<Record<string, YsdkProduct>>({})
const premiumCatalog = ref<YsdkProduct | null>(null)

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

const showShopTabs = computed(() => !isPremium.value)

function selectTab(tab: TabKey) {
  if (isPremium.value && tab !== 'premium') return
  activeTab.value = tab
  void replaceKeepingBack({ path: '/shop', query: { tab } })
}

function syncTabFromRoute() {
  if (isPremium.value) {
    activeTab.value = 'premium'
    return
  }
  const tab = parseShopTab(route.query.tab)
  if (tab) activeTab.value = tab
}

function ensurePremiumOnlyShop() {
  if (!isPremium.value) return
  activeTab.value = 'premium'
  if (route.query.tab !== 'premium') {
    void replaceKeepingBack({ path: '/shop', query: { tab: 'premium' } })
  }
}

onMounted(() => {
  syncTabFromRoute()
  ensurePremiumOnlyShop()
  void fetchShopCatalog().then(({ premium, productsById }) => {
    premiumCatalog.value = premium
    catalogById.value = productsById
  })
  void syncPortalCurrency()
})
watch(() => route.query.tab, () => {
  syncTabFromRoute()
  ensurePremiumOnlyShop()
})
watch(isPremium, () => {
  syncTabFromRoute()
  ensurePremiumOnlyShop()
})

function formatDevPrice(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return String(value)
  return n.toLocaleString('ru-RU')
}

function getCatalogPrice(productId: string): IapPriceDisplay | null {
  return getIapPriceDisplay(catalogById.value[productId])
}

/** Цена карточки: из SDK (п. 3.8) или dev-заглушка без SDK. */
function getItemPriceDisplay(item: ShopItem): IapPriceDisplay | null {
  const fromSdk = getCatalogPrice(item.productId)
  if (fromSdk) return fromSdk

  if (import.meta.env.DEV && !hasSdkCurrency.value) {
    return {
      text: formatDevPrice(item.price),
      icon: portalCurrencyIcon.value || undefined,
    }
  }

  return null
}

/** Цена премиума из каталога SDK (п. 3.8 — портальная валюта). */
const premiumPriceDisplay = computed((): IapPriceDisplay | null => {
  const fromSdk = getIapPriceDisplay(premiumCatalog.value)
  if (fromSdk) return fromSdk

  if (import.meta.env.DEV && !hasSdkCurrency.value) {
    const item = allItems.find((i) => i.unit === 'premium-lifetime')
    return item
      ? { text: formatDevPrice(item.price), icon: portalCurrencyIcon.value || undefined }
      : null
  }

  return null
})

const allItems: ShopItem[] = [
  // Алмазы
  {
    id: 11,
    productId: SHOP_IAP_PRODUCT_IDS.diamonds_500,
    amount: 500,
    price: 100,
    icon: iconStone,
    tab: 'diamonds',
    unit: 'diamonds',
  },
  {
    id: 12,
    productId: SHOP_IAP_PRODUCT_IDS.diamonds_250,
    amount: 250,
    price: 50,
    icon: iconStone,
    tab: 'diamonds',
    unit: 'diamonds',
  },
  {
    id: 13,
    productId: SHOP_IAP_PRODUCT_IDS.diamonds_550,
    amount: 550,
    price: 99,
    icon: iconStones,
    discount: 10,
    tab: 'diamonds',
    unit: 'diamonds',
  },
  {
    id: 14,
    productId: SHOP_IAP_PRODUCT_IDS.diamonds_2750,
    amount: 2750,
    price: 385,
    icon: iconStones,
    discount: 30,
    tab: 'diamonds',
    unit: 'diamonds',
  },
  {
    id: 15,
    productId: SHOP_IAP_PRODUCT_IDS.diamonds_6000,
    amount: 6000,
    price: 840,
    icon: iconStones,
    discount: 30,
    tab: 'diamonds',
    unit: 'diamonds',
  },
  {
    id: 16,
    productId: SHOP_IAP_PRODUCT_IDS.diamonds_12000,
    amount: 12000,
    price: 1440,
    icon: iconStones,
    discount: 40,
    tab: 'diamonds',
    unit: 'diamonds',
  },

  // Энергия
  {
    id: 21,
    productId: SHOP_IAP_PRODUCT_IDS.energy_30,
    amount: 30,
    price: 49,
    icon: iconEnergy,
    tab: 'energy',
    unit: 'energy',
  },
  {
    id: 22,
    productId: SHOP_IAP_PRODUCT_IDS.energy_80,
    amount: 80,
    price: 99,
    icon: iconEnergy,
    tab: 'energy',
    unit: 'energy',
  },
  {
    id: 23,
    productId: SHOP_IAP_PRODUCT_IDS.energy_200,
    amount: 200,
    price: 199,
    icon: iconEnergy,
    discount: 15,
    tab: 'energy',
    unit: 'energy',
  },

  // Премиум
  {
    id: 31,
    productId: PREMIUM_PRODUCT_ID,
    amount: 1,
    price: 100,
    icon: iconMedalion,
    tab: 'premium',
    unit: 'premium-lifetime',
  },
]

const premiumBenefits = [
  'Бесплатные ответы в чатах и на свиданиях',
  'Безлимитная энергия на свайпы',
  'Ранний доступ к новым персонажам',
  'Уникальные свидания и особые сцены',
  'Удвоенный ежедневный бонус алмазов',
  'Премиум-значок в профиле',
  'Смена аватара в профиле',
] as const

const items = computed(() => allItems.filter((i) => i.tab === activeTab.value))
const itemPriceById = computed(() => {
  const map: Record<number, IapPriceDisplay | null> = {}
  for (const item of items.value) {
    map[item.id] = getItemPriceDisplay(item)
  }
  return map
})
const premiumItem = computed(() => allItems.find((i) => i.tab === 'premium'))

function formatAmount(item: ShopItem): string {
  if (item.label) return item.label
  return String(item.amount)
}

function onBack() {
  back('/main')
}

function grantShopItem(item: ShopItem) {
  if (item.unit === 'energy') {
    addEnergy(item.amount)
    trackEnergyShopPurchase()
  } else if (item.unit === 'diamonds') {
    addDiamonds(item.amount)
  }
}

async function onBuy(item: ShopItem) {
  if (item.unit === 'premium-lifetime') {
    if (isPremium.value) return
    await purchasePremium()
    return
  }

  const ok = await purchaseConsumableProduct(item.productId)
  if (!ok) return
  grantShopItem(item)
}

function onWatchAdForEnergy() {
  watchAdForEnergy()
}

function onWatchAdForDiamonds() {
  watchAdForDiamonds()
}

function onCtaBuy() {
  if (isPremium.value || purchasing.value) return

  if (activeTab.value === 'premium' && premiumItem.value) {
    void onBuy(premiumItem.value)
    return
  }

  selectTab('premium')
}
</script>

<template>
  <div class="shop">
    <EnterItem :order="0" solo>
      <PageHeader title="Магазин" @back="onBack">
      <template v-if="showShopTabs" #right>
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
    </EnterItem>

    <div class="scroll page-enter">
      <EnterItem v-if="showShopTabs" :order="1" class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab', { active: tab.key === activeTab }]"
          @click="selectTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </EnterItem>

      <div
        v-if="(isPremium || activeTab === 'premium') && premiumItem"
        :key="isPremium ? 'premium-owned' : activeTab"
        class="premium"
      >
        <EnterItem :order="2">
        <button
          type="button"
          class="premium-card"
          :disabled="isPremium || purchasing"
          @click="onBuy(premiumItem)"
        >
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
            <span v-if="isPremium" class="premium-card__owned">Куплено</span>
            <span v-else-if="premiumPriceDisplay" class="iap-price iap-price--on-dark">
              <span class="premium-card__price-value">{{ premiumPriceDisplay.text }}</span>
              <img
                v-if="premiumPriceDisplay.icon"
                :src="premiumPriceDisplay.icon"
                :alt="currencyAlt"
                class="iap-price__coin"
              />
            </span>
          </div>
        </button>
        </EnterItem>

        <EnterItem :order="3" tag="section" class="premium-benefits">
          <h3 class="premium-benefits__title">Преимущества премиума</h3>
          <ul class="premium-benefits__list">
            <li v-for="benefit in premiumBenefits" :key="benefit" class="premium-benefits__item">
              <IconCheck class="premium-benefits__icon" />
              <span>{{ benefit }}</span>
            </li>
          </ul>
        </EnterItem>
      </div>

      <div v-else-if="showShopTabs" :key="activeTab" class="tab-content">
        <button
          v-if="activeTab === 'diamonds' && !isPremium"
          type="button"
          class="rewarded-card"
          :disabled="watchingAd"
          @click="onWatchAdForDiamonds"
        >
          <span class="rewarded-card__shine" aria-hidden="true" />
          <span class="rewarded-card__spark rewarded-card__spark--1" aria-hidden="true">✦</span>
          <span class="rewarded-card__spark rewarded-card__spark--2" aria-hidden="true">✦</span>

          <span class="rewarded-card__icon-wrap">
            <span class="rewarded-card__tag">БОНУС</span>
            <span class="rewarded-card__icon-glow" aria-hidden="true" />
            <span class="rewarded-card__icon-badge" aria-hidden="true">
              <IconAdVideo class="rewarded-card__icon" />
            </span>
          </span>

          <span class="rewarded-card__content">
            <span class="rewarded-card__title">Смотреть рекламу</span>
            <span class="rewarded-card__subtitle">Бесплатно за просмотр</span>
          </span>

          <span class="rewarded-card__loot">
            <span class="rewarded-card__loot-glow" aria-hidden="true" />
            <img :src="iconStone" alt="" class="rewarded-card__energy" />
            <span class="rewarded-card__loot-value">+{{ REWARDED_DIAMONDS_AMOUNT }}</span>
            <span class="rewarded-card__loot-label">алмазов</span>
          </span>
        </button>

        <button
          v-if="activeTab === 'energy' && !isPremium"
          type="button"
          class="rewarded-card"
          :disabled="watchingAd"
          @click="onWatchAdForEnergy"
        >
          <span class="rewarded-card__shine" aria-hidden="true" />
          <span class="rewarded-card__spark rewarded-card__spark--1" aria-hidden="true">✦</span>
          <span class="rewarded-card__spark rewarded-card__spark--2" aria-hidden="true">✦</span>

          <span class="rewarded-card__icon-wrap">
            <span class="rewarded-card__tag">БОНУС</span>
            <span class="rewarded-card__icon-glow" aria-hidden="true" />
            <span class="rewarded-card__icon-badge" aria-hidden="true">
              <IconAdVideo class="rewarded-card__icon" />
            </span>
          </span>

          <span class="rewarded-card__content">
            <span class="rewarded-card__title">Смотреть рекламу</span>
            <span class="rewarded-card__subtitle">Бесплатно за просмотр</span>
          </span>

          <span class="rewarded-card__loot">
            <span class="rewarded-card__loot-glow" aria-hidden="true" />
            <img :src="iconEnergy" alt="" class="rewarded-card__energy" />
            <span class="rewarded-card__loot-value">+{{ REWARDED_ENERGY_AMOUNT }}</span>
            <span class="rewarded-card__loot-label">энергия</span>
          </span>
        </button>

        <div class="grid">
        <button
          v-for="item in items"
          :key="item.id"
          class="card"
          @click="onBuy(item)"
        >
          <span v-if="item.discount" class="discount">-{{ item.discount }}%</span>
          <div class="card-icon">
            <img :src="item.icon" :alt="`${item.amount}`" />
          </div>
          <div class="card-amount">{{ formatAmount(item) }}</div>
          <div v-if="itemPriceById[item.id]" class="card-price iap-price">
            <span class="iap-price__value">{{ itemPriceById[item.id]!.text }}</span>
            <img
              v-if="itemPriceById[item.id]!.icon"
              :src="itemPriceById[item.id]!.icon"
              :alt="currencyAlt"
              class="iap-price__coin"
            />
          </div>
        </button>
        </div>
      </div>
    </div>

    <EnterItem v-if="!isPremium" :order="4" solo class="cta">
      <AppButton variant="danger" :disabled="purchasing" @click="onCtaBuy">
        {{ purchasing ? 'Оформление…' : 'Купить' }}
      </AppButton>
    </EnterItem>
  </div>
</template>

<style scoped>
.shop {
  width: 100%;
  height: 100%;
  background: var(--bg);
  color: var(--text);
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
  gap: calc(12px * var(--ui-density, 1));
}

.premium-card {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(16px * var(--ui-density, 1)) calc(16px * var(--ui-density, 1))
    calc(14px * var(--ui-density, 1));
  border: none;
  border-radius: calc(16px * var(--ui-density, 1));
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
  border-radius: inherit;
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
  width: calc(68px * var(--ui-scale, 1));
  height: calc(68px * var(--ui-scale, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: calc(6px * var(--ui-density, 1));
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
  margin: 0 0 calc(8px * var(--ui-density, 1));
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: calc(6px * var(--ui-density, 1));
  font-size: calc(18px * var(--ui-scale, 1));
  font-weight: 800;
  line-height: var(--lh-compact);
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
  padding: calc(3px * var(--ui-density, 1)) calc(8px * var(--ui-density, 1));
  border-radius: calc(6px * var(--ui-density, 1));
  background: var(--danger);
  color: #fff;
  font-size: calc(12px * var(--ui-scale, 1));
  font-weight: 800;
  line-height: var(--lh-micro);
  box-shadow: 0 3px 10px rgba(255, 61, 90, 0.35);
}

.premium-card__price {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 3px;
  padding: calc(8px * var(--ui-density, 1)) calc(22px * var(--ui-density, 1));
  border-radius: 999px;
  background: var(--gradient-brand-violet);
  box-shadow: 0 6px 18px rgba(91, 61, 240, 0.38);
  color: #fff;
}

.premium-card__price-value {
  font-size: calc(22px * var(--ui-scale, 1));
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}

.iap-price {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.iap-price__value {
  line-height: 1;
}

.iap-price__coin {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.iap-price--on-dark .iap-price__coin {
  width: 22px;
  height: 22px;
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

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rewarded-card {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 14px 16px;
  border: none;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffe45a 0%, #ffb020 42%, #ff8f0a 100%);
  cursor: pointer;
  font-family: inherit;
  color: #fff;
  outline: none;
  overflow: hidden;
  box-shadow:
    0 5px 0 #c45f00,
    0 14px 32px rgba(255, 120, 0, 0.45),
    inset 0 2px 0 rgba(255, 255, 255, 0.55);
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease,
    opacity 0.15s ease;
}

.rewarded-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 22px;
  padding: 3px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 200, 80, 0.35) 100%);
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

.rewarded-card:not(:disabled):active {
  transform: translateY(4px);
  box-shadow:
    0 1px 0 #c45f00,
    0 8px 22px rgba(255, 120, 0, 0.38),
    inset 0 2px 0 rgba(255, 255, 255, 0.45);
}

.rewarded-card:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.rewarded-card__shine {
  position: absolute;
  top: -50%;
  left: -20%;
  width: 55%;
  height: 200%;
  background: linear-gradient(
    105deg,
    transparent 38%,
    rgba(255, 255, 255, 0.55) 48%,
    transparent 58%
  );
  pointer-events: none;
  animation: adCardShine 3.2s ease-in-out infinite;
}

@keyframes adCardShine {
  0%,
  100% {
    transform: translateX(-120%) rotate(12deg);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  45% {
    transform: translateX(280%) rotate(12deg);
    opacity: 1;
  }
  55%,
  100% {
    opacity: 0;
  }
}

.rewarded-card__spark {
  position: absolute;
  font-size: 14px;
  line-height: 1;
  color: #fff;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.9);
  pointer-events: none;
  animation: adSparkle 1.8s ease-in-out infinite;
}

.rewarded-card__spark--1 {
  top: 14px;
  right: 24px;
  animation-delay: 0s;
}

.rewarded-card__spark--2 {
  bottom: 10px;
  left: 50%;
  font-size: 11px;
  animation-delay: 0.9s;
}

@keyframes adSparkle {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.85) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.15) rotate(18deg);
  }
}

.rewarded-card__tag {
  position: absolute;
  top: -4px;
  right: -10px;
  left: auto;
  z-index: 3;
  transform: rotate(-10deg);
  padding: 3px 8px;
  border-radius: 8px;
  background: linear-gradient(180deg, #ff4d8e 0%, #e91e63 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: var(--lh-micro);
  white-space: nowrap;
  box-shadow:
    0 3px 0 rgba(180, 20, 80, 0.55),
    0 5px 12px rgba(255, 77, 142, 0.45);
}

.rewarded-card__icon-wrap {
  position: relative;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rewarded-card__icon-glow {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(177, 75, 255, 0.65) 0%,
    rgba(255, 77, 142, 0.35) 45%,
    transparent 70%
  );
  filter: blur(8px);
  animation: adIconGlow 2s ease-in-out infinite;
}

@keyframes adIconGlow {
  0%,
  100% {
    opacity: 0.75;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.rewarded-card__icon-badge {
  position: relative;
  z-index: 1;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: linear-gradient(180deg, #c77dff 0%, #8b3dff 55%, #6a28d9 100%);
  border: 3px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 5px 0 #4a1899,
    inset 0 2px 0 rgba(255, 255, 255, 0.4);
  animation: adIconBounce 2.4s ease-in-out infinite;
}

@keyframes adIconBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.rewarded-card__icon {
  width: 32px;
  height: 32px;
  color: #fff;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
}

.rewarded-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  text-align: left;
  z-index: 1;
}

.rewarded-card__title {
  font-size: 20px;
  font-weight: 900;
  line-height: var(--lh-compact);
  letter-spacing: 0.01em;
  color: #fff;
  text-shadow:
    0 2px 0 #b35a00,
    0 3px 0 rgba(120, 50, 0, 0.35),
    0 0 14px rgba(255, 240, 160, 0.65);
}

.rewarded-card__subtitle {
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(140, 60, 0, 0.45);
}

.rewarded-card__loot {
  position: relative;
  flex-shrink: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 72px;
  padding: 8px 10px 6px;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f3ebff 100%);
  border: 3px solid #fff;
  box-shadow:
    0 4px 0 rgba(120, 60, 200, 0.28),
    inset 0 0 14px rgba(177, 75, 255, 0.12);
}

.rewarded-card__loot-glow {
  position: absolute;
  inset: -4px;
  border-radius: 18px;
  background: radial-gradient(
    circle at 50% 40%,
    rgba(100, 180, 255, 0.5) 0%,
    transparent 65%
  );
  pointer-events: none;
  animation: adLootGlow 1.6s ease-in-out infinite;
}

@keyframes adLootGlow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.rewarded-card__energy {
  position: relative;
  z-index: 1;
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(60, 140, 255, 0.45));
  animation: adEnergyPop 1.6s ease-in-out infinite;
}

@keyframes adEnergyPop {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.rewarded-card__loot-value {
  position: relative;
  z-index: 1;
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.8));
}

.rewarded-card__loot-label {
  position: relative;
  z-index: 1;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--accent);
}

.premium-card:disabled {
  opacity: 0.85;
  cursor: default;
}

.premium-card__owned {
  font-size: calc(14px * var(--ui-scale, 1));
  font-weight: 800;
  letter-spacing: 0.02em;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.card {
  width: 100%;
  min-width: 0;
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
  line-height: var(--lh-compact);
}

.card-amount--compact {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.card-price {
  margin-top: 2px;
  gap: 5px;
}

.card-price .iap-price__value {
  font-size: 17px;
  font-weight: 800;
  color: var(--danger);
  letter-spacing: -0.02em;
}

.card-price .iap-price__coin {
  width: 22px;
  height: 22px;
}

/* CTA */
.cta {
  padding: 12px 16px 24px;
  display: flex;
  justify-content: center;
}
</style>
