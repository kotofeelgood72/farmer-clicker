<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
import EnterItem from '@/components/EnterItem.vue'
import mainBgUrl from '@/assets/ui/main-bg.png'
import logoUrl from '@/assets/ui/logo.png'
import { scheduleStartupInterstitial, showStartupInterstitial } from '@/ads/ads'
import { GAME_NAME } from '@/constants/game'
import { gameplayInit } from '@/yandex/sdk'

const router = useRouter()

function onStart() {
  const continueGame = () => {
    gameplayInit()
    void router.push('/main')
  }

  if (showStartupInterstitial({ onClose: continueGame })) return
  scheduleStartupInterstitial({ onClose: continueGame })
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
  padding: 0 calc(20px * var(--ui-density, 1)) calc(20px * var(--ui-density, 1));
  min-height: 0;
}

.content :deep(.enter-item) {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.logo-row {
  margin-bottom: calc(18px * var(--ui-density, 1));
}

.logo {
  display: block;
  width: calc(88px * var(--ui-scale, 1));
  height: calc(88px * var(--ui-scale, 1));
  object-fit: contain;
  filter: drop-shadow(0 8px 24px rgba(177, 75, 255, 0.22));
}

.title {
  font-size: calc(24px * var(--ui-scale, 1));
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: var(--lh-compact);
  margin: 0 0 calc(8px * var(--ui-density, 1));
  color: var(--text);
  text-align: center;
  max-width: 280px;
}

.tagline {
  font-size: calc(14px * var(--ui-scale, 1));
  font-weight: 400;
  color: var(--text-muted);
  text-align: center;
  margin: 0 0 calc(28px * var(--ui-density, 1));
  line-height: var(--lh-body);
}

.content :deep(.app-btn) {
  max-width: min(280px, 100%);
  margin-inline: auto;
}
</style>
