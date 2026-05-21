<script setup lang="ts">
import { LOBBY_CHAT_MESSAGES } from '@/data/lobbyChat'

/** Дублируем ленту для бесшовной прокрутки. */
const loopMessages = [...LOBBY_CHAT_MESSAGES, ...LOBBY_CHAT_MESSAGES]
</script>

<template>
  <section class="lobby" aria-hidden="true">
    <div class="lobby-head">
      <span class="lobby-live" />
      <span class="lobby-title">Общий чат</span>
      <span class="lobby-meta">сейчас онлайн</span>
    </div>

    <div class="lobby-viewport">
      <div class="lobby-fade lobby-fade--top" />
      <div class="lobby-fade lobby-fade--bottom" />

      <div class="lobby-watermark" aria-hidden="true">
        <div class="lobby-watermark__stamp">
          <span class="lobby-watermark__text">Скоро</span>
        </div>
      </div>

      <div class="lobby-track">
        <div
          v-for="(msg, index) in loopMessages"
          :key="`lobby-${index}`"
          :class="['lobby-msg', `lobby-msg--${msg.side}`]"
        >
          <div
            class="lobby-avatar"
            :style="{ background: `linear-gradient(135deg, ${msg.color} 0%, ${msg.color}99 100%)` }"
          >
            {{ msg.name.charAt(0) }}
          </div>
          <div class="lobby-bubble-wrap">
            <span class="lobby-name">{{ msg.name }}</span>
            <div class="lobby-bubble">{{ msg.text }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lobby {
  flex: 1;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  margin-top: 4px;
  margin-bottom: 8px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

.lobby-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.lobby-live {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 3px rgba(46, 199, 107, 0.25);
  animation: lobbyPulse 2s ease-in-out infinite;
}

@keyframes lobbyPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

.lobby-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.lobby-meta {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.lobby-viewport {
  position: relative;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.lobby-fade {
  position: absolute;
  left: 0;
  right: 0;
  height: 28px;
  z-index: 2;
  pointer-events: none;
}

.lobby-fade--top {
  top: 0;
  background: linear-gradient(180deg, var(--surface) 0%, transparent 100%);
}

.lobby-fade--bottom {
  bottom: 0;
  background: linear-gradient(0deg, var(--surface) 0%, transparent 100%);
}

.lobby-watermark {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  pointer-events: none;
}

.lobby-watermark__stamp {
  position: relative;
  padding: 14px 26px;
  border: 4px solid #c62828;
  transform: rotate(-12deg);
  opacity: 0.72;
  user-select: none;
}

.lobby-watermark__stamp::before {
  content: '';
  position: absolute;
  inset: 7px;
  border: 2px solid #c62828;
  pointer-events: none;
}

.lobby-watermark__text {
  display: block;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #c62828;
  line-height: 1;
  padding-left: 0.18em;
}

.lobby-track {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px 16px;
  animation: lobbyScroll 55s linear infinite;
  will-change: transform;
}

@keyframes lobbyScroll {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-50%);
  }
}

.lobby-msg {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 92%;
}

.lobby-msg--right {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.lobby-msg--left {
  align-self: flex-start;
}

.lobby-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.lobby-bubble-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.lobby-msg--right .lobby-bubble-wrap {
  align-items: flex-end;
}

.lobby-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 0 4px;
}

.lobby-bubble {
  padding: 8px 11px;
  border-radius: 14px;
  font-size: 12px;
  line-height: 1.35;
  color: var(--text);
  background: var(--surface-soft);
  border: 1px solid var(--border);
  word-break: break-word;
}

.lobby-msg--right .lobby-bubble {
  background: var(--accent-soft);
  border-color: rgba(177, 75, 255, 0.2);
  border-bottom-right-radius: 4px;
}

.lobby-msg--left .lobby-bubble {
  border-bottom-left-radius: 4px;
}
</style>
