import './assets/main.css'
import './assets/shepherd-theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { syncPremiumFromSdk } from '@/composables/usePremium'
import { initYandex, getYsdk, gameplayInit, gameplayPause, gameplayResume } from '@/yandex/sdk'

window.addEventListener('contextmenu', (e) => e.preventDefault())
window.addEventListener('selectstart', (e) => e.preventDefault())
window.addEventListener('dragstart', (e) => e.preventDefault())
window.addEventListener('gesturestart', (e) => e.preventDefault())
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) e.preventDefault()
  },
  { passive: false },
)

initYandex()
  .then(() => syncPremiumFromSdk())
  .finally(() => {
    const app = createApp(App)
    app.use(createPinia())
    app.use(router)
    app.mount('#app')

    requestAnimationFrame(() => {
      try {
        ;(window as any).YaGames && getYsdk()?.features?.LoadingAPI?.ready()
      } catch (err) {
        console.warn('[yandex sdk] LoadingAPI.ready() failed', err)
      }
      gameplayInit()
    })
  })

document.addEventListener('visibilitychange', () => {
  if (document.hidden) gameplayPause()
  else gameplayResume()
})
