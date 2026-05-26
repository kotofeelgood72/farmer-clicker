import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initYandex, getYsdk, gameplayInit, gameplayPause, gameplayResume } from '@/yandex/sdk'
import { initTouchScrollLock } from '@/utils/touchScrollLock'

window.addEventListener('contextmenu', (e) => e.preventDefault())
window.addEventListener('selectstart', (e) => e.preventDefault())
window.addEventListener('dragstart', (e) => e.preventDefault())
window.addEventListener('gesturestart', (e) => e.preventDefault())
initTouchScrollLock()

initYandex().finally(() => {
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
