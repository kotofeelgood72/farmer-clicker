import { nextTick } from 'vue'
import Shepherd, { type StepOptionsButton, type Tour } from 'shepherd.js'
import { GAME_NAME } from '@/constants/game'

const STORAGE_KEY = 'swipe-onboarding-v1'
const PHONE_SCREEN_SELECTOR = '.phone-screen'
const HIGHLIGHT_CLASS = 'shepherd-target-active'

/** Отступ подсказки от низа экрана телефона (над .bottom-nav). */
const TOOLTIP_NAV_INSET = 86
const TOOLTIP_SIDE_INSET = 12

const TOUR_DEFAULTS = {
  cancelIcon: { enabled: true, label: 'Закрыть обучение' },
  classes: 'shepherd-step-heartline shepherd-step-dock',
  highlightClass: HIGHLIGHT_CLASS,
  arrow: false,
  scrollTo: { behavior: 'smooth' as const, block: 'center' as const },
  modalOverlayOpeningPadding: 10,
  modalOverlayOpeningRadius: 16,
  canClickTarget: false,
}

let mainTour: Tour | null = null
let startScheduled = false

export function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markOnboardingComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

function getPhoneScreen(): HTMLElement | null {
  return document.querySelector(PHONE_SCREEN_SELECTOR)
}

function queryInPhone(selector: string): HTMLElement | null {
  return getPhoneScreen()?.querySelector<HTMLElement>(selector) ?? null
}

function waitForSelector(selector: string, timeoutMs = 6000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      const el = queryInPhone(selector)
      if (el) {
        resolve(el)
        return
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(null)
        return
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
}

function navButtons(showBack: boolean) {
  const buttons: StepOptionsButton[] = []
  if (showBack) {
    buttons.push({
      text: 'Назад',
      secondary: true,
      action() {
        this.back()
      },
    })
  }
  buttons.push({
    text: 'Далее',
    action() {
      this.next()
    },
  })
  return buttons
}

const NAV_TOUR_STEPS = [
  {
    id: 'nav-home',
    target: 'nav-home',
    title: 'Главная',
    text: 'Стартовый экран: награды, быстрые разделы и общий чат.',
    padding: 6,
  },
  {
    id: 'nav-chats',
    target: 'nav-chats',
    title: 'Чаты',
    text: 'Переписка с девушками после мэтча. Непрочитанные — бейдж на иконке.',
    padding: 6,
  },
  {
    id: 'nav-swipe',
    target: 'nav-swipe',
    title: 'Свайпы',
    text: 'Знакомства в центре — листай карточки и выбирай, с кем общаться.',
    padding: 10,
  },
  {
    id: 'nav-dates',
    target: 'nav-dates',
    title: 'Свидания',
    text: 'Встречи с девушками открываются после завершения переписки.',
    padding: 6,
  },
  {
    id: 'nav-profile',
    target: 'nav-profile',
    title: 'Профиль',
    text: 'Аватар, ник и настройки аккаунта.',
    padding: 6,
  },
] as const

function buildNavTourSteps(): Tour['steps'] {
  return NAV_TOUR_STEPS.map((step, index) => {
    const isLast = index === NAV_TOUR_STEPS.length - 1
    const selector = `[data-tour="${step.target}"]`

    return {
      id: step.id,
      title: step.title,
      text: step.text,
      attachTo: { element: selector, on: 'top' as const },
      modalOverlayOpeningPadding: step.padding,
      beforeShowPromise: () => waitForSelector(selector),
      buttons: isLast
        ? [
            {
              text: 'Назад',
              secondary: true,
              action() {
                this.back()
              },
            },
            {
              text: 'Готово',
              action() {
                this.complete()
              },
            },
          ]
        : navButtons(true),
    }
  })
}

function destroyMainTour() {
  if (!mainTour) return
  mainTour.hide()
  mainTour.steps.forEach((step) => step.destroy())
  mainTour = null
  clearPhoneOverlayClip()
}

/** Shepherd рисует маску на весь window — обрезаем до экрана телефона. */
function getPhoneOverlayClipPath(): string | null {
  const phone = getPhoneScreen()
  if (!phone) return null

  const r = phone.getBoundingClientRect()
  const radius =
    Number.parseFloat(getComputedStyle(phone).borderRadius) ||
    Number.parseFloat(getComputedStyle(phone).getPropertyValue('--phone-inner-radius')) ||
    50

  const top = Math.max(0, r.top)
  const left = Math.max(0, r.left)
  const right = Math.max(0, window.innerWidth - r.right)
  const bottom = Math.max(0, window.innerHeight - r.bottom)

  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius}px)`
}

let overlayClipCleanup: (() => void) | null = null

function clearPhoneOverlayClip() {
  overlayClipCleanup?.()
  overlayClipCleanup = null
  const overlay = document.querySelector('.shepherd-modal-overlay-container')
  if (overlay instanceof SVGElement) overlay.style.clipPath = ''
}

function getPhoneTooltipBounds() {
  const phone = getPhoneScreen()
  if (!phone) return null

  const r = phone.getBoundingClientRect()
  return {
    left: r.left + TOOLTIP_SIDE_INSET,
    width: Math.max(0, r.width - TOOLTIP_SIDE_INSET * 2),
    bottom: window.innerHeight - r.bottom + TOOLTIP_NAV_INSET,
  }
}

function pinTourTooltipToPhoneBottom() {
  const apply = () => {
    const bounds = getPhoneTooltipBounds()
    const tooltip = [...document.querySelectorAll<HTMLElement>('.shepherd-element')].find(
      (el) => !el.hidden && el.offsetWidth > 0,
    )
    if (!bounds || !tooltip) return

    tooltip.classList.remove('shepherd-centered')
    const pin = (prop: string, value: string) => tooltip.style.setProperty(prop, value, 'important')

    /* В body поверх маски; геометрия строго внутри .phone-screen (Shepherd позже сбрасывает в center). */
    pin('position', 'fixed')
    pin('left', `${bounds.left}px`)
    pin('width', `${bounds.width}px`)
    pin('max-width', `${bounds.width}px`)
    pin('min-width', '0')
    pin('right', 'auto')
    pin('top', 'auto')
    pin('bottom', `${bounds.bottom}px`)
    pin('transform', 'none')
    pin('margin', '0')
    pin('box-sizing', 'border-box')
    pin('overflow', 'hidden')
    pin('z-index', '10000')
  }

  apply()
  requestAnimationFrame(() => requestAnimationFrame(apply))
  window.setTimeout(apply, 50)
  window.setTimeout(apply, 400)
}

function bindPhoneOverlayClip(tour: Tour) {
  clearPhoneOverlayClip()

  const update = () => {
    const overlay = document.querySelector('.shepherd-modal-overlay-container')
    if (!(overlay instanceof SVGElement)) return
    const clip = getPhoneOverlayClipPath()
    if (clip) overlay.style.clipPath = clip
  }

  const onLayout = () => {
    requestAnimationFrame(() => {
      update()
      pinTourTooltipToPhoneBottom()
    })
  }

  update()
  window.addEventListener('resize', onLayout)
  window.addEventListener('scroll', onLayout, true)

  tour.on('show', onLayout)

  overlayClipCleanup = () => {
    window.removeEventListener('resize', onLayout)
    window.removeEventListener('scroll', onLayout, true)
    const overlay = document.querySelector('.shepherd-modal-overlay-container')
    if (overlay instanceof SVGElement) overlay.style.clipPath = ''
  }

  tour.on('complete', overlayClipCleanup)
  tour.on('cancel', overlayClipCleanup)
}

export function createMainOnboardingTour(): Tour {
  const tour = new Shepherd.Tour({
    tourName: 'heartline',
    useModalOverlay: true,
    /* Маска и подсказки в body: подсказка должна быть выше маски (z-index). */
    modalContainer: document.body,
    stepsContainer: document.body,
    exitOnEsc: true,
    keyboardNavigation: true,
    defaultStepOptions: TOUR_DEFAULTS,
  })

  tour.addSteps([
    {
      id: 'welcome',
      title: 'Добро пожаловать',
      text: `Короткий тур по главному экрану — покажем, с чего начать в «${GAME_NAME}». Дальше подсветим важные блоки.`,
      classes: 'shepherd-step-heartline shepherd-step-welcome shepherd-step-dock',
      buttons: [
        {
          text: 'Пропустить',
          secondary: true,
          action() {
            this.complete()
          },
        },
        {
          text: 'Поехали',
          action() {
            this.next()
          },
        },
      ],
    },
    {
      id: 'header',
      title: 'Профиль и ресурсы',
      text: 'Аватар и ник — в профиль. Энергия нужна для свайпов, алмазы — для магазина и особых действий.',
      attachTo: { element: '[data-tour="header"]', on: 'bottom' },
      modalOverlayOpeningPadding: 4,
      beforeShowPromise: () => waitForSelector('[data-tour="header"]'),
      buttons: navButtons(false),
    },
    {
      id: 'rewards',
      title: 'Ежедневные награды',
      text: 'Заходи каждый день — забирай алмазы и энергию. Награда дня подсвечивается в ленте.',
      attachTo: { element: '[data-tour="rewards"]', on: 'bottom' },
      beforeShowPromise: () => waitForSelector('[data-tour="rewards"]'),
      buttons: navButtons(true),
    },
    {
      id: 'tiles',
      title: 'Быстрые разделы',
      text: 'Свидания — встречи с девушками после переписки. Магазин — алмазы и энергия.',
      attachTo: { element: '[data-tour="tiles"]', on: 'top' },
      beforeShowPromise: () => waitForSelector('[data-tour="tiles"]'),
      buttons: navButtons(true),
    },
    {
      id: 'lobby',
      title: 'Общий чат',
      text: 'Живой фон с перепиской игроков. Раздел скоро откроется — следи за обновлениями.',
      attachTo: { element: '[data-tour="lobby"]', on: 'top' },
      beforeShowPromise: () => waitForSelector('[data-tour="lobby"]'),
      buttons: navButtons(true),
    },
    ...buildNavTourSteps(),
  ])

  const finish = () => {
    markOnboardingComplete()
    destroyMainTour()
  }

  tour.on('complete', finish)
  tour.on('cancel', finish)

  bindPhoneOverlayClip(tour)

  return tour
}

/** Запуск тура на /main после первого захода (один раз). */
export async function tryStartMainOnboarding(options?: {
  isDailyModalOpen?: () => boolean
}): Promise<void> {
  if (isOnboardingComplete() || mainTour?.isActive() || startScheduled) return

  if (options?.isDailyModalOpen?.()) return

  const phone = getPhoneScreen()
  if (!phone) return

  startScheduled = true

  await nextTick()
  await waitForSelector('[data-tour="header"]', 4000)

  if (isOnboardingComplete()) {
    startScheduled = false
    return
  }

  if (options?.isDailyModalOpen?.()) {
    startScheduled = false
    return
  }

  getPhoneScreen()?.querySelector<HTMLElement>('.scroll')?.scrollTo({ top: 0, behavior: 'instant' })

  mainTour = createMainOnboardingTour()
  startScheduled = false
  void mainTour.start()
}

export function cancelMainOnboarding() {
  if (mainTour?.isActive()) {
    void mainTour.cancel()
  } else {
    destroyMainTour()
  }
}
