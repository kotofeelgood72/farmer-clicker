import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'swipe-energy-v2'

/** Стоимость одной прокрутки карточки в свайпе. */
export const SWIPE_ENERGY_COST = 1

/** Стартовый запас и лимит бесплатного восстановления. */
export const MAX_ENERGY = 5

interface EnergyState {
  current: number
}

function loadState(): EnergyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<EnergyState & { max?: number }>
      const current = Number(parsed.current)
      if (Number.isFinite(current)) {
        return { current: Math.max(0, current) }
      }
    }
  } catch {
    /* ignore */
  }
  return { current: MAX_ENERGY }
}

const state = ref<EnergyState>(loadState())

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

const energy = computed(() => state.value.current)
const hasEnergy = computed(() => state.value.current > 0)

function canSpend(amount: number = SWIPE_ENERGY_COST): boolean {
  return state.value.current >= amount
}

/**
 * Списать энергию. Возвращает true, если успешно, false — если не хватило.
 * Никаких частичных списаний.
 */
function spend(amount: number = SWIPE_ENERGY_COST): boolean {
  if (state.value.current < amount) return false
  state.value = { ...state.value, current: state.value.current - amount }
  return true
}

function add(amount: number) {
  if (amount <= 0) return
  state.value = { current: state.value.current + amount }
}

function refillToMax() {
  if (state.value.current < MAX_ENERGY) {
    state.value = { current: MAX_ENERGY }
  }
}

export function resetEnergyStore() {
  state.value = { current: MAX_ENERGY }
}

export function useEnergy() {
  return {
    energy,
    hasEnergy,
    canSpend,
    spend,
    add,
    refillToMax,
  }
}
