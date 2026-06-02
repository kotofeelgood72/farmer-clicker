<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import IconShield from '~icons/solar/shield-warning-bold'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    confirmVariant?: 'primary' | 'secondary' | 'violet' | 'danger'
    closeOnBackdrop?: boolean
  }>(),
  {
    message: '',
    confirmLabel: 'Подтвердить',
    cancelLabel: 'Отмена',
    confirmVariant: 'danger',
    closeOnBackdrop: true,
  },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function close() {
  emit('update:open', false)
}

function onCancel() {
  emit('cancel')
  close()
}

function onConfirm() {
  emit('confirm')
  close()
}

function onBackdrop() {
  if (!props.closeOnBackdrop) return
  onCancel()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div
        v-if="open"
        class="confirm-overlay phone-modal-overlay"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="title ? 'confirm-dialog-title' : undefined"
        @click.self="onBackdrop"
      >
        <div class="confirm-card modal-surface">
          <div class="confirm-icon" aria-hidden="true">
            <IconShield />
          </div>
          <h2 id="confirm-dialog-title" class="confirm-title">{{ title }}</h2>
          <p v-if="message" class="confirm-message">{{ message }}</p>
          <div class="confirm-actions">
            <AppButton variant="secondary" @click="onCancel">{{ cancelLabel }}</AppButton>
            <AppButton :variant="confirmVariant" @click="onConfirm">{{ confirmLabel }}</AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: confirm-overlay-fade 0.28s ease-out;
}

@keyframes confirm-overlay-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.confirm-card {
  width: 100%;
  max-width: 320px;
  padding: 26px 22px 22px;
  background: var(--surface);
  border-radius: 22px;
  text-align: center;
  animation: confirm-card-pop 0.38s cubic-bezier(0.22, 1.2, 0.36, 1);
}

@keyframes confirm-card-pop {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.confirm-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 61, 90, 0.12);
  color: var(--danger);
}

.confirm-icon svg {
  width: 30px;
  height: 30px;
}

.confirm-title {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.25;
}

.confirm-message {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.45;
  color: var(--text-muted);
}

.confirm-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-leave-to {
  opacity: 0;
}
</style>
