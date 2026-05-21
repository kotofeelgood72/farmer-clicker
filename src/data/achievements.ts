export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type AchievementCategory =
  | 'chat'
  | 'dates'
  | 'progress'
  | 'swipes'
  | 'secret'
  | 'event'
  | 'economy'

export interface AchievementDefinition {
  id: string
  name: string
  desc: string
  category: AchievementCategory
  rarity: AchievementRarity
}

export const ACHIEVEMENT_CATEGORIES: Record<
  AchievementCategory,
  { title: string }
> = {
  chat: { title: 'Общение' },
  dates: { title: 'Свидания' },
  progress: { title: 'Прогресс' },
  swipes: { title: 'Свайпы' },
  secret: { title: 'Секретные' },
  event: { title: 'Ивентовые' },
  economy: { title: 'Донат / экономика' },
}

export const CATEGORY_ORDER: AchievementCategory[] = [
  'chat',
  'dates',
  'progress',
  'swipes',
  'secret',
  'event',
  'economy',
]

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { id: 'c1', category: 'chat', rarity: 'common', name: 'Первый шаг', desc: 'Отправить первое сообщение' },
  { id: 'c2', category: 'chat', rarity: 'common', name: 'Общительный', desc: 'Отправить 100 сообщений' },
  { id: 'c3', category: 'chat', rarity: 'rare', name: 'Болтун', desc: 'Отправить 500 сообщений' },
  { id: 'c4', category: 'chat', rarity: 'rare', name: 'Ночной собеседник', desc: 'Написать ночью (22:00–06:00)' },
  { id: 'c5', category: 'chat', rarity: 'rare', name: 'Скоростной ответ', desc: 'Ответить в течение 5 секунд' },
  { id: 'c6', category: 'chat', rarity: 'epic', name: 'Длинная переписка', desc: '50 ваших сообщений в одном чате' },
  { id: 'c7', category: 'chat', rarity: 'epic', name: 'Любимчик', desc: 'Набрать 300 очков симпатии' },
  { id: 'c8', category: 'chat', rarity: 'legendary', name: 'Красноречивый', desc: 'Завершить 3 переписки' },

  { id: 'd1', category: 'dates', rarity: 'common', name: 'Первое свидание', desc: 'Пройти первое свидание' },
  { id: 'd2', category: 'dates', rarity: 'rare', name: 'Романтик', desc: 'Пройти 3 свидания' },
  { id: 'd3', category: 'dates', rarity: 'rare', name: 'Идеальная пара', desc: 'Максимум симпатии в переписке' },
  { id: 'd4', category: 'dates', rarity: 'epic', name: 'Незабываемый вечер', desc: 'Пройти 5 свиданий' },
  { id: 'd5', category: 'dates', rarity: 'epic', name: 'Король флирта', desc: 'Пройти 10 свиданий' },
  { id: 'd6', category: 'dates', rarity: 'legendary', name: 'Любовь с первого свайпа', desc: 'Получить первый мэтч' },
  { id: 'd7', category: 'dates', rarity: 'legendary', name: 'Сердцеед', desc: 'Начать чат с 10 девушками' },

  { id: 'p1', category: 'progress', rarity: 'common', name: 'Новичок', desc: 'Начать первую переписку' },
  { id: 'p2', category: 'progress', rarity: 'rare', name: 'Опытный', desc: 'Достичь 50% прогресса в чате' },
  { id: 'p3', category: 'progress', rarity: 'epic', name: 'Ветеран', desc: 'Завершить первую переписку' },
  { id: 'p4', category: 'progress', rarity: 'rare', name: 'Коллекционер', desc: 'Начать чат с 5 девушками' },
  { id: 'p5', category: 'progress', rarity: 'legendary', name: 'Легенда чатов', desc: 'Начать чат со всеми девушками' },
  { id: 'p6', category: 'progress', rarity: 'epic', name: 'Премиум-игрок', desc: 'Купить премиум' },
  { id: 'p7', category: 'progress', rarity: 'rare', name: 'Постоянный игрок', desc: 'Серия входов 7 дней' },
  { id: 'p8', category: 'progress', rarity: 'legendary', name: 'Верный фанат', desc: 'Серия входов 30 дней' },

  { id: 'sw1', category: 'swipes', rarity: 'common', name: 'Первый мэтч', desc: 'Получить первый мэтч' },
  { id: 'sw2', category: 'swipes', rarity: 'rare', name: 'Магнит симпатий', desc: 'Получить 10 мэтчей' },
  { id: 'sw3', category: 'swipes', rarity: 'epic', name: 'Идеальный вкус', desc: '10 мэтчей и 20+ анкет' },
  { id: 'sw4', category: 'swipes', rarity: 'epic', name: 'Свайп-машина', desc: 'Просмотреть 50 анкет' },
  { id: 'sw5', category: 'swipes', rarity: 'rare', name: 'Суперлайк', desc: 'Потратить 50 энергии на свайпы' },
  { id: 'sw6', category: 'swipes', rarity: 'legendary', name: 'Неотразимый', desc: 'Получить 20 мэтчей' },

  { id: 'se1', category: 'secret', rarity: 'epic', name: 'Тайная ветка', desc: 'Завершить переписку с высокой симпатией' },
  { id: 'se2', category: 'secret', rarity: 'epic', name: 'Ревность', desc: 'Завершить 2 переписки' },
  { id: 'se3', category: 'secret', rarity: 'rare', name: 'Драматичная концовка', desc: 'Завершить переписку с низкой симпатией' },
  { id: 'se4', category: 'secret', rarity: 'legendary', name: 'Истинная любовь', desc: 'Максимум симпатии и свидание' },
  { id: 'se5', category: 'secret', rarity: 'legendary', name: 'Коллекция сердец', desc: 'Завершить 5 переписок' },
  { id: 'se6', category: 'secret', rarity: 'epic', name: 'Неожиданный поворот', desc: 'Пройти 2 свидания подряд в один день' },

  { id: 'e1', category: 'event', rarity: 'rare', name: 'Летний вайб', desc: 'Зайти в игру в июне' },
  { id: 'e2', category: 'event', rarity: 'rare', name: 'Новогоднее чудо', desc: 'Зайти в игру в январе' },
  { id: 'e3', category: 'event', rarity: 'common', name: 'Валентинка', desc: 'Зайти 14 февраля' },
  { id: 'e4', category: 'event', rarity: 'epic', name: 'Хэллоуинская ночь', desc: 'Зайти в игру в октябре' },

  { id: 'm1', category: 'economy', rarity: 'common', name: 'Первые алмазы', desc: 'Потратить алмазы в чате' },
  { id: 'm2', category: 'economy', rarity: 'epic', name: 'Богач', desc: 'Накопить 500 алмазов' },
  { id: 'm3', category: 'economy', rarity: 'rare', name: 'Шопоголик', desc: 'Купить энергию в магазине' },
  { id: 'm4', category: 'economy', rarity: 'legendary', name: 'Щедрый', desc: 'Потратить 200 алмазов' },
  { id: 'm5', category: 'economy', rarity: 'rare', name: 'Без ожидания', desc: 'Потратить 50 алмазов в чатах' },
]

/** Градиенты для превью в профиле. */
export const PROFILE_ACHIEVEMENT_GRADIENTS: Record<string, string> = {
  c1: 'linear-gradient(135deg, #5fb8ff 0%, #5b3df0 100%)',
  c2: 'linear-gradient(135deg, #ff3d8a 0%, #b14bff 100%)',
  c3: 'linear-gradient(135deg, #6e8cff 0%, #3d5af0 100%)',
  d1: 'linear-gradient(135deg, #ffb83d 0%, #ff7a3d 100%)',
  d2: 'linear-gradient(135deg, #ff7a9a 0%, #ff3d8a 100%)',
  p1: 'linear-gradient(135deg, #5fb8ff 0%, #5b3df0 100%)',
  sw1: 'linear-gradient(135deg, #ff3d8a 0%, #b14bff 100%)',
  m1: 'linear-gradient(135deg, #b14bff 0%, #6e3df0 100%)',
}

export const DEFAULT_PROFILE_GRADIENT =
  'linear-gradient(135deg, #c4c8d4 0%, #9aa3b5 100%)'
