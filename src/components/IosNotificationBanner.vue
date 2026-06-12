<script setup lang="ts">
import { useAppNavigation } from '@/composables/useAppNavigation'
import {
  useInAppNotifications,
  type InAppNotification,
  type InAppNotificationType,
} from '@/composables/useInAppNotifications'

import IconCup from '~icons/solar/cup-star-bold'
import IconHeart from '~icons/solar/heart-bold'
import IconChat from '~icons/solar/chat-round-dots-bold'
import IconCalendar from '~icons/solar/calendar-bold'
import IconClose from '~icons/solar/close-circle-bold'

const { pushFrom } = useAppNavigation()
const { visible, dismissing, dismiss, tapNotification } = useInAppNotifications()

const iconByType: Record<InAppNotificationType, typeof IconCup> = {
  achievement: IconCup,
  date_available: IconCalendar,
  level_up: IconHeart,
  slow_reply: IconChat,
  misses_you: IconHeart,
}

const tintByType: Record<InAppNotificationType, string> = {
  achievement: 'linear-gradient(135deg, #ffb83d 0%, #ff7a3d 100%)',
  date_available: 'linear-gradient(135deg, #ff6b9d 0%, #b14bff 100%)',
  level_up: 'linear-gradient(135deg, #b14bff 0%, #ff4d8e 100%)',
  slow_reply: 'linear-gradient(135deg, #5fb8ff 0%, #5b3df0 100%)',
  misses_you: 'linear-gradient(135deg, #ff4d8e 0%, #b14bff 100%)',
}

function iconFor(n: InAppNotification) {
  return iconByType[n.type]
}

function onTap(n: InAppNotification) {
  const to = tapNotification(n)
  if (to) void pushFrom(to)
}

function onDismiss() {
  dismiss()
}
</script>

<template>
  <Transition name="ios-notif">
    <div
      v-if="visible"
      :class="['ios-notif', { 'ios-notif--out': dismissing }]"
      role="status"
    >
      <button type="button" class="ios-notif__main" @click="onTap(visible)">
        <span
          class="ios-notif__icon"
          :style="{ background: tintByType[visible.type] }"
        >
          <component :is="iconFor(visible)" />
        </span>
        <span class="ios-notif__text">
          <span class="ios-notif__title">{{ visible.title }}</span>
          <span class="ios-notif__body">{{ visible.body }}</span>
        </span>
      </button>
      <button
        type="button"
        class="ios-notif__close"
        aria-label="Закрыть"
        @click.stop="onDismiss"
      >
        <IconClose />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.ios-notif {
  position: absolute;
  top: 48px;
  left: 10px;
  right: 10px;
  z-index: 110;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 8px 10px 12px;
  border-radius: 18px;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow:
    0 8px 28px rgba(30, 20, 50, 0.18),
    0 0 0 0.5px rgba(255, 255, 255, 0.8) inset;
}

.ios-notif__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  outline: none;
}

.ios-notif__main:active {
  opacity: 0.85;
}

.ios-notif__close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: color 0.15s ease, background 0.15s ease;
}

.ios-notif__close svg {
  width: 22px;
  height: 22px;
}

.ios-notif__close:hover {
  color: var(--text-muted);
  background: var(--surface-soft);
}

.ios-notif__close:active {
  transform: scale(0.92);
}

.ios-notif__icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.ios-notif__icon svg {
  width: 20px;
  height: 20px;
}

.ios-notif__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ios-notif__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  line-height: var(--lh-compact);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ios-notif__body {
  font-size: 13px;
  color: var(--text-muted);
  line-height: var(--lh-ui);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ios-notif-enter-active {
  transition:
    transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.35s ease;
}

.ios-notif-leave-active,
.ios-notif--out {
  transition:
    transform 0.28s cubic-bezier(0.4, 0, 1, 1),
    opacity 0.25s ease;
}

.ios-notif-enter-from {
  opacity: 0;
  transform: translateY(-120%) scale(0.92);
}

.ios-notif-leave-to,
.ios-notif--out {
  opacity: 0;
  transform: translateY(-18px) scale(0.96);
}
</style>
