<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
import EnterItem from '@/components/EnterItem.vue'
import mainBgUrl from '@/assets/ui/main-bg.png'
import logoUrl from '@/assets/ui/logo.png'
import { showStartupInterstitial } from '@/ads/ads'
import { GAME_NAME } from '@/constants/game'

const router = useRouter()

function onStart() {
  showStartupInterstitial({ onClose: () => void router.push('/main') })
}
</script>

<template>
  <div class="login" :style="{ '--main-bg': `url(${mainBgUrl})` }">
    <div class="content page-enter">
      <EnterItem :order="0" solo class="logo-row">
        <img class="logo" :src="logoUrl" :alt="GAME_NAME" width="96" height="96" />
      </EnterItem>

      <EnterItem :order="1" solo>
        <h1 class="title">{{ GAME_NAME }}</h1>
      </EnterItem>
      <EnterItem :order="2" solo>
        <p class="tagline">Симулятор отношений<br />и общения</p>
      </EnterItem>

      <EnterItem :order="3" solo>
        <AppButton @click="onStart">Начать игру</AppButton>
      </EnterItem>
    </div>
  </div>
</template>

<style scoped>
.login {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg);
  background-image: var(--main-bg);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: var(--text);
  display: flex;
  flex-direction: column;
}

.content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px 48px;
}

.content :deep(.enter-item) {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.logo-row {
  margin-bottom: 24px;
}

.logo {
  display: block;
  width: 96px;
  height: 96px;
  object-fit: contain;
  filter: drop-shadow(0 8px 24px rgba(177, 75, 255, 0.22));
}

.title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.25;
  margin: 0 0 12px;
  color: var(--text);
  text-align: center;
  max-width: 280px;
}

.tagline {
  font-size: 15px;
  font-weight: 400;
  color: var(--text-muted);
  text-align: center;
  margin: 0 0 48px;
  line-height: 1.45;
}
</style>
