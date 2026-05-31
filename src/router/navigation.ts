import type {
  HistoryState,
  RouteLocationNormalizedLoaded,
  RouteLocationRaw,
  Router,
} from 'vue-router'
import { scheduleRouteTransition } from '@/composables/useRouteTransition'

export type NavigationBackState = {
  /** Полный путь экрана, с которого открыли текущий. */
  back?: string
}

/** Состояние текущей записи history (memory history не пишет в window.history.state). */
function currentHistoryState(router: Router): NavigationBackState | null {
  const fromRouter = router.options.history.state
  if (fromRouter && typeof fromRouter === 'object' && 'back' in fromRouter) {
    return fromRouter as NavigationBackState
  }
  const fromWindow = history.state
  if (fromWindow && typeof fromWindow === 'object' && 'back' in fromWindow) {
    return fromWindow as NavigationBackState
  }
  return null
}

function backPath(from?: RouteLocationNormalizedLoaded): string | undefined {
  const path = from?.fullPath
  if (!path || path === '/') return undefined
  return path
}

function mergeHistoryState(prev: HistoryState | undefined, back?: string): HistoryState {
  if (!back) return prev ?? {}
  return { ...prev, back }
}

function routeStateFrom(to: RouteLocationRaw): HistoryState | undefined {
  if (typeof to !== 'object' || !to.state || typeof to.state !== 'object') return undefined
  return to.state as HistoryState
}

/** Переход «вглубь» с запоминанием экрана для кнопки «Назад». */
export function pushFrom(
  router: Router,
  to: RouteLocationRaw,
  from?: RouteLocationNormalizedLoaded,
) {
  const back = backPath(from)

  if (typeof to === 'string') {
    return router.push({ path: to, state: back ? { back } : {} })
  }

  const prevState = routeStateFrom(to)

  return router.push({
    ...to,
    state: mergeHistoryState(prevState, back),
  })
}

/** replace без потери `back` (например, переключение вкладок в магазине). */
export function replacePreservingBack(
  router: Router,
  to: RouteLocationRaw,
) {
  const prev = currentHistoryState(router)
  const back = prev?.back

  if (typeof to === 'string') {
    return router.replace({ path: to, state: back ? { back } : {} })
  }

  const prevState = routeStateFrom(to)

  return router.replace({
    ...to,
    state: mergeHistoryState(prevState, back),
  })
}

/** Возврат на экран-источник или на fallback, если истории нет. */
export function navigateBack(
  router: Router,
  route: RouteLocationNormalizedLoaded,
  fallback: string,
) {
  const target = currentHistoryState(router)?.back

  scheduleRouteTransition('route-slide-back')

  if (typeof target === 'string' && target && target !== route.fullPath) {
    // pop, чтобы восстановить state предыдущего экрана (push заново его сбрасывает)
    void router.back()
    return
  }

  void router.push(fallback)
}
