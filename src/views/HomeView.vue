<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()

function onStart() {
  void router.push('/main')
}
</script>

<template>
  <div class="login">
    <div class="bg-glow" />

    <div class="content">
      <div class="logo">
        <div class="logo-shape">
          <svg viewBox="0 0 24 24" class="logo-heart" aria-hidden="true">
            <path
              d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.83A4.5 4.5 0 0 1 21 11c0 5.65-7 10-7 10z"
              fill="#fff"
            />
            <path
              d="M12 11.2 10.4 9.6l-1.6 1.6L12 14.4l3.2-3.2-1.6-1.6L12 11.2z"
              fill="#ff3d8a"
            />
          </svg>
        </div>
      </div>

      <h1 class="title">HEARTLINE</h1>
      <p class="tagline">Симулятор отношений<br />и общения</p>

      <AppButton @click="onStart">Начать игру</AppButton>
    </div>
  </div>
</template>

<style scoped>
.login {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse 90% 60% at 50% 40%, #1a1024 0%, #0d0814 60%, #08060f 100%);
  color: #fff;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
}

.bg-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 32%, rgba(255, 61, 138, 0.08) 0%, transparent 40%);
  pointer-events: none;
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

.logo {
  margin-bottom: 24px;
  filter: drop-shadow(0 4px 16px rgba(255, 61, 138, 0.25));
}

.logo-shape {
  width: 96px;
  height: 96px;
  border-radius: 28px 28px 28px 8px;
  background: linear-gradient(135deg, #ff3d8a 0%, #b14bff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.logo-heart {
  width: 52px;
  height: 52px;
}

.title {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 2px;
  margin: 0 0 12px;
  color: #fff;
  text-align: center;
}

.tagline {
  font-size: 15px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
  margin: 0 0 48px;
  line-height: 1.45;
}
</style>
