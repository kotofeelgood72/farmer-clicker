<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
}>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Transition name="modal">
    <div v-if="open" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-frame" @click.stop>
        <div class="modal-header">
          <div class="modal-title-plank">
            <span class="modal-title-text">{{ title }}</span>
          </div>
          <button class="modal-close" @click="emit('close')" aria-label="Закрыть">×</button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 50px 16px 16px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Outer wooden frame */
.modal-frame {
  position: relative;
  width: 100%;
  max-width: 460px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 14px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, #a06030 0%, #7a4418 50%, #5a3014 100%);
  border: 3px solid #3a1f0c;
  box-shadow:
    inset 0 3px 0 rgba(255, 220, 160, 0.35),
    inset 0 -3px 0 rgba(0, 0, 0, 0.4),
    inset 0 0 0 2px rgba(0, 0, 0, 0.2),
    0 20px 50px rgba(0, 0, 0, 0.8);
  font-family: 'Fredoka', 'Trebuchet MS', system-ui, sans-serif;
  color: #f3e9c8;
}

/* Bolt decorations on the corners */
.modal-frame::before,
.modal-frame::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #d8b070, #6a3a18);
  border: 1px solid #2a1408;
  box-shadow: inset 0 -1px 1px rgba(0, 0, 0, 0.5);
}
.modal-frame::before { top: 10px; left: 10px; }
.modal-frame::after  { top: 10px; right: 10px; }

/* Header: plank with title + close button */
.modal-header {
  position: relative;
  margin-top: -34px;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 56px;
}
.modal-title-plank {
  flex: 1;
  background:
    linear-gradient(180deg, #c89060 0%, #8a5a2a 50%, #6a3a18 100%);
  border: 3px solid #3a1f0c;
  border-radius: 14px;
  padding: 10px 50px 12px;
  text-align: center;
  position: relative;
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 160, 0.4),
    inset 0 -2px 0 rgba(0, 0, 0, 0.35),
    0 6px 12px rgba(0, 0, 0, 0.6);
}
.modal-title-plank::before,
.modal-title-plank::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #f0d090, #6a3a18);
  border: 1px solid #2a1408;
  transform: translateY(-50%);
}
.modal-title-plank::before { left: 12px; }
.modal-title-plank::after  { right: 12px; }

.modal-title-text {
  font-weight: 900;
  font-size: 18px;
  letter-spacing: 1.5px;
  color: #fff5d0;
  text-transform: uppercase;
  text-shadow:
    0 1px 0 #3a1f0c,
    0 2px 4px rgba(0, 0, 0, 0.8);
}

.modal-close {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ff8a8a 0%, #e63030 50%, #a01818 100%);
  border: 3px solid #5a0a0a;
  color: #fff5d0;
  font-size: 24px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding-bottom: 4px;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.4),
    inset 0 -2px 0 rgba(0, 0, 0, 0.4),
    0 3px 0 #5a0a0a,
    0 5px 10px rgba(0, 0, 0, 0.6);
  transition: transform 0.08s;
}
.modal-close:active {
  transform: translateY(2px);
}

/* Body content */
.modal-body {
  background:
    linear-gradient(180deg, #6a3a18 0%, #4a2410 100%);
  border: 2px solid #3a1f0c;
  border-radius: 14px;
  padding: 12px;
  overflow-y: auto;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.5),
    inset 0 -1px 0 rgba(255, 215, 130, 0.15);
  scrollbar-width: thin;
  scrollbar-color: #8a5a2a #2a1408;
}
.modal-body::-webkit-scrollbar {
  width: 8px;
}
.modal-body::-webkit-scrollbar-track {
  background: #2a1408;
  border-radius: 4px;
}
.modal-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #c08040, #6a3a18);
  border-radius: 4px;
}

/* Transition */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s;
}
.modal-enter-active .modal-frame,
.modal-leave-active .modal-frame {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-frame,
.modal-leave-to .modal-frame {
  transform: scale(0.85);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 44px 10px calc(10px + env(safe-area-inset-bottom));
  }
  .modal-frame {
    max-width: 100%;
    padding: 12px;
    border-radius: 18px;
  }
  .modal-header {
    margin-top: -28px;
    margin-bottom: 8px;
    min-height: 48px;
  }
  .modal-title-plank {
    padding: 8px 44px 9px;
    border-radius: 12px;
  }
  .modal-title-text {
    font-size: 15px;
    letter-spacing: 1px;
  }
  .modal-close {
    width: 36px;
    height: 36px;
    font-size: 20px;
    border-width: 2px;
  }
  .modal-body {
    padding: 10px;
    border-radius: 12px;
  }
}
@media (max-width: 400px) {
  .modal-title-text {
    font-size: 13px;
  }
  .modal-close {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
}
</style>
