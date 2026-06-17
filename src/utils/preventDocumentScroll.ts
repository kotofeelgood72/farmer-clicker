function isScrollableElement(el: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(el)
  if (overflowY !== 'auto' && overflowY !== 'scroll') return false
  return el.scrollHeight > el.clientHeight
}

function canScrollInDirection(el: HTMLElement, deltaY: number): boolean {
  if (!isScrollableElement(el)) return false

  const { scrollTop, scrollHeight, clientHeight } = el
  if (deltaY > 0) return scrollTop > 0
  if (deltaY < 0) return scrollTop + clientHeight < scrollHeight - 1
  return false
}

function touchCanScroll(target: EventTarget | null, deltaY: number): boolean {
  let node = target instanceof Element ? target : null

  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement && canScrollInDirection(node, deltaY)) {
      return true
    }
    node = node.parentElement
  }

  return false
}

function wheelCanScroll(target: EventTarget | null, deltaY: number): boolean {
  let node = target instanceof Element ? target : null

  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement && canScrollInDirection(node, deltaY)) {
      return true
    }
    node = node.parentElement
  }

  return false
}

/** Блокирует прокрутку документа и pull-to-refresh, сохраняя скролл внутри панелей. */
export function initDocumentScrollLock(): void {
  let lastTouchY = 0

  document.addEventListener(
    'touchstart',
    (event) => {
      lastTouchY = event.touches[0]?.clientY ?? 0
    },
    { passive: true },
  )

  document.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length > 1) {
        event.preventDefault()
        return
      }

      if (document.documentElement.classList.contains('is-tour-active')) {
        event.preventDefault()
        return
      }

      const touchY = event.touches[0]?.clientY ?? 0
      const deltaY = touchY - lastTouchY
      lastTouchY = touchY

      if (!touchCanScroll(event.target, deltaY)) {
        event.preventDefault()
      }
    },
    { passive: false },
  )

  document.addEventListener(
    'wheel',
    (event) => {
      if (document.documentElement.classList.contains('is-tour-active')) {
        event.preventDefault()
        return
      }

      if (!wheelCanScroll(event.target, event.deltaY)) {
        event.preventDefault()
      }
    },
    { passive: false },
  )
}
