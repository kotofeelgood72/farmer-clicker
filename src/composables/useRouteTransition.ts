import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export type RouteTransitionName = 'route-slide-forward' | 'route-slide-back'

/** Ключ экрана: path без query, чтобы табы внутри страницы не пересоздавали view. */
export function routeComponentKey(route: RouteLocationNormalized): string {
  return route.path
}

/** Порядок вкладок в нижней навигации (слева направо) */
const TAB_ROUTE_NAMES = ['main', 'chats', 'swipe', 'dates', 'profile'] as const

function routeDepth(route: RouteLocationNormalized): number {
  return (route.meta.depth as number | undefined) ?? 1
}

function tabOrderIndex(route: RouteLocationNormalized): number | null {
  const name = route.name
  if (typeof name !== 'string') return null
  const idx = TAB_ROUTE_NAMES.indexOf(name as (typeof TAB_ROUTE_NAMES)[number])
  return idx >= 0 ? idx : null
}

export function resolveRouteTransition(
  from: RouteLocationNormalized,
  to: RouteLocationNormalized,
): RouteTransitionName {
  const fromTab = tabOrderIndex(from)
  const toTab = tabOrderIndex(to)

  if (fromTab !== null && toTab !== null) {
    return toTab >= fromTab ? 'route-slide-forward' : 'route-slide-back'
  }

  const fromDepth = routeDepth(from)
  const toDepth = routeDepth(to)

  if (toDepth > fromDepth) return 'route-slide-forward'
  if (toDepth < fromDepth) return 'route-slide-back'

  return 'route-slide-forward'
}

export function useRouteTransition() {
  const transitionName = ref<RouteTransitionName>('route-slide-forward')

  function setTransition(from: RouteLocationNormalized, to: RouteLocationNormalized) {
    transitionName.value = resolveRouteTransition(from, to)
  }

  return { transitionName, setTransition }
}
