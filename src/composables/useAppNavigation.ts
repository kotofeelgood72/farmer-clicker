import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { navigateBack, pushFrom } from '@/router/navigation'

export function useAppNavigation() {
  const router = useRouter()
  const route = useRoute()

  function pushFromCurrent(to: RouteLocationRaw) {
    return pushFrom(router, to, route)
  }

  function back(fallback: string) {
    navigateBack(router, route, fallback)
  }

  return {
    router,
    route,
    pushFrom: pushFromCurrent,
    back,
  }
}
