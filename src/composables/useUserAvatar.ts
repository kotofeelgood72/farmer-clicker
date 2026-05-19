import { ref, watch } from 'vue'
import { AVATARS } from '@/data/avatars'

const STORAGE_KEY = 'swipe-user-avatar'

function loadStored(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && AVATARS.some((a) => a.url === stored)) return stored
  } catch {
    /* ignore */
  }
  return null
}

const selectedAvatar = ref<string | null>(loadStored() ?? AVATARS[0]?.url ?? null)

watch(selectedAvatar, (url) => {
  try {
    if (url) localStorage.setItem(STORAGE_KEY, url)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
})

export function useUserAvatar() {
  function setAvatar(url: string) {
    selectedAvatar.value = url
  }

  return {
    avatars: AVATARS,
    selectedAvatar,
    setAvatar,
  }
}
