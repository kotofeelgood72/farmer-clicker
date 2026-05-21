import { onMounted } from 'vue'
import { initNotificationBaselines } from '@/composables/useInAppNotifications'

/** Однократная инициализация базовых значений для уведомлений (без показа баннеров). */
export function useNotificationWatcher() {
  onMounted(() => {
    initNotificationBaselines()
  })
}
