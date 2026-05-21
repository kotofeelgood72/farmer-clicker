/** Пропорции слотов (CSS) */
export const IMAGE_ASPECT = {
  CHAT_CARD: '3 / 4.15',
  CHAT_CARD_FEATURED: '16 / 11',
  PORTRAIT: '3 / 4',
  AVATAR: '1 / 1',
} as const

/**
 * Целевые размеры файлов (px). ~2× от типичного CSS-размера, чтобы на Retina не было
 * даунскейла огромных PNG в маленьких блоках (артефакты на контурах).
 */
export const IMAGE_SLOT_PX = {
  /** Swiper-карточка на главной: slide 132px */
  card: { width: 280, height: 387, fit: 'cover' as const, position: 'top' as const },
  /** Сетка галереи (~3 колонки на 360px) */
  gallery: { width: 240, height: 320, fit: 'cover' as const, position: 'center' as const },
  /** Аватар в списке чатов 52px */
  avatar: { width: 128, height: 128, fit: 'cover' as const, position: 'top' as const },
  /** Превью без обрезки (свидания, contain) */
  preview: { width: 280, maxHeight: 520, fit: 'inside' as const },
} as const

export type ImageSlotKey = keyof typeof IMAGE_SLOT_PX
