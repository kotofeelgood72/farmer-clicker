function isScrollableElement(el: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(el)
  if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
    return false
  }
  return el.scrollHeight > el.clientHeight + 1
}

function findScrollableAncestor(target: EventTarget | null): HTMLElement | null {
  let node = target instanceof Element ? target : null

  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement && isScrollableElement(node)) {
      return node
    }
    node = node.parentElement
  }

  return null
}

function canScrollInDirection(el: HTMLElement, deltaY: number): boolean {
  if (!isScrollableElement(el)) return false

  const { scrollTop, scrollHeight, clientHeight } = el
  const maxScroll = Math.max(0, scrollHeight - clientHeight - 1)

  // touch: палец вниз (deltaY > 0) → контент вниз; wheel: deltaY > 0 → вниз
  if (deltaY > 0) return scrollTop < maxScroll
  if (deltaY < 0) return scrollTop > 0
  return true
}

function pointerCanScroll(target: EventTarget | null, deltaY: number): boolean {
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
  let touchScrollParent: HTMLElement | null = null

  document.addEventListener(
    'touchstart',
    (event) => {
      lastTouchY = event.touches[0]?.clientY ?? 0
      touchScrollParent = findScrollableAncestor(event.target)
    },
    { passive: true },
  )

  document.addEventListener(
    'touchend',
    () => {
      touchScrollParent = null
    },
    { passive: true },
  )

  document.addEventListener(
    'touchcancel',
    () => {
      touchScrollParent = null
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

      const scrollParent = touchScrollParent ?? findScrollableAncestor(event.target)
      if (scrollParent && canScrollInDirection(scrollParent, deltaY)) {
        return
      }

      if (!pointerCanScroll(event.target, deltaY)) {
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

      if (!pointerCanScroll(event.target, event.deltaY)) {
        event.preventDefault()
      }
    },
    { passive: false },
  )
}
