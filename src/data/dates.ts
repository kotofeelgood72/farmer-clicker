import { GIRLS, getGirlPortraitImage, type GirlProfile } from '@/data/girls'
import { isGirlChatCompleted } from '@/composables/useGirlChat'
import { isMeetingCompleted, isMeetingStarted } from '@/composables/useMeetingChat'
import { hasMeetingDialog } from '@/data/meetings'

/**
 * Локации свиданий. id = имя файла-картинки в `src/assets/meeting/<id>/<id>.jpg`
 * и id папки `src/assets/meeting/<id>/dialog.md`.
 *
 * Чтобы добавить новую локацию — положи её файлы по этому пути и допиши
 * строку ниже. Никаких других правок не нужно.
 */
const LOCATIONS: { id: number; title: string }[] = [
  { id: 1, title: 'Прогулка в парке' },
  { id: 2, title: 'Кофейня' },
  { id: 3, title: 'Кино' },
  { id: 4, title: 'Выставка' },
  { id: 5, title: 'Концерт' },
  { id: 6, title: 'Ресторан' },
]

const meetingModules = import.meta.glob<string>('@/assets/meeting/*/*.jpg', {
  eager: true,
  import: 'default',
})

const meetingCardModules = import.meta.glob<string>('@/assets/meeting/*/*.card.webp', {
  eager: true,
  import: 'default',
})

const meetingImagesById = Object.fromEntries(
  Object.entries(meetingModules)
    .map(([path, url]) => {
      // Берём только meeting/<id>/<id>.jpg, чтобы случайные bg/иконки не перетёрли основное фото локации.
      const m = path.match(/meeting\/(\d+)\/(\d+)\.jpg$/i)
      if (!m || m[1] !== m[2]) return null
      return [Number(m[1]), url] as const
    })
    .filter((entry): entry is [number, string] => entry !== null),
) as Record<number, string>

const meetingCardById = Object.fromEntries(
  Object.entries(meetingCardModules)
    .map(([path, url]) => {
      const m = path.match(/meeting\/(\d+)\/(\d+)\.card\.webp$/)
      if (!m || m[1] !== m[2]) return null
      return [Number(m[1]), url] as const
    })
    .filter((entry): entry is [number, string] => entry !== null),
) as Record<number, string>

export type DateStatus = 'new' | 'available' | 'locked' | 'past'

export interface DailyDate {
  /** Локальный id записи в списке свиданий за сегодня (1..N). */
  id: number
  title: string
  status: DateStatus
  girlId: number
  girlName: string
  girlImage?: string
  girlColor: string
  locationId: number
  locationImage?: string
}

// В список свиданий попадают ВСЕ 20 девушек. Локации шаффлятся отдельно
// и циклически переиспользуются, если девушек больше, чем локаций —
// одна и та же локация может выпасть нескольким девушкам.

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function getDailySeedKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Сколько миллисекунд осталось до следующей локальной полуночи. */
export function msUntilNextRotation(now: Date = new Date()): number {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return Math.max(1000, next.getTime() - now.getTime())
}

function resolveStatus(girl: GirlProfile, locationId: number): DateStatus {
  if (!isGirlChatCompleted(girl.id)) return 'locked'
  if (!hasMeetingDialog(locationId)) return 'locked'
  if (isMeetingCompleted(locationId, girl.id)) return 'past'
  return isMeetingStarted(locationId, girl.id) ? 'available' : 'new'
}

function buildDate(
  slot: number,
  girl: GirlProfile,
  location: { id: number; title: string },
): DailyDate {
  return {
    id: slot + 1,
    title: location.title,
    status: resolveStatus(girl, location.id),
    girlId: girl.id,
    girlName: girl.name,
    girlImage: getGirlPortraitImage(girl),
    girlColor: girl.color,
    locationId: location.id,
    locationImage: meetingCardById[location.id] ?? meetingImagesById[location.id],
  }
}

export function generateDailyDates(date: Date = new Date()): DailyDate[] {
  const seed = hashSeed(getDailySeedKey(date))
  const rng = mulberry32(seed)

  // Сверху списка — девушки с завершённым чатом (доступные свидания),
  // ниже — все остальные locked-превью. Внутри каждой группы порядок
  // шаффлится seed-ом дня, так что состав/порядок стабилен в течение суток.
  const completedShuffled = shuffle(
    GIRLS.filter((g) => isGirlChatCompleted(g.id)),
    rng,
  )
  const uncompletedShuffled = shuffle(
    GIRLS.filter((g) => !isGirlChatCompleted(g.id)),
    rng,
  )
  const locations = shuffle(LOCATIONS, rng)
  if (locations.length === 0) return []

  const ordered = [...completedShuffled, ...uncompletedShuffled]
  return ordered.map((girl, i) => buildDate(i, girl, locations[i % locations.length]!))
}

export function getDailyDateById(id: number, date: Date = new Date()): DailyDate | undefined {
  return generateDailyDates(date).find((d) => d.id === id)
}

export function getDailyDateByGirlId(
  girlId: number,
  date: Date = new Date(),
): DailyDate | undefined {
  return generateDailyDates(date).find((d) => d.girlId === girlId)
}
