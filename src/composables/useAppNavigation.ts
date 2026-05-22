import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { navigateBack, pushFrom, replacePreservingBack } from '@/router/navigation'

export function useAppNavigation() {
  const router = useRouter()
  const route = useRoute()

  function pushFromCurrent(to: RouteLocationRaw) {
    return pushFrom(router, to, route)
  }

  function back(fallback: string) {
    navigateBack(router, route, fallback)
  }

  function replaceKeepingBack(to: RouteLocationRaw) {
    return replacePreservingBack(router, to)
  }

  return {
    router,
    route,
    pushFrom: pushFromCurrent,
    replaceKeepingBack,
    back,
  }
}
