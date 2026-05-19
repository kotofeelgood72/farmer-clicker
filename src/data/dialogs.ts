import { parseDialogMarkdown } from '@/domain/dialog/parseDialog'
import type { GirlDialog } from '@/domain/dialog/types'

const dialogModules = import.meta.glob<string>('@/assets/girls/*/dialog.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const dialogsByGirlId = Object.fromEntries(
  Object.entries(dialogModules)
    .map(([path, raw]) => {
      const match = path.match(/girls\/(\d+)\/dialog\.md/)
      if (!match) return null
      const girlId = Number(match[1])
      return [girlId, parseDialogMarkdown(girlId, raw)] as const
    })
    .filter((entry): entry is [number, GirlDialog] => entry !== null),
) as Record<number, GirlDialog>

export function getGirlDialog(girlId: number): GirlDialog | undefined {
  return dialogsByGirlId[girlId]
}

export function hasGirlDialog(girlId: number): boolean {
  return girlId in dialogsByGirlId
}
