import { computed, ref, watch } from 'vue'
import { isPremiumOwned } from '@/composables/usePremium'

const STORAGE_KEY = 'swipe-diamonds-v1'

/** Стартовый баланс алмазов. */
export const DEFAULT_DIAMONDS = 120

interface DiamondsState {
  balance: number
}

function loadState(): DiamondsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DiamondsState>
      const balance = Number(parsed.balance)
      if (Number.isFinite(balance) && balance >= 0) {
        return { balance: Math.floor(balance) }
      }
    }
  } catch {
    /* ignore */
  }
  return { balance: DEFAULT_DIAMONDS }
}

const state = ref<DiamondsState>(loadState())

watch(
  state,
  (s) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      /* ignore quota */
    }
  },
  { deep: true },
)

const diamonds = computed(() => state.value.balance)

function canSpend(amount: number): boolean {
  if (amount <= 0) return true
  if (isPremiumOwned()) return true
  return state.value.balance >= amount
}

function spend(amount: number): boolean {
  if (amount <= 0) return true
  if (isPremiumOwned()) return true
  if (state.value.balance < amount) return false
  state.value = { balance: state.value.balance - amount }
  return true
}

function add(amount: number) {
  if (amount <= 0) return
  state.value = { balance: state.value.balance + amount }
}

export function resetDiamondsStore() {
  state.value = { balance: DEFAULT_DIAMONDS }
}

export function useDiamonds() {
  return {
    diamonds,
    canSpend,
    spend,
    add,
  }
}
