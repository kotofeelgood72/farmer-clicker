/** Уровень отношений с персонажем (1–10) по прогрессу диалога */
export function getRelationshipLevel(girlId: number): number {
  try {
    const raw = localStorage.getItem(`swipe-dialog-${girlId}`)
    if (!raw) return 1
    const state = JSON.parse(raw) as { nodeIndex?: number; affection?: number }
    const fromNodes = (state.nodeIndex ?? 0) + 1
    const fromAffection = Math.floor((state.affection ?? 0) / 8) + 1
    return Math.min(10, Math.max(1, fromNodes, fromAffection))
  } catch {
    return 1
  }
}
