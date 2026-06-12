<script setup lang="ts">
import IconHome from '~icons/solar/home-2-bold'
import IconChat from '~icons/solar/chat-round-dots-bold'
import IconHeart from '~icons/solar/heart-bold'
import IconUser from '~icons/solar/user-bold'
import cardsIcon from '@/assets/ui/cards.png'

defineProps<{
  active?: 'home' | 'chats' | 'swipe' | 'dates' | 'profile'
  chatsBadge?: number
}>()

defineEmits<{
  (e: 'navigate', tab: 'home' | 'chats' | 'swipe' | 'dates' | 'profile'): void
}>()
</script>

<template>
  <nav class="bottom-nav">
    <button
      data-tour="nav-home"
      :class="['nav-item', { active: active === 'home' }]"
      @click="$emit('navigate', 'home')"
    >
      <span class="icon-box">
        <IconHome class="nav-icon" />
      </span>
      <span class="nav-label">Главная</span>
    </button>

    <button
      data-tour="nav-chats"
      :class="['nav-item', { active: active === 'chats' }]"
      @click="$emit('navigate', 'chats')"
    >
      <span class="icon-box">
        <IconChat class="nav-icon" />
        <span v-if="chatsBadge" class="badge">{{ chatsBadge }}</span>
      </span>
      <span class="nav-label">Чаты</span>
    </button>

    <button
      data-tour="nav-swipe"
      :class="['nav-item', 'nav-item--swipe', { active: active === 'swipe' }]"
      aria-label="свайп"
      @click="$emit('navigate', 'swipe')"
    >
      <span class="swipe-fab">
        <img :src="cardsIcon" alt="свайп" class="swipe-fab-icon" />
      </span>
    </button>

    <button
      data-tour="nav-dates"
      :class="['nav-item', { active: active === 'dates' }]"
      @click="$emit('navigate', 'dates')"
    >
      <span class="icon-box">
        <IconHeart class="nav-icon" />
      </span>
      <span class="nav-label">Свидания</span>
    </button>

    <button
      data-tour="nav-profile"
      :class="['nav-item', { active: active === 'profile' }]"
      @click="$emit('navigate', 'profile')"
    >
      <span class="icon-box">
        <IconUser class="nav-icon" />
      </span>
      <span class="nav-label">Профиль</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: calc(8px * var(--ui-density, 1)) 6px
    calc(12px * var(--ui-density, 1) + env(safe-area-inset-bottom, 0px));
  background: var(--nav-bg);
  border-top: 1px solid var(--hairline);
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(4px * var(--ui-density, 1));
  flex: 1;
  padding: 2px;
  background: none;
  border: none;
  outline: none;
  color: var(--text-dim);
  font-size: calc(10px * var(--ui-scale, 1));
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease;
}

.icon-box {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-icon {
  width: calc(22px * var(--ui-scale, 1));
  height: calc(22px * var(--ui-scale, 1));
}

.nav-item.active {
  color: var(--accent);
}

.nav-item.active .nav-icon {
  color: var(--accent);
  filter: drop-shadow(0 0 6px rgba(177, 75, 255, 0.35));
}

.nav-label {
  line-height: var(--lh-micro);
  font-weight: 600;
  text-align: center;
}

.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--danger);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--nav-bg);
}

/* center swipe FAB */
.nav-item--swipe {
  position: relative;
  padding: 0;
}

.swipe-fab {
  width: calc(54px * var(--ui-scale, 1));
  height: calc(54px * var(--ui-scale, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: calc(-12px * var(--ui-density, 1));
  margin-bottom: calc(-8px * var(--ui-density, 1));
  transition: transform 0.15s ease;
  filter: drop-shadow(0 6px 14px rgba(91, 61, 240, 0.45));
}

.nav-item--swipe:active .swipe-fab {
  transform: scale(0.94);
}

.swipe-fab-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  -webkit-user-drag: none;
}

.nav-item--swipe.active .swipe-fab {
  filter: drop-shadow(0 6px 18px rgba(177, 75, 255, 0.65));
}
</style>
