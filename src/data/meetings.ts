import { parseDialogMarkdown } from '@/domain/dialog/parseDialog'
import type { GirlDialog } from '@/domain/dialog/types'

const dialogModules = import.meta.glob<string>('@/assets/meeting/*/dialog.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const dialogsByLocationId = Object.fromEntries(
  Object.entries(dialogModules)
    .map(([path, raw]) => {
      const match = path.match(/meeting\/(\d+)\/dialog\.md/)
      if (!match) return null
      const locationId = Number(match[1])
      return [locationId, parseDialogMarkdown(locationId, raw)] as const
    })
    .filter((entry): entry is [number, GirlDialog] => entry !== null),
) as Record<number, GirlDialog>

export function getMeetingDialog(locationId: number): GirlDialog | undefined {
  return dialogsByLocationId[locationId]
}

export function hasMeetingDialog(locationId: number): boolean {
  return locationId in dialogsByLocationId
}
