<script setup lang="ts">
defineProps<{
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Transition name="confirm">
    <div v-if="open" class="confirm-overlay" @click.self="emit('cancel')">
      <div class="confirm-frame" role="alertdialog" aria-modal="true" @click.stop>
        <p v-if="title" class="confirm-title">{{ title }}</p>
        <p class="confirm-message">{{ message }}</p>
        <div class="confirm-actions">
          <button type="button" class="confirm-btn cancel" @click="emit('cancel')">
            {{ cancelLabel ?? 'Нет' }}
          </button>
          <button
            type="button"
            class="confirm-btn ok"
            :class="{ danger }"
            @click="emit('confirm')"
          >
            {{ confirmLabel ?? 'Да' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.confirm-frame {
  width: 100%;
  max-width: 340px;
  padding: 18px 16px 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #6a3a18 0%, #4a2410 100%);
  border: 3px solid #3a1f0c;
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 160, 0.25),
    inset 0 -2px 0 rgba(0, 0, 0, 0.4),
    0 16px 40px rgba(0, 0, 0, 0.85);
  font-family: 'Fredoka', 'Trebuchet MS', system-ui, sans-serif;
  color: #f3e9c8;
  text-align: center;
}

.confirm-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 900;
  color: #ffd95a;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}

.confirm-message {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  color: #fff5d0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.confirm-btn {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 2px solid #4a2810;
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 160, 0.35),
    inset 0 -2px 0 rgba(0, 0, 0, 0.35),
    0 3px 0 #3a1f0c,
    0 4px 6px rgba(0, 0, 0, 0.5);
  transition: transform 0.08s;
}

.confirm-btn:active {
  transform: translateY(2px);
}

.confirm-btn.cancel {
  background: linear-gradient(180deg, #8a7050 0%, #5a4838 50%, #3a2a20 100%);
  color: #fff5d0;
}

.confirm-btn.ok {
  background: linear-gradient(180deg, #7ee06a 0%, #3aa84a 50%, #1e6c2e 100%);
  border-color: #0c4018;
  color: #fff5d0;
}

.confirm-btn.ok.danger {
  background: linear-gradient(180deg, #e85a5a 0%, #b02020 50%, #801010 100%);
  border-color: #4a0a0a;
}

.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.18s;
}
.confirm-enter-active .confirm-frame,
.confirm-leave-active .confirm-frame {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
.confirm-enter-from .confirm-frame,
.confirm-leave-to .confirm-frame {
  transform: scale(0.88);
}
</style>
