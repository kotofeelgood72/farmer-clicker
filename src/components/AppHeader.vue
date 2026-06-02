<script setup lang="ts">
import { toRefs } from 'vue'
import statEnergy from '@/assets/ui/energy.png'
import statStone from '@/assets/ui/stone.png'
import { usePremium } from '@/composables/usePremium'
import { usePremiumResourceLabel } from '@/composables/usePremiumResourceLabel'
import { useUserAvatar } from '@/composables/useUserAvatar'
import IconCrown from '~icons/solar/crown-bold'

const props = defineProps<{
  nickname: string
  energy: number
  diamonds: number
}>()

const { energy, diamonds } = toRefs(props)
const energyLabel = usePremiumResourceLabel(energy)
const diamondsLabel = usePremiumResourceLabel(diamonds)

defineEmits<{
  (e: 'profile'): void
  (e: 'shop'): void
  (e: 'shop-energy'): void
}>()

const { selectedAvatar } = useUserAvatar()
const { isPremium } = usePremium()
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
        <div class="nickname-row">
          <div class="nickname">{{ nickname }}</div>
          <IconCrown
            v-if="isPremium"
            class="nickname-crown"
            aria-label="Премиум"
          />
        </div>
      </div>
    </button>

    <div class="stats">
      <button type="button" class="stat stat--clickable" @click="$emit('shop-energy')">
        <img :src="statEnergy" alt="энергия" class="stat-img" />
        <span class="stat-value">{{ energyLabel }}</span>
      </button>
      <button type="button" class="stat stat--clickable" @click="$emit('shop')">
        <img :src="statStone" alt="алмазы" class="stat-img" />
        <span class="stat-value">{{ diamondsLabel }}</span>
      </button>
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
  background: var(--header-bg);
  border-bottom: 1px solid var(--hairline);
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
  background: var(--gradient-brand);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
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

.nickname-row {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
}

.nickname {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nickname-crown {
  flex-shrink: 0;
  width: 15px;
  height: 15px;
  color: #ffb83d;
  filter: drop-shadow(0 0 4px rgba(255, 184, 61, 0.45));
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
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
}

.stat--clickable {
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
}

.stat--clickable:active {
  opacity: 0.75;
}

.stat-img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  -webkit-user-drag: none;
}

.stat-value {
  min-width: 1ch;
  line-height: 1;
}
</style>
