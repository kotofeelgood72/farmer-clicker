<script setup lang="ts">
import statEnergy from '@/assets/ui/energy.png'
import statStone from '@/assets/ui/stone.png'
import { useUserAvatar } from '@/composables/useUserAvatar'

defineProps<{
  nickname: string
  level: number
  energy: number
  energyMax: number
  diamonds: number
}>()

defineEmits<{
  (e: 'profile'): void
}>()

const { selectedAvatar } = useUserAvatar()
</script>

<template>
  <header class="header">
    <button type="button" class="user" @click="$emit('profile')">
      <div class="avatar">
        <img
          v-if="selectedAvatar"
          :src="selectedAvatar"
          :alt="nickname"
          class="avatar-img"
        />
        <span v-else>{{ nickname.charAt(0) }}</span>
      </div>
      <div class="user-info">
        <div class="nickname">{{ nickname }}</div>
        <div class="level">Уровень {{ level }}</div>
      </div>
    </button>

    <div class="stats">
      <div class="stat">
        <img :src="statEnergy" alt="энергия" class="stat-img" />
        <span>{{ energy }}/{{ energyMax }}</span>
      </div>
      <div class="stat">
        <img :src="statStone" alt="алмазы" class="stat-img" />
        <span>{{ diamonds }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 56px 16px 10px;
  gap: 12px;
  background: #14141f;
  border-bottom: 1px solid #ffffff0c;
  margin-bottom: 16px;
}

.user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  text-align: left;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a3550 0%, #2a1f30 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  min-width: 0;
}

.nickname {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.level {
  font-size: 11px;
  color: #ffb83d;
  margin-top: 2px;
  font-weight: 500;
}

.stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.stat-img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  -webkit-user-drag: none;
}
</style>
