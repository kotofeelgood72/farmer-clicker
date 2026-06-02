import { ref } from 'vue'

const STORAGE_KEY = 'swipe-passed-girls-v1'

function loadPassed(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(
      parsed.filter((id): id is number => typeof id === 'number' && id > 0),
    )
  } catch {
    return new Set()
  }
}

const passedGirlIds = ref<Set<number>>(loadPassed())

function persistPassed() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...passedGirlIds.value]))
  } catch {
    /* ignore */
  }
}

export function markSwipePassed(girlId: number) {
  if (passedGirlIds.value.has(girlId)) return
  passedGirlIds.value = new Set([...passedGirlIds.value, girlId])
  persistPassed()
}

export function clearSwipePassed(girlId: number) {
  if (!passedGirlIds.value.has(girlId)) return
  const next = new Set(passedGirlIds.value)
  next.delete(girlId)
  passedGirlIds.value = next
  persistPassed()
}

export function clearSwipePassedMany(girlIds: number[]): number {
  const next = new Set(passedGirlIds.value)
  let cleared = 0
  for (const id of girlIds) {
    if (next.delete(id)) cleared++
  }
  if (!cleared) return 0
  passedGirlIds.value = next
  persistPassed()
  return cleared
}

export function resetSwipePassesStore() {
  passedGirlIds.value = new Set()
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function useSwipePasses() {
  return {
    passedGirlIds,
    markSwipePassed,
    clearSwipePassed,
  }
}
