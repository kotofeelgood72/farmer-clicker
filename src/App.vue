<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import DailyRewardsModal from '@/components/DailyRewardsModal.vue'
import IosActivityIndicator from '@/components/IosActivityIndicator.vue'
import IosNotificationBanner from '@/components/IosNotificationBanner.vue'
import { useAchievements } from '@/composables/useAchievements'
import { useDailyRewards } from '@/composables/useDailyRewards'
import { useNotificationWatcher } from '@/composables/useNotificationWatcher'
import { scheduleStartupInterstitial } from '@/ads/ads'
import { routeComponentKey, useRouteTransition } from '@/composables/useRouteTransition'
import { gameplayInit } from '@/yandex/sdk'
import stageBgUrl from '@/assets/ui/background.jpg'

const route = useRoute()
const router = useRouter()
const { syncAndShowModal } = useDailyRewards()
const { refreshAchievements } = useAchievements()
const { transitionName, setTransition } = useRouteTransition()

useNotificationWatcher()

const BOOT_LOAD_MS = 2000
const isBootLoading = ref(true)

onMounted(() => {
  window.setTimeout(() => {
    isBootLoading.value = false
    // После спиннера: реклама поверх UI (премиум её не отключает), затем gameplay API.
    scheduleStartupInterstitial({
      onClose: () => gameplayInit(),
    })
  }, BOOT_LOAD_MS)
})

router.beforeEach((to, from) => {
  if (from.matched.length) {
    setTransition(from, to)
  }
})

function onAppRoute(path: string) {
  refreshAchievements()
  if (path === '/main') {
    syncAndShowModal()
  }
}

router.isReady().then(() => {
  void nextTick(() => onAppRoute(route.path))
})

watch(
  () => route.path,
  (path) => {
    void nextTick(() => onAppRoute(path))
  },
)
</script>

<template>
  <div class="stage" :style="{ backgroundImage: `url(${stageBgUrl})` }">
    <div class="phone-scaler">
      <div class="phone">
        <div class="phone-frame">
          <div class="phone-screen">
            <div class="dynamic-island" />
            <Transition name="boot-fade">
              <div v-if="isBootLoading" class="app-boot" aria-busy="true" aria-live="polite">
                <IosActivityIndicator />
              </div>
            </Transition>
            <div class="route-view" :class="{ 'route-view--booting': isBootLoading }">
              <RouterView v-slot="{ Component }">
                <Transition :name="transitionName">
                  <component :is="Component" :key="routeComponentKey(route)" class="route-page" />
                </Transition>
              </RouterView>
            </div>
            <IosNotificationBanner />
            <DailyRewardsModal />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
html,
body {
  background-color: white;
  margin: 0;
  padding: 0;
  width: 100%;
  height: var(--app-height, 100dvh);
  min-height: 0;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  touch-action: manipulation;
  overscroll-behavior: none;
}
#app {
  width: 100%;
  height: var(--app-height, 100dvh);
  min-height: 0;
  overflow: hidden;
}
* {
  box-sizing: border-box;
}

.stage {
  width: 100%;
  height: 100%;
  min-height: 0;
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #0a0a0a;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* iPhone 17 Pro — 393×852; scale = unitless min(1, по высоте/ширине контейнера) */
.phone-scaler {
  --phone-w: 417px;
  --phone-h: 876px;
  --scale: min(
    1,
    calc(100cqh / var(--phone-h)),
    calc(100cqw / var(--phone-w)),
    calc(100dvh / var(--phone-h)),
    calc(100dvw / var(--phone-w))
  );
  width: calc(var(--phone-w) * var(--scale));
  height: calc(var(--phone-h) * var(--scale));
  flex-shrink: 1;
  min-height: 0;
  border-radius: calc(62px * var(--scale));
  overflow: hidden;
  background: #161618;
  isolation: isolate;
}

.phone {
  --screen-w: 393px;
  --screen-h: 852px;
  --bezel: 12px;
  --radius-outer: 62px;
  --radius-inner: 50px;

  width: calc(var(--screen-w) + var(--bezel) * 2);
  height: calc(var(--screen-h) + var(--bezel) * 2);
  transform: scale(var(--scale));
  transform-origin: top left;
  position: relative;
  border-radius: var(--radius-outer);
  overflow: hidden;
  background: #161618;
}

.phone-frame {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  overflow: hidden;
  background: linear-gradient(145deg, #2a2a2c 0%, #161618 50%, #2a2a2c 100%);
  padding: var(--bezel);
  box-sizing: border-box;
  box-shadow:
    0 0 0 1.5px #0a0a0a inset,
    0 0 0 3px #3a3a3c inset,
    0 30px 80px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

.phone-screen {
  position: relative;
  width: 100%;
  height: 100%;
  --phone-inner-radius: var(--radius-inner);
  border-radius: var(--radius-inner);
  overflow: hidden;
  background: var(--bg, #fff);
  isolation: isolate;
}

.dynamic-island {
  position: absolute;
  top: 11px;
  left: 50%;
  transform: translateX(-50%);
  width: 124px;
  height: 36px;
  background: #000;
  border-radius: 999px;
  z-index: 100;
  pointer-events: none;
}

.app-boot {
  position: absolute;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.boot-fade-leave-active {
  transition: opacity 0.28s ease;
}

.boot-fade-leave-to {
  opacity: 0;
}

.route-view--booting {
  visibility: hidden;
}

.route-view {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.route-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.route-slide-forward-enter-active,
.route-slide-forward-leave-active,
.route-slide-back-enter-active,
.route-slide-back-leave-active {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  will-change: transform;
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
}

.route-slide-forward-enter-from {
  transform: translateX(100%);
}

.route-slide-forward-leave-to {
  transform: translateX(-28%);
}

.route-slide-back-enter-from {
  transform: translateX(-28%);
}

.route-slide-back-leave-to {
  transform: translateX(100%);
}

/* Мобильная / платформенная версия — без рамки телефона, на всю доступную высоту */
html.is-edge-to-edge .stage {
  padding: 0;
  background-image: none !important;
  background-color: var(--bg);
}

html.is-edge-to-edge .phone-scaler {
  --scale: 1;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 0;
  background: transparent;
}

html.is-edge-to-edge .phone {
  width: 100%;
  height: 100%;
  transform: none;
  border-radius: 0;
  background: transparent;
}

html.is-edge-to-edge .phone-frame {
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

html.is-edge-to-edge .phone-screen {
  border-radius: 0;
  --phone-inner-radius: 0px;
  --radius-inner: 0px;
}

html.is-edge-to-edge .dynamic-island {
  display: none;
}
</style>
