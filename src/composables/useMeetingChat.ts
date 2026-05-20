import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { getMeetingDialog } from '@/data/meetings'
import { isDialogCompleted, useDialogChat } from './useDialogChat'

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
