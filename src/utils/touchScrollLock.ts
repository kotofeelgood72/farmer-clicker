type ScrollAxis = 'y' | 'x'

interface ScrollableMatch {
  el: HTMLElement
  axis: ScrollAxis
}

function canScroll(el: HTMLElement, axis: ScrollAxis): boolean {
  const style = getComputedStyle(el)
  if (axis === 'y') {
    if (style.overflowY !== 'auto' && style.overflowY !== 'scroll') return false
    return el.scrollHeight > el.clientHeight + 1
  }
  if (style.overflowX !== 'auto' && style.overflowX !== 'scroll') return false
  return el.scrollWidth > el.clientWidth + 1
}

/** Scrollable ancestor for touch targets (modals, lists, carousels). */
function findScrollableParent(el: EventTarget | null): ScrollableMatch | null {
  let node = el instanceof Element ? el : null
  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement) {
      if (canScroll(node, 'y')) return { el: node, axis: 'y' }
      if (canScroll(node, 'x')) return { el: node, axis: 'x' }
    }
    node = node.parentElement
  }
  return null
}

function resetDocumentScroll(): void {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

/** Block page scroll / rubber-band on iOS; allow scroll inside overflow containers. */
export function initTouchScrollLock(): void {
  resetDocumentScroll()
  window.addEventListener('load', resetDocumentScroll)
  window.addEventListener('resize', resetDocumentScroll)
  let touchStartX = 0
  let touchStartY = 0
  let scrollMatch: ScrollableMatch | null = null

  document.addEventListener(
    'touchstart',
    (e) => {
      const touch = e.touches[0]
      touchStartX = touch?.clientX ?? 0
      touchStartY = touch?.clientY ?? 0
      scrollMatch = findScrollableParent(e.target)
    },
    { passive: true },
  )

  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1) {
        e.preventDefault()
        return
      }

      const touch = e.touches[0]
      if (!touch) return

      const match = scrollMatch ?? findScrollableParent(e.target)
      if (!match) {
        e.preventDefault()
        return
      }

      const { el, axis } = match
      const deltaX = touch.clientX - touchStartX
      const deltaY = touch.clientY - touchStartY
      touchStartX = touch.clientX
      touchStartY = touch.clientY

      if (axis === 'y') {
        const { scrollTop, scrollHeight, clientHeight } = el
        const atTop = scrollTop <= 0
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1
        if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) e.preventDefault()
        return
      }

      const { scrollLeft, scrollWidth, clientWidth } = el
      const atLeft = scrollLeft <= 0
      const atRight = scrollLeft + clientWidth >= scrollWidth - 1
      if ((atLeft && deltaX > 0) || (atRight && deltaX < 0)) e.preventDefault()
    },
    { passive: false },
  )
}
