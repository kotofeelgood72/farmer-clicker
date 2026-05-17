import { defineStore } from 'pinia'
import { playSfx } from '@/audio/sounds'
import drop1 from '@/assets/drop/1.png'
import drop2 from '@/assets/drop/2.png'
import drop3 from '@/assets/drop/3.png'
import drop4 from '@/assets/drop/4.png'
import drop5 from '@/assets/drop/5.png'
import drop6 from '@/assets/drop/6.png'
import drop7 from '@/assets/drop/7.png'
import drop8 from '@/assets/drop/8.png'
import drop9 from '@/assets/drop/9.png'
import drop10 from '@/assets/drop/10.png'
import drop11 from '@/assets/drop/11.png'
import drop12 from '@/assets/drop/12.png'
import drop13 from '@/assets/drop/13.png'
import drop14 from '@/assets/drop/14.png'
import drop15 from '@/assets/drop/15.png'
import drop16 from '@/assets/drop/16.png'
import drop17 from '@/assets/drop/17.png'
import drop18 from '@/assets/drop/18.png'
import drop19 from '@/assets/drop/19.png'
import drop20 from '@/assets/drop/20.png'
import char1 from '@/assets/character/1.png'
import char2 from '@/assets/character/2.png'
import char3 from '@/assets/character/3.png'
import char4 from '@/assets/character/4.png'
import char5 from '@/assets/character/5.png'
import char6 from '@/assets/character/6.png'
import char7 from '@/assets/character/7.png'
import char8 from '@/assets/character/8.png'
import char9 from '@/assets/character/9.png'
import char10 from '@/assets/character/10.png'
import reward1 from '@/assets/rewards/1.png'
import reward2 from '@/assets/rewards/2.png'
import reward3 from '@/assets/rewards/3.png'
import reward4 from '@/assets/rewards/4.png'
import reward5 from '@/assets/rewards/5.png'
import reward6 from '@/assets/rewards/6.png'

export interface Hero {
  id: string
  name: string
  avatar: string
}

export const HEROES: Hero[] = [
  { id: 'h1',  name: 'Воин Торгрим',             avatar: char1  },
  { id: 'h2',  name: 'Лучница Элара',            avatar: char2  },
  { id: 'h3',  name: 'Магистр Орин',             avatar: char3  },
  { id: 'h4',  name: 'Паладин Рейнард',          avatar: char4  },
  { id: 'h5',  name: 'Ассасин Вейл',             avatar: char5  },
  { id: 'h6',  name: 'Берсерк Гром',             avatar: char6  },
  { id: 'h7',  name: 'Некромант Мортис',         avatar: char7  },
  { id: 'h8',  name: 'Жрица Лиора',              avatar: char8  },
  { id: 'h9',  name: 'Инженер Брок',             avatar: char9  },
  { id: 'h10', name: 'Ледяная ведьма Селена',    avatar: char10 },
]

export type Rarity = 'Обычный' | 'Редкий' | 'Эпический' | 'Легендарный' | 'Мифический'

export interface Upgrade {
  id: string
  name: string
  category: 'Кузница' | 'Рабочие' | 'Материалы' | 'Особые'
  level: number
  baseCost: number
  costMul: number
  effect: string
  requiredLevel: number
  effectType: 'click' | 'passive' | 'crit'
  effectValue: number
  apply?: (mult: number) => void
}

// Forge tiers — milestones for unlocking upgrades.
export const FORGE_TIERS = [1, 10, 20, 30, 40] as const

export interface Item {
  id: string
  name: string
  category: 'Оружие' | 'Броня' | 'Аксессуары'
  rarity: Rarity
  cost: number
  income: number
  count: number
  craftTime: number
  image: string
  requiredLevel: number
}

export interface Order {
  id: string
  hero: string
  itemId: string
  rewardGold: number
  rewardDiamonds: number
  timeLeft: number
}

export interface Chest {
  id: string
  type: 'Обычный' | 'Редкий' | 'Эпический'
  count: number
}

export interface Region {
  id: string
  name: string
  unlockCost: number
  bonus: number
  unlocked: boolean
}

export interface Achievement {
  id: string
  name: string
  target: number
  metric: 'clicks' | 'gold' | 'crafts' | 'forgeLevel' | 'uniqueItems'
  done: boolean
  image: string
  description: string
  reward: number
}

interface SaveData {
  gold: number
  diamonds: number
  souls: number
  clicks: number
  totalGoldEarned: number
  totalCrafts: number
  passiveBonusFlat: number
  critBonusFlat: number
  critX2Until: number
  forgeXp: number
  dailyChestAt: number
  upgrades: Record<string, number>
  items: Record<string, number>
  regions: Record<string, boolean>
  achievements: Record<string, boolean>
  chests: Record<string, number>
  settings: { sound: boolean; music: boolean; vibro: boolean; lang: string }
}

const SAVE_KEY = 'blacksmith-clicker-save-v2'

function rng(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const useGameStore = defineStore('game', {
  state: () => ({
    // currencies
    gold: 0,
    diamonds: 0,
    souls: 0,

    // stats
    clicks: 0,
    totalGoldEarned: 0,
    totalCrafts: 0,

    // mechanics — additive bonuses from boosters (upgrades contribute via levels)
    passiveBonusFlat: 0,
    critBonusFlat: 0,
    critX2Until: 0,

    // forge level XP (drives the anvil-level progress bar)
    forgeXp: 0,

    // last click feedback
    lastHit: 0,
    lastCrit: false,

    // boosters
    goldX2Until: 0,
    autoClickUntil: 0,

    // rewarded-ad cooldowns (timestamps; next claim allowed at this ms)
    adFreeBoosterGoldNextAt: 0,
    adFreeBoosterSpeedNextAt: 0,
    adFreeBoosterLuckNextAt: 0,
    adFreeChestNextAt: 0,
    adDiamondsNextAt: 0,

    // collections
    upgrades: [
      // Tier 1 — basic forge
      { id: 'u1',  name: 'Наковальня',           category: 'Кузница', level: 0, baseCost: 15,           costMul: 1.15, effect: '+2 за клик',         requiredLevel: 1,  effectType: 'click',   effectValue: 2     },
      { id: 'u2',  name: 'Меха',                 category: 'Кузница', level: 0, baseCost: 100,          costMul: 1.18, effect: '+1 золото/сек',      requiredLevel: 1,  effectType: 'passive', effectValue: 1     },
      { id: 'u3',  name: 'Угольная печь',        category: 'Кузница', level: 0, baseCost: 800,          costMul: 1.22, effect: '+5 золота/сек',      requiredLevel: 1,  effectType: 'passive', effectValue: 5     },
      // Tier 10 — caves
      { id: 'u4',  name: 'Стойка инструментов',  category: 'Кузница', level: 0, baseCost: 5_000,        costMul: 1.28, effect: '+20 золота/сек',     requiredLevel: 10, effectType: 'passive', effectValue: 20    },
      { id: 'u5',  name: 'Чертёжный стол',       category: 'Кузница', level: 0, baseCost: 25_000,       costMul: 1.32, effect: '+50 золота/сек',     requiredLevel: 10, effectType: 'passive', effectValue: 50    },
      { id: 'u6',  name: 'Закалённая сталь',     category: 'Кузница', level: 0, baseCost: 50_000,       costMul: 1.30, effect: '+10 за клик',        requiredLevel: 10, effectType: 'click',   effectValue: 10    },
      // Tier 20 — magical forge
      { id: 'u7',  name: 'Мифрильное горнило',   category: 'Кузница', level: 0, baseCost: 500_000,      costMul: 1.35, effect: '+200 золота/сек',    requiredLevel: 20, effectType: 'passive', effectValue: 200   },
      { id: 'u8',  name: 'Эфирный молот',        category: 'Кузница', level: 0, baseCost: 250_000,      costMul: 1.32, effect: '+50 за клик',        requiredLevel: 20, effectType: 'click',   effectValue: 50    },
      { id: 'u9',  name: 'Кристалл точности',    category: 'Кузница', level: 0, baseCost: 1_000_000,    costMul: 1.40, effect: '+3% к криту',        requiredLevel: 20, effectType: 'crit',    effectValue: 0.03  },
      // Tier 30 — dragon forge
      { id: 'u10', name: 'Драконья руда',        category: 'Кузница', level: 0, baseCost: 5_000_000,    costMul: 1.36, effect: '+1000 золота/сек',   requiredLevel: 30, effectType: 'passive', effectValue: 1000  },
      { id: 'u11', name: 'Облачный мех',         category: 'Кузница', level: 0, baseCost: 2_500_000,    costMul: 1.34, effect: '+200 за клик',       requiredLevel: 30, effectType: 'click',   effectValue: 200   },
      { id: 'u12', name: 'Зачарованный пресс',   category: 'Кузница', level: 0, baseCost: 25_000_000,   costMul: 1.45, effect: '+5% к криту',        requiredLevel: 30, effectType: 'crit',    effectValue: 0.05  },
      // Tier 40 — heavenly forge
      { id: 'u13', name: 'Небесная наковальня',  category: 'Кузница', level: 0, baseCost: 100_000_000,  costMul: 1.40, effect: '+5000 золота/сек',   requiredLevel: 40, effectType: 'passive', effectValue: 5000  },
      { id: 'u14', name: 'Алмазный молот',       category: 'Кузница', level: 0, baseCost: 50_000_000,   costMul: 1.38, effect: '+1000 за клик',      requiredLevel: 40, effectType: 'click',   effectValue: 1000  },
      { id: 'u15', name: 'Печать титанов',       category: 'Кузница', level: 0, baseCost: 1_000_000_000, costMul: 1.50, effect: '+10% к криту',      requiredLevel: 40, effectType: 'crit',    effectValue: 0.10  },
    ] as Upgrade[],

    items: [
      { id: 'i1',  name: 'Железный меч',         category: 'Оружие',     rarity: 'Обычный',     cost: 25,      income: 1,     count: 0, craftTime: 1,  image: drop1,  requiredLevel: 1  },
      { id: 'i2',  name: 'Стальной меч',         category: 'Оружие',     rarity: 'Обычный',     cost: 80,      income: 3,     count: 0, craftTime: 1,  image: drop2,  requiredLevel: 2  },
      { id: 'i3',  name: 'Эльфийский клинок',    category: 'Оружие',     rarity: 'Редкий',      cost: 300,     income: 10,    count: 0, craftTime: 2,  image: drop3,  requiredLevel: 3  },
      { id: 'i6',  name: 'Кузнечный молот',      category: 'Оружие',     rarity: 'Редкий',      cost: 500,     income: 15,    count: 0, craftTime: 2,  image: drop6,  requiredLevel: 4  },
      { id: 'i7',  name: 'Боевой топор',         category: 'Оружие',     rarity: 'Редкий',      cost: 800,     income: 25,    count: 0, craftTime: 2,  image: drop7,  requiredLevel: 5  },
      { id: 'i10', name: 'Огненный кинжал',      category: 'Оружие',     rarity: 'Редкий',      cost: 600,     income: 18,    count: 0, craftTime: 2,  image: drop10, requiredLevel: 6  },
      { id: 'i5',  name: 'Рунический меч',       category: 'Оружие',     rarity: 'Эпический',   cost: 3000,    income: 70,    count: 0, craftTime: 3,  image: drop5,  requiredLevel: 8  },
      { id: 'i9',  name: 'Магический посох',     category: 'Оружие',     rarity: 'Эпический',   cost: 4000,    income: 90,    count: 0, craftTime: 4,  image: drop9,  requiredLevel: 9  },
      { id: 'i11', name: 'Ледяное копье',        category: 'Оружие',     rarity: 'Эпический',   cost: 6000,    income: 130,   count: 0, craftTime: 4,  image: drop11, requiredLevel: 10 },
      { id: 'i8',  name: 'Королевский щит',      category: 'Броня',      rarity: 'Эпический',   cost: 5000,    income: 110,   count: 0, craftTime: 4,  image: drop8,  requiredLevel: 12 },
      { id: 'i13', name: 'Теневой меч',          category: 'Оружие',     rarity: 'Эпический',   cost: 8000,    income: 180,   count: 0, craftTime: 4,  image: drop13, requiredLevel: 13 },
      { id: 'i16', name: 'Изумрудное кольцо',    category: 'Аксессуары', rarity: 'Эпический',   cost: 7000,    income: 150,   count: 0, craftTime: 4,  image: drop16, requiredLevel: 14 },
      { id: 'i19', name: 'Кристальный лук',      category: 'Оружие',     rarity: 'Эпический',   cost: 9000,    income: 200,   count: 0, craftTime: 5,  image: drop19, requiredLevel: 15 },
      { id: 'i4',  name: 'Легендарный меч',      category: 'Оружие',     rarity: 'Легендарный', cost: 30000,   income: 600,   count: 0, craftTime: 5,  image: drop4,  requiredLevel: 18 },
      { id: 'i12', name: 'Золотой молот короля', category: 'Оружие',     rarity: 'Легендарный', cost: 50000,   income: 900,   count: 0, craftTime: 6,  image: drop12, requiredLevel: 20 },
      { id: 'i14', name: 'Драконий клинок',      category: 'Оружие',     rarity: 'Легендарный', cost: 60000,   income: 1100,  count: 0, craftTime: 6,  image: drop14, requiredLevel: 22 },
      { id: 'i17', name: 'Амулет солнца',        category: 'Аксессуары', rarity: 'Легендарный', cost: 70000,   income: 1300,  count: 0, craftTime: 6,  image: drop17, requiredLevel: 24 },
      { id: 'i18', name: 'Демонический меч',     category: 'Оружие',     rarity: 'Легендарный', cost: 80000,   income: 1500,  count: 0, craftTime: 7,  image: drop18, requiredLevel: 26 },
      { id: 'i15', name: 'Мифический арбалет',   category: 'Оружие',     rarity: 'Мифический',  cost: 500000,  income: 8000,  count: 0, craftTime: 10, image: drop15, requiredLevel: 32 },
      { id: 'i20', name: 'Алмазный меч',         category: 'Оружие',     rarity: 'Мифический',  cost: 750000,  income: 12000, count: 0, craftTime: 10, image: drop20, requiredLevel: 38 },
    ] as Item[],

    orders: [] as Order[],

    chests: [
      { id: 'c1', type: 'Обычный', count: 0 },
      { id: 'c2', type: 'Редкий', count: 0 },
      { id: 'c3', type: 'Эпический', count: 0 },
    ] as Chest[],

    // daily Обычный chest: timestamp of last grant (0 = never)
    dailyChestAt: 0,

    regions: [
      { id: 'r1', name: 'Зелёные холмы', unlockCost: 0, bonus: 1.0, unlocked: true },
      { id: 'r2', name: 'Горные перевалы', unlockCost: 10000, bonus: 1.5, unlocked: false },
      { id: 'r3', name: 'Пустыня древних', unlockCost: 100000, bonus: 2.0, unlocked: false },
      { id: 'r4', name: 'Ледяные земли', unlockCost: 1000000, bonus: 3.0, unlocked: false },
      { id: 'r5', name: 'Вулкан кузнецов', unlockCost: 10000000, bonus: 5.0, unlocked: false },
    ] as Region[],

    achievements: [
      { id: 'a1', name: 'Первые шаги',    description: 'Улучшите наковальню до 10 уровня', target: 10,        metric: 'forgeLevel',  reward: 100, done: false, image: reward1 },
      { id: 'a2', name: 'Кузнец',         description: 'Создайте 100 предметов',            target: 100,       metric: 'crafts',      reward: 200, done: false, image: reward2 },
      { id: 'a3', name: 'Мастер кликов',  description: 'Сделайте 10 000 кликов',            target: 10_000,    metric: 'clicks',      reward: 150, done: false, image: reward3 },
      { id: 'a4', name: 'Богатство',      description: 'Заработайте 1 000 000 монет',       target: 1_000_000, metric: 'gold',        reward: 250, done: false, image: reward4 },
      { id: 'a5', name: 'Коллекционер',   description: 'Откройте 20 чертежей',               target: 20,        metric: 'uniqueItems', reward: 200, done: false, image: reward5 },
      { id: 'a6', name: 'Легенда',        description: 'Прокачайте наковальню до 38 уровня', target: 38,        metric: 'forgeLevel',  reward: 500, done: false, image: reward6 },
    ] as Achievement[],

    settings: { sound: true, music: true, vibro: false, lang: 'RU' },

    // fractional passive accumulator (not persisted)
    passiveAcc: 0,
  }),

  getters: {
    currentRegion(state): Region {
      let r: Region = state.regions[0]!
      for (const reg of state.regions) if (reg.unlocked) r = reg
      return r
    },
    forgeLevelDisplay(state): number {
      // Inverse of cumulativeXp(N) = 50 * N * (N-1):
      // N = floor(0.5 + sqrt(0.25 + xp / 50))
      return Math.max(1, Math.floor(0.5 + Math.sqrt(0.25 + state.forgeXp / 50)))
    },
    forgeXpProgress(state): { current: number; max: number; pct: number } {
      const cumulative = (n: number) => 50 * n * (n - 1)
      const lvl = Math.max(1, Math.floor(0.5 + Math.sqrt(0.25 + state.forgeXp / 50)))
      const xpStart = cumulative(lvl)
      const xpNext = cumulative(lvl + 1)
      const current = Math.max(0, state.forgeXp - xpStart)
      const max = xpNext - xpStart
      return { current, max, pct: (current / max) * 100 }
    },
    soulMultiplier(state): number {
      return 1 + state.souls * 0.05
    },
    incomeMultiplier(): number {
      const region = (this as any).currentRegion as Region
      const boostX2 = Date.now() < (this as any).goldX2Until ? 2 : 1
      return region.bonus * (this as any).soulMultiplier * boostX2
    },
    baseClick(state): number {
      let total = 1
      for (const u of state.upgrades) {
        if (u.effectType === 'click') total += u.level * u.effectValue
      }
      return total
    },
    passive(state): number {
      let total = state.passiveBonusFlat
      for (const u of state.upgrades) {
        if (u.effectType === 'passive') total += u.level * u.effectValue
      }
      return total
    },
    critChance(state): number {
      let bonus = 0
      for (const u of state.upgrades) {
        if (u.effectType === 'crit') bonus += u.level * u.effectValue
      }
      const base = 0.05 + state.critBonusFlat + bonus
      const boost = Date.now() < state.critX2Until ? 2 : 1
      return Math.min(1, base * boost)
    },
    critMul(): number {
      return 5
    },
    clickPower(): number {
      const base = (this as any).baseClick as number
      const m = (this as any).incomeMultiplier as number
      return Math.floor(base * m)
    },
    passivePerSec(state): number {
      const itemsIncome = state.items.reduce((a, it) => a + it.income * it.count, 0)
      const p = (this as any).passive as number
      const m = (this as any).incomeMultiplier as number
      return Math.floor((p + itemsIncome) * m)
    },
    upgradeCost: () => (u: Upgrade) => Math.floor(u.baseCost * Math.pow(u.costMul, u.level)),
    dailyChestReadyAt(state): number {
      // Timestamp when the next free Обычный chest becomes available.
      // 0 if it's ready right now (or never claimed yet).
      if (state.dailyChestAt === 0) return 0
      return state.dailyChestAt + 24 * 3600 * 1000
    },
    // XP awarded for completing an order — generous, scales with item level.
    // At item lvl 1: 150 XP (level 1→2 is 100, so first order pops a level instantly).
    // At item lvl 10: 600 XP (10→11 is 1000 → ~2 orders).
    // At item lvl 38: 2000 XP (38→39 is 3800 → ~2 orders).
    orderXp: () => (itemLevel: number) => 100 + itemLevel * 50,
  },

  actions: {
    click() {
      this.clicks++
      const isCrit = Math.random() < this.critChance
      let gain = this.clickPower
      if (isCrit) gain = Math.floor(gain * this.critMul)
      this.addGold(gain)
      this.lastHit = gain
      this.lastCrit = isCrit
      playSfx(isCrit ? 'critical' : 'hammer')
      this.checkAchievements()
    },

    gainForgeXp(amount: number) {
      if (amount <= 0) return
      this.forgeXp += amount
    },

    addGold(amount: number) {
      this.gold += amount
      this.totalGoldEarned += amount
    },

    buyUpgrade(id: string) {
      const u = this.upgrades.find((x) => x.id === id)
      if (!u) return
      if (this.forgeLevelDisplay < u.requiredLevel) return
      const cost = this.upgradeCost(u)
      if (this.gold < cost) return
      this.gold -= cost
      u.level++
    },

    craft(id: string) {
      const it = this.items.find((x) => x.id === id)
      if (!it) return
      if (this.forgeLevelDisplay < it.requiredLevel) return
      if (this.gold < it.cost) return
      this.gold -= it.cost
      it.count++
      this.totalCrafts++
      this.checkAchievements()
    },

    spawnOrder() {
      if (this.orders.length >= 3) return
      // only items the player has unlocked by forge level
      const lvl = this.forgeLevelDisplay
      const unlocked = this.items.filter((i) => i.requiredLevel <= lvl)
      if (unlocked.length === 0) return
      const owned = unlocked.filter((i) => i.count > 0)
      const pool = owned.length > 0 ? owned : unlocked
      const it = pool[rng(0, pool.length - 1)]!
      const hero = HEROES[rng(0, HEROES.length - 1)]!
      const order: Order = {
        id: 'o' + Date.now() + '-' + rng(0, 999),
        hero: hero.id,
        itemId: it.id,
        rewardGold: it.cost * 3,
        rewardDiamonds: rng(0, 2),
        timeLeft: 60,
      }
      const wasEmpty = this.orders.length === 0
      this.orders.push(order)
      // Only fanfare on the 0 -> 1+ transition, not on every fill-up.
      if (wasEmpty) playSfx('order')
    },

    completeOrder(id: string, rewardMul = 1) {
      const o = this.orders.find((x) => x.id === id)
      if (!o) return
      const it = this.items.find((x) => x.id === o.itemId)
      if (!it || it.count <= 0) return
      it.count--
      this.addGold(o.rewardGold * rewardMul)
      this.diamonds += o.rewardDiamonds * rewardMul
      this.gainForgeXp(this.orderXp(it.requiredLevel))
      // small chance for a chest
      if (Math.random() < 0.3) {
        const c = this.chests[rng(0, 2)]
        if (c) c.count++
      }
      this.orders = this.orders.filter((x) => x.id !== id)
      // immediately spawn a follow-up order if the player still has craftable stock
      this.spawnOrder()
    },

    cancelOrder(id: string) {
      this.orders = this.orders.filter((x) => x.id !== id)
    },

    openChest(type: Chest['type']): { gold: number; diamonds: number } | null {
      const c = this.chests.find((x) => x.type === type)
      if (!c || c.count <= 0) return null
      c.count--
      let gold = 0
      let diamonds = 0
      switch (type) {
        case 'Обычный':
          gold = 500 + rng(0, 500)
          break
        case 'Редкий':
          gold = 2500
          diamonds = rng(1, 5)
          break
        case 'Эпический':
          gold = 15000
          diamonds = rng(5, 15)
          break
      }
      if (gold > 0) this.addGold(gold)
      if (diamonds > 0) this.diamonds += diamonds
      playSfx('open')
      return { gold, diamonds }
    },

    refillDailyChest() {
      const now = Date.now()
      const DAY = 24 * 3600 * 1000
      if (now - this.dailyChestAt >= DAY) {
        const c = this.chests.find((x) => x.type === 'Обычный')
        if (c) c.count++
        this.dailyChestAt = now
      }
    },

    unlockRegion(id: string) {
      const r = this.regions.find((x) => x.id === id)
      if (!r || r.unlocked) return
      if (this.gold < r.unlockCost) return
      this.gold -= r.unlockCost
      r.unlocked = true
    },

    buyBooster(kind: 'goldx2' | 'auto' | 'lucky' | 'speed') {
      const costs = { goldx2: 5, auto: 10, lucky: 8, speed: 6 }
      const cost = costs[kind]
      if (this.diamonds < cost) return
      this.diamonds -= cost
      const now = Date.now()
      if (kind === 'goldx2') this.goldX2Until = Math.max(now, this.goldX2Until) + 60_000
      if (kind === 'auto') this.autoClickUntil = Math.max(now, this.autoClickUntil) + 60_000
      if (kind === 'lucky') this.critBonusFlat += 0.02
      if (kind === 'speed') this.passiveBonusFlat += 5
    },

    watchAd(reward: 'gold' | 'chest' | 'diamonds') {
      // fake rewarded ad
      if (reward === 'gold') this.addGold(Math.max(100, this.passivePerSec * 60))
      if (reward === 'chest' && this.chests[0]) this.chests[0].count++
      if (reward === 'diamonds') this.diamonds += 5
    },

    checkAchievements() {
      // No-op: progress is computed in the modal; reward is granted on manual claim.
    },

    tick(dtSec: number) {
      // passive income — accumulate fractional gold across frames
      if (this.passivePerSec > 0) {
        this.passiveAcc += this.passivePerSec * dtSec
        if (this.passiveAcc >= 1) {
          const whole = Math.floor(this.passiveAcc)
          this.passiveAcc -= whole
          this.addGold(whole)
        }
      }
      // auto-clicker
      if (Date.now() < this.autoClickUntil) {
        const ticks = Math.max(1, Math.floor(dtSec * 5))
        for (let i = 0; i < ticks; i++) this.click()
      }
      // top up daily Обычный chest while the game is running
      this.refillDailyChest()
      // orders countdown + occasional spawn
      for (const o of this.orders) o.timeLeft = Math.max(0, o.timeLeft - dtSec)
      this.orders = this.orders.filter((o) => o.timeLeft > 0)
      // ~0.4 spawns/sec on average — slow steady drip, less batchy
      if (Math.random() < 0.4 * dtSec) this.spawnOrder()
      this.checkAchievements()
    },

    save() {
      const data: SaveData = {
        gold: this.gold,
        diamonds: this.diamonds,
        souls: this.souls,
        clicks: this.clicks,
        totalGoldEarned: this.totalGoldEarned,
        totalCrafts: this.totalCrafts,
        passiveBonusFlat: this.passiveBonusFlat,
        critBonusFlat: this.critBonusFlat,
        critX2Until: this.critX2Until,
        forgeXp: this.forgeXp,
        dailyChestAt: this.dailyChestAt,
        upgrades: Object.fromEntries(this.upgrades.map((u) => [u.id, u.level])),
        items: Object.fromEntries(this.items.map((i) => [i.id, i.count])),
        regions: Object.fromEntries(this.regions.map((r) => [r.id, r.unlocked])),
        achievements: Object.fromEntries(this.achievements.map((a) => [a.id, a.done])),
        chests: Object.fromEntries(this.chests.map((c) => [c.id, c.count])),
        settings: { ...this.settings },
      }
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data))
      } catch {}
    },

    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY)
        if (!raw) return
        const d = JSON.parse(raw) as SaveData
        this.gold = d.gold ?? 0
        this.diamonds = d.diamonds ?? 0
        this.souls = d.souls ?? 0
        this.clicks = d.clicks ?? 0
        this.totalGoldEarned = d.totalGoldEarned ?? 0
        this.totalCrafts = d.totalCrafts ?? 0
        this.passiveBonusFlat = d.passiveBonusFlat ?? 0
        this.critBonusFlat = d.critBonusFlat ?? 0
        this.critX2Until = d.critX2Until ?? 0
        // Migrate saves predating the XP system: derive XP from the old upgrade-level-based forge level.
        if (d.forgeXp == null && d.upgrades) {
          const sumLvl = Object.values(d.upgrades).reduce((a, n) => a + (n || 0), 0)
          const legacyLevel = 1 + Math.floor(sumLvl / 5)
          this.forgeXp = 50 * legacyLevel * (legacyLevel - 1)
        } else {
          this.forgeXp = d.forgeXp ?? 0
        }
        this.dailyChestAt = d.dailyChestAt ?? 0
        this.upgrades.forEach((u) => (u.level = d.upgrades?.[u.id] ?? 0))
        this.items.forEach((i) => (i.count = d.items?.[i.id] ?? 0))
        this.regions.forEach((r, idx) => (r.unlocked = d.regions?.[r.id] ?? idx === 0))
        this.achievements.forEach((a) => (a.done = d.achievements?.[a.id] ?? false))
        this.chests.forEach((c) => (c.count = d.chests?.[c.id] ?? 0))
        this.settings = d.settings ?? this.settings
      } catch {}
    },

    resetAll() {
      try {
        localStorage.removeItem(SAVE_KEY)
      } catch {}
      // reset state by replacing
      this.$reset()
    },
  },
})
