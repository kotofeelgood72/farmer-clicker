import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { getMeetingDialog } from '@/data/meetings'
import { isDialogCompleted, useDialogChat } from './useDialogChat'

export const MEETING_LOCATION_IDS = [1, 2, 3, 4, 5, 6] as const

export function meetingStorageKey(locationId: number, girlId: number): string {
  return `swipe-meeting-v1-${locationId}-${girlId}`
}

export function isMeetingCompleted(locationId: number, girlId: number): boolean {
  return isDialogCompleted(meetingStorageKey(locationId, girlId), getMeetingDialog(locationId))
}

export function isMeetingStarted(locationId: number, girlId: number): boolean {
  try {
    return localStorage.getItem(meetingStorageKey(locationId, girlId)) !== null
  } catch {
    return false
  }
}

/** Свидание с девушкой уже открывали (прогресс в любой локации). */
export function hasMeetingStartedForGirl(girlId: number): boolean {
  return MEETING_LOCATION_IDS.some((locationId) => isMeetingStarted(locationId, girlId))
}

/** Локация, где сохранён прогресс свидания (для продолжения). */
export function findStartedMeetingLocationForGirl(girlId: number): number | null {
  for (const locationId of MEETING_LOCATION_IDS) {
    if (isMeetingStarted(locationId, girlId)) return locationId
  }
  return null
}

export function useMeetingChat(
  locationIdSource: MaybeRefOrGetter<number>,
  girlIdSource: MaybeRefOrGetter<number>,
) {
  const locationId = computed(() => toValue(locationIdSource))
  const girlId = computed(() => toValue(girlIdSource))
  const dialog = computed(() => getMeetingDialog(locationId.value))
  const storageKey = computed(() => meetingStorageKey(locationId.value, girlId.value))
  return useDialogChat({ dialog, storageKey })
}
