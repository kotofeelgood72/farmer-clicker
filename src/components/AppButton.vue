<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'violet'
    fullWidth?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    fullWidth: true,
    disabled: false,
    type: 'button',
  },
)

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="['app-btn', `app-btn--${variant}`, { 'app-btn--full': fullWidth }]"
    @click="$emit('click', $event)"
  >
    <span v-if="$slots.icon" class="app-btn__icon">
      <slot name="icon" />
    </span>
    <span class="app-btn__label">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  border: none;
  outline: none;
  border-radius: 16px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
  -webkit-appearance: none;
  appearance: none;
}

.app-btn:focus,
.app-btn:focus-visible {
  outline: none;
}

.app-btn--full {
  width: 100%;
  /* max-width: 320px; */
}

.app-btn--primary {
  background: linear-gradient(90deg, #ff3d8a 0%, #b14bff 100%);
  box-shadow: 0 4px 14px rgba(255, 61, 138, 0.18);
}

.app-btn--secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
}

.app-btn--violet {
  background: #5b3df0;
  box-shadow: 0 4px 14px rgba(91, 61, 240, 0.25);
}

.app-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.app-btn--primary:active:not(:disabled) {
  box-shadow: 0 4px 12px rgba(255, 61, 138, 0.3);
}

.app-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
