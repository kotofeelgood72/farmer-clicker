// Human-friendly number formatting for in-game counters.
//
//   0..99 999      → "14 910"   (full number, NBSP thousand separator)
//   100K..999K     → "234.5K"   (1 decimal)
//   1M and above   → "12.34M"   (2 decimals)
//
// Russian players are not used to "K" on small numbers like ".91K" — show
// the full amount until it visually becomes long, then abbreviate.

const NBSP = ' '
const UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi']

export function fmt(n: number): string {
  const v = Math.floor(n)
  if (v < 100_000) {
    // Russian thousand separator is a non-breaking space.
    return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  }
  let i = 0
  let val = v
  while (val >= 1000 && i < UNITS.length - 1) {
    val /= 1000
    i++
  }
  const decimals = i === 1 ? 1 : 2
  return val.toFixed(decimals) + UNITS[i]
}
