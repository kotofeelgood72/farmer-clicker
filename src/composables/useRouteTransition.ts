import type { RouteLocationNormalized } from 'vue-router'

/** Ключ экрана: path без query, чтобы табы внутри страницы не пересоздавали view. */
export function routeComponentKey(route: RouteLocationNormalized): string {
  return route.path
}
