import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export type RouteTransitionName =
  | 'route-fade'
  | 'route-slide-forward'
  | 'route-slide-back'

function routeDepth(route: RouteLocationNormalized): number {
  return (route.meta.depth as number | undefined) ?? 1
}

function isTabRoute(route: RouteLocationNormalized): boolean {
  return route.meta.transitionGroup === 'tab'
}

export function resolveRouteTransition(
  from: RouteLocationNormalized,
  to: RouteLocationNormalized,
): RouteTransitionName {
  if (isTabRoute(from) && isTabRoute(to)) {
    return 'route-fade'
  }

  const fromDepth = routeDepth(from)
  const toDepth = routeDepth(to)

  if (toDepth > fromDepth) return 'route-slide-forward'
  if (toDepth < fromDepth) return 'route-slide-back'

  return 'route-fade'
}

export function useRouteTransition() {
  const transitionName = ref<RouteTransitionName>('route-fade')

  function setTransition(from: RouteLocationNormalized, to: RouteLocationNormalized) {
    transitionName.value = resolveRouteTransition(from, to)
  }

  return { transitionName, setTransition }
}
