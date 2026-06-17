import './assets/main.css'
import './assets/shepherd-theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { syncPremiumFromSdk } from '@/composables/usePremium'
import { syncPortalCurrency } from '@/composables/usePortalCurrency'
import { initDocumentScrollLock } from '@/utils/preventDocumentScroll'
import { initViewportLayout, markPlatformHost, syncViewportLayout } from '@/utils/viewport'
import { initYandex, gameplayPause, gameplayResume } from '@/yandex/sdk'

initViewportLayout()
initDocumentScrollLock()
if ((window as Window & { YaGames?: unknown }).YaGames) {
  markPlatformHost()
}

window.addEventListener('contextmenu', (e) => e.preventDefault())
window.addEventListener('selectstart', (e) => e.preventDefault())
window.addEventListener('dragstart', (e) => e.preventDefault())
window.addEventListener('gesturestart', (e) => e.preventDefault())

initYandex()
  .then((sdk) => {
    if (sdk) markPlatformHost()
    else syncViewportLayout()
    return syncPremiumFromSdk().then(() => syncPortalCurrency())
  })
  .finally(() => {
    const app = createApp(App)
    app.use(createPinia())
    app.use(router)
    app.mount('#app')
  })

document.addEventListener('visibilitychange', () => {
  if (document.hidden) gameplayPause()
  else gameplayResume()
})
