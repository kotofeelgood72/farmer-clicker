<script setup lang="ts">
import type { AvatarOption } from '@/data/avatars'
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
  <Teleport to="body">
    <Transition name="picker-fade">
      <div v-if="show" class="picker-backdrop" @click.self="onBackdrop">
        <div class="picker-sheet modal-surface modal-surface--dark" role="dialog" aria-modal="true" aria-label="Выбор аватара">
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
              <img :src="avatar.url" :alt="`Аватар ${avatar.id}`" class="picker-img" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.picker-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(8, 6, 16, 0.92);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
}

.picker-sheet {
  width: 100%;
  max-width: 420px;
  background: #14141f;
  border-radius: 20px 20px 18px 18px;
  padding: 16px 16px 20px;
}

.picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.picker-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
}

.picker-close {
  width: 32px;
  height: 32px;
  border: none;
  outline: none;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.15s ease;
}

.picker-item:active {
  transform: scale(0.96);
}

.picker-item.selected {
  border-color: #b14bff;
  box-shadow: 0 0 0 2px rgba(177, 75, 255, 0.35);
}

.picker-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 0.25s ease;
}

.picker-fade-enter-active .picker-sheet,
.picker-fade-leave-active .picker-sheet {
  transition: transform 0.25s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
}

.picker-fade-enter-from .picker-sheet,
.picker-fade-leave-to .picker-sheet {
  transform: translateY(24px);
}
</style>
