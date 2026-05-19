import type { DialogNode, GirlDialog } from './types'

function parseMessage(block: string): string {
  const match = block.match(/^[^:]+:\s*\n([\s\S]*?)(?=\nОтвет 1:)/)
  if (!match) return ''
  let text = match[1]!.trim()
  if (text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1)
  }
  return text.trim()
}

function parseAnswer(block: string, index: 1 | 2): string {
  const match = block.match(
    new RegExp(`Ответ ${index}:\\s*\\n"([\\s\\S]*?)"(?=\\n\\n|$)`),
  )
  return match ? match[1]!.replace(/\s*\n\s*/g, ' ').trim() : ''
}

function parseBlock(block: string, id: number): DialogNode | null {
  const trimmed = block.trim()
  if (!trimmed) return null

  const speakerMatch = trimmed.match(/^([^:]+):/)
  const speaker = speakerMatch?.[1]?.trim() ?? 'Она'
  const text = parseMessage(trimmed)
  const choice1 = parseAnswer(trimmed, 1)
  const choice2 = parseAnswer(trimmed, 2)

  if (!text || !choice1 || !choice2) return null

  const affectionMatch = trimmed.match(/Affection:\s*\n\+(\d+)/i)
  const emotionMatch = trimmed.match(/Emotion:\s*\n(\w+)/i)

  return {
    id,
    speaker,
    text,
    choices: [{ text: choice1 }, { text: choice2 }],
    affection: affectionMatch ? Number(affectionMatch[1]) : 0,
    emotion: emotionMatch?.[1] ?? 'neutral',
  }
}

function splitDialogBlocks(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, '\n').trim().split('\n')
  const blocks: string[] = []
  let current: string[] = []

  const isSpeakerLine = (line: string) =>
    /^[^:]+:\s*$/.test(line) && !/^(Ответ \d|Affection|Emotion):/i.test(line)

  for (const line of lines) {
    if (isSpeakerLine(line) && current.length > 0) {
      blocks.push(current.join('\n'))
      current = [line]
    } else {
      current.push(line)
    }
  }

  if (current.length) blocks.push(current.join('\n'))
  return blocks
}

export function parseDialogMarkdown(girlId: number, raw: string): GirlDialog {
  const blocks = splitDialogBlocks(raw)
  const nodes: DialogNode[] = []

  for (const block of blocks) {
    const node = parseBlock(block, nodes.length)
    if (node) nodes.push(node)
  }

  return { girlId, nodes }
}
