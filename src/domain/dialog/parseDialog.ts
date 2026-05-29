import type { DialogChoice, DialogNode, GirlDialog } from './types'

/**
 * Dialog markdown parser. Supports two interchangeable styles:
 *
 *  1) Linear (one player reply per girl message). Matches the output of
 *     `src/materials/prompt.md`:
 *
 *        Девушка:
 *        "сообщение"
 *
 *        Игрок:
 *        "ответ"
 *
 *  2) Branching (two alternative replies per girl message):
 *
 *        Алина:
 *        "сообщение"
 *
 *        Ответ 1:
 *        "вариант 1"
 *
 *        Ответ 2:
 *        "вариант 2"
 *
 *  Both styles can have optional metadata after the replies:
 *
 *        Affection:
 *        +5
 *
 *        Emotion:
 *        flirty
 *
 *  The speaker label for the girl can be anything ("Девушка", "Алина", "Она", ...)
 *  except the reserved keywords: Игрок, Ответ 1, Ответ 2, Affection, Emotion.
 */

type EntryType = 'girl' | 'player' | 'answer1' | 'answer2' | 'affection' | 'emotion'

interface Entry {
  type: EntryType
  speaker: string
  text: string
}

const DEFAULT_LINEAR_AFFECTION = 3
const DEFAULT_BRANCHING_AFFECTION = 3
const DEFAULT_EMOTION = 'neutral'

/** `[фото]` или `[фото:3]` — в отдельной строке или внутри текста */
const PHOTO_INLINE_RX = /\[фото(?::(\d+))?\]/gi

export interface ExtractedPhotoPlaceholder {
  hasPhoto: boolean
  explicitIndex?: number
  text: string
}

/** Убирает плейсхолдер из текста; возвращает номер галереи, если указан явно. */
export function extractPhotoPlaceholder(text: string): ExtractedPhotoPlaceholder {
  const matches = [...text.matchAll(PHOTO_INLINE_RX)]
  if (matches.length === 0) {
    return { hasPhoto: false, text }
  }

  const explicitRaw = matches[0]![1]
  const explicitIndex =
    explicitRaw !== undefined && Number.isFinite(Number(explicitRaw))
      ? Number(explicitRaw)
      : undefined

  const cleaned = text
    .replace(PHOTO_INLINE_RX, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { hasPhoto: true, explicitIndex, text: cleaned }
}

export function parsePhotoPlaceholder(text: string): {
  isPhoto: boolean
  explicitIndex?: number
} {
  const { hasPhoto, explicitIndex } = extractPhotoPlaceholder(text)
  if (!hasPhoto) return { isPhoto: false }
  return { isPhoto: true, explicitIndex }
}

function assignPhotoIndices(nodes: DialogNode[]): void {
  let autoIndex = 0
  for (const node of nodes) {
    const { hasPhoto, explicitIndex, text } = extractPhotoPlaceholder(node.text)
    if (!hasPhoto) continue
    autoIndex += 1
    node.photoIndex = explicitIndex ?? autoIndex
    node.text = text
  }
}

const RESERVED: Array<{ rx: RegExp; type: EntryType }> = [
  { rx: /^игрок$/i, type: 'player' },
  { rx: /^ответ\s*1$/i, type: 'answer1' },
  { rx: /^ответ\s*2$/i, type: 'answer2' },
  { rx: /^affection$/i, type: 'affection' },
  { rx: /^emotion$/i, type: 'emotion' },
]

function classify(header: string): EntryType {
  const trimmed = header.trim()
  for (const r of RESERVED) {
    if (r.rx.test(trimmed)) return r.type
  }
  return 'girl'
}

function stripQuotes(s: string): string {
  const t = s.trim()
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    return t.slice(1, -1).trim()
  }
  return t
}

function tokenize(raw: string): Entry[] {
  const text = raw.replace(/\r\n/g, '\n').trim()
  const headerRx = /^([^:\n]{1,40}):[ \t]*$/gm
  const headers: { speaker: string; start: number; end: number }[] = []

  let m: RegExpExecArray | null
  while ((m = headerRx.exec(text)) !== null) {
    headers.push({ speaker: m[1]!.trim(), start: m.index, end: m.index + m[0]!.length })
  }

  const entries: Entry[] = []
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]!
    const next = headers[i + 1]
    const content = text.slice(h.end, next?.start ?? text.length).trim()
    if (!content) continue
    entries.push({ type: classify(h.speaker), speaker: h.speaker, text: stripQuotes(content) })
  }
  return entries
}

function buildNodes(entries: Entry[]): DialogNode[] {
  const nodes: DialogNode[] = []
  let i = 0

  while (i < entries.length) {
    const e = entries[i]!
    if (e.type !== 'girl') {
      i++
      continue
    }

    const choices: DialogChoice[] = []
    let affection: number | null = null
    let emotion = DEFAULT_EMOTION
    let hasBranching = false
    let pendingPlayerLines: string[] = []

    const flushPendingPlayer = () => {
      if (pendingPlayerLines.length > 0) {
        choices.push({ text: pendingPlayerLines.join('\n') })
        pendingPlayerLines = []
      }
    }

    let j = i + 1
    while (j < entries.length && entries[j]!.type !== 'girl') {
      const nxt = entries[j]!
      if (nxt.type === 'player') {
        // Merge consecutive "Игрок:" entries into a single reply,
        // so scenarios like "..." then "Это мило" stay as one bubble.
        pendingPlayerLines.push(nxt.text)
      } else if (nxt.type === 'answer1' || nxt.type === 'answer2') {
        flushPendingPlayer()
        choices.push({ text: nxt.text })
        hasBranching = true
      } else if (nxt.type === 'affection') {
        const num = Number(nxt.text.replace(/^\+/, '').trim())
        affection = Number.isFinite(num) ? num : null
      } else if (nxt.type === 'emotion') {
        const first = nxt.text.split(/\s+/)[0]
        if (first) emotion = first
      }
      j++
    }
    flushPendingPlayer()

    if (choices.length > 0) {
      const fallback = hasBranching ? DEFAULT_BRANCHING_AFFECTION : DEFAULT_LINEAR_AFFECTION
      nodes.push({
        id: nodes.length,
        speaker: e.speaker,
        text: e.text,
        choices,
        affection: affection ?? fallback,
        emotion,
      })
    }

    i = j
  }

  return nodes
}

export function parseDialogMarkdown(girlId: number, raw: string): GirlDialog {
  const entries = tokenize(raw)
  const nodes = buildNodes(entries)
  assignPhotoIndices(nodes)
  return { girlId, nodes }
}
