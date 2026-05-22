import type {
  RouteLocationNormalizedLoaded,
  RouteLocationRaw,
  Router,
} from 'vue-router'

export type NavigationBackState = {
  /** Полный путь экрана, с которого открыли текущий. */
  back?: string
}

function backPath(from?: RouteLocationNormalizedLoaded): string | undefined {
  const path = from?.fullPath
  if (!path || path === '/') return undefined
  return path
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

  const prevState =
    typeof to === 'object' && to.state && typeof to.state === 'object'
      ? (to.state as Record<string, unknown>)
      : {}

  return router.push({
    ...to,
    state: back ? { ...prevState, back } : prevState,
  })
}

/** Возврат на экран-источник или на fallback, если истории нет. */
export function navigateBack(
  router: Router,
  route: RouteLocationNormalizedLoaded,
  fallback: string,
) {
  const state = history.state as NavigationBackState | null
  const target = state?.back

  if (typeof target === 'string' && target && target !== route.fullPath) {
    void router.push(target)
    return
  }

  void router.push(fallback)
}
