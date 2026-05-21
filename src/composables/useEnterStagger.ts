/** Индекс для CSS-задержки; cap ограничивает «хвост» в длинных списках */
export function enterStagger(index: number, base = 0, cap = 5): number {
  return base + Math.min(Math.max(0, index), cap)
}
