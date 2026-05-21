<script setup lang="ts">
import type { AvatarOption } from '@/data/avatars'
import CoverImage from '@/components/CoverImage.vue'
import IconClose from '~icons/solar/close-circle-bold'

defineProps<{
  show: boolean
  avatars: AvatarOption[]
  selected?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', url: string): void
}>()

function onBackdrop() {
  emit('close')
}

function onSelect(url: string) {
  emit('select', url)
  emit('close')
}
</script>

<template>
  <Teleport to=".phone-screen">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="picker-overlay phone-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Выбор аватара"
        @click.self="onBackdrop"
      >
        <div class="picker-sheet modal-surface">
          <div class="picker-head">
            <h2 class="picker-title">Выберите аватар</h2>
            <button type="button" class="picker-close" aria-label="закрыть" @click="onBackdrop">
              <IconClose />
            </button>
          </div>

          <div class="picker-grid">
            <button
              v-for="avatar in avatars"
              :key="avatar.id"
              type="button"
              :class="['picker-item', { selected: selected === avatar.url }]"
              :aria-label="`Аватар ${avatar.id}`"
              :aria-pressed="selected === avatar.url"
              @click="onSelect(avatar.url)"
            >
              <CoverImage
                :src="avatar.url"
                :alt="`Аватар ${avatar.id}`"
                class="picker-img"
                image-slot="avatar"
              />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.picker-overlay {
  position: absolute;
  inset: 0;
  z-index: 250;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.picker-sheet {
  width: 100%;
  max-width: 320px;
  background: var(--surface);
  border-radius: 22px;
  padding: 20px 18px 22px;
  color: var(--text);
}

.picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.picker-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
}

.picker-close {
  width: 32px;
  height: 32px;
  border: none;
  outline: none;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 50%;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;
}

.picker-close:active {
  background: var(--surface-muted);
}

.picker-close svg {
  width: 20px;
  height: 20px;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.picker-item {
  aspect-ratio: 1;
  border-radius: 50%;
  border: 3px solid transparent;
  padding: 0;
  background: var(--surface-soft);
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;
}

.picker-item:active {
  transform: scale(0.96);
}

.picker-item.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.picker-item :deep(.picker-img) {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .picker-sheet,
.modal-fade-leave-active .picker-sheet {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .picker-sheet,
.modal-fade-leave-to .picker-sheet {
  transform: scale(0.94);
  opacity: 0;
}
</style>
