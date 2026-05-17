# 📺 ПЛАН ИНТЕГРАЦИИ РЕКЛАМЫ — «КУЗНЕЦ УДАЧИ»

Платформа: **Yandex Games SDK v2**
Документация: https://yandex.ru/dev/games/doc/ru/sdk/sdk-adv

---

## 1. ТИПЫ РЕКЛАМЫ

| Тип | API | Когда | Поведение SDK |
|---|---|---|---|
| **Sticky Banner** | автоматический | всегда | размещается платформой Yandex над/под игрой автоматически — кода не требует |
| **Interstitial (Fullscreen)** | `ysdk.adv.showFullscreenAdv()` | принудительная пауза | SDK сам ограничивает: **не чаще 1 раза в 60 сек** и **не показывает в первые 60 сек** после старта игры |
| **Rewarded Video** | `ysdk.adv.showRewardedVideo()` | по желанию игрока | за просмотр игрок получает бонус, который мы выдаём в callback `onRewarded` |

**Запреты Yandex (важно):**
- Нельзя показывать interstitial во время активного gameplay (когда игрок кликает по наковальне).
- Нельзя показывать чаще 1 раза в минуту (SDK сам режет).
- Rewarded — только после явного клика игрока на кнопку «Смотреть».

---

## 2. INTERSTITIAL (полноэкранная)

Показываем в **естественных точках паузы**, никогда не прерывая клики. Внутренний кулдаун держим **≥ 90 секунд** (на 30с строже, чем у SDK, чтобы не бесить игрока).

### Точки показа

| # | Триггер | Файл / место | Условия |
|---|---|---|---|
| 1 | **Закрытие модалки улучшений** (после покупки ≥ 1 апгрейда) | `UpgradesModal.vue` — `@close` | `boughtCount >= 1 && cooldownOk` |
| 2 | **Закрытие модалки заказов** (после `completeOrder`) | `OrdersModal.vue` — после выдачи награды | `cooldownOk && totalOrdersCompleted % 3 === 0` |
| 3 | **Выход из ForgeView** | `ForgeView.vue` — `@close` | `cooldownOk` |
| 4 | **Возврат в игру после офлайн-выплаты** | popup офлайн-награды | один раз за сессию |
| 5 | **Открытие нового региона** (карта миров) | `unlockRegion()` в store | важная веха — всегда |
| 6 | **Уровень наковальни кратен 5** (5, 10, 15, …) | `forgeLevelDisplay` watcher | один раз на уровень |
| 7 | **Возврат вкладки после скрытия > 30 сек** | `visibilitychange` → visible | `hiddenDuration > 30000 && cooldownOk` |

### Логика cooldown
```ts
// stores/ads.ts (новый pinia store или плоский модуль)
let lastInterstitialAt = 0
const MIN_GAP = 90_000
const FIRST_GAP = 60_000
const sessionStart = Date.now()

function canShowInterstitial(): boolean {
  const now = Date.now()
  if (now - sessionStart < FIRST_GAP) return false
  if (now - lastInterstitialAt < MIN_GAP) return false
  if (!ysdk) return false
  return true
}

async function showInterstitial(reason: string) {
  if (!canShowInterstitial()) return
  lastInterstitialAt = Date.now()
  // Mute game audio while ad plays
  setMusicEnabled(false)
  setSfxEnabled(false)
  await ysdk.adv.showFullscreenAdv({
    callbacks: {
      onClose: () => {
        setMusicEnabled(game.settings.music)
        setSfxEnabled(game.settings.sound)
      },
      onError: () => {
        setMusicEnabled(game.settings.music)
        setSfxEnabled(game.settings.sound)
      },
    },
  })
}
```

---

## 3. REWARDED VIDEO (за награду)

Это **ключевой источник дохода** идл-кликера. Размещаем кнопки «📺 Смотреть» с конкретной наградой. Игрок сам решает.

### Точки показа

| # | Где | Кнопка | Награда | Кулдаун |
|---|---|---|---|---|
| 1 | **Popup офлайн-награды** при возврате в игру | «Удвоить х2» | пассивный_доход × офлайн × 2 (вместо ×1) | 1 раз за сессию |
| 2 | **Магазин — секция бесплатно** | «Бесплатный бустер — x2 Золото 5 мин» | `goldX2Until += 300_000` | каждые 5 мин |
| 3 | **Магазин — секция бесплатно** | «Бесплатный бустер — x2 Удача 5 мин» | `critX2Until += 300_000` | каждые 5 мин |
| 4 | **Магазин — секция бесплатно** | «Бесплатный бустер — x2 Скорость 5 мин» | `autoClickUntil += 300_000` | каждые 5 мин |
| 5 | **Сундуки — таймер ежедневного** | «Открыть сейчас» (вместо ожидания) | сбрасывает `dailyChestAt`, выдаёт сундук | заменяет 24-часовое ожидание |
| 6 | **Сундуки — обычный** | «📺 Бесплатный обычный сундук» | +1 Обычный сундук | каждые 30 мин |
| 7 | **Заказы — после выполнения** | «х2 награды» (10 сек на решение) | `gold ×= 2`, `diamonds ×= 2` | каждый заказ опционально |
| 8 | **Заказы — истёкший таймер** | «Продлить на 60 сек» | `order.timeLeft += 60` | 1 раз на заказ |
| 9 | **Достижения — клейм награды** | «х2 алмазы» | `reward × 2` | каждое достижение |
| 10 | **Главный экран — Daily Free Gift** (новый блок) | «Подарок дня — 1000 золота» | `+1000 × forgeLevel` золота | 1 раз / 4 часа |
| 11 | **Кнопка «Получить ещё»** в окне награды сундука | «х2 содержимое» | удваивает только что выпавшую награду | каждый сундук |
| 12 | **Prestige экран** (когда будет) | «х2 ковочные души» | `souls ×= 2` за этот сброс | каждый prestige |
| 13 | **Кнопка-паровозик** на главном экране | «📺 +5 алмазов» | `diamonds += 5` | каждые 10 мин |

### Шаблон вызова
```ts
async function showRewarded(onReward: () => void) {
  if (!ysdk) return
  let granted = false
  setMusicEnabled(false)
  setSfxEnabled(false)
  await ysdk.adv.showRewardedVideo({
    callbacks: {
      onOpen:    () => {},
      onRewarded: () => { granted = true },
      onClose:   () => {
        if (granted) onReward()
        setMusicEnabled(game.settings.music)
        setSfxEnabled(game.settings.sound)
      },
      onError:   () => {
        setMusicEnabled(game.settings.music)
        setSfxEnabled(game.settings.sound)
      },
    },
  })
}
```

---

## 4. STICKY BANNER

Включается параметром игры в кабинете Yandex Games — **код не нужен**.
Рекомендуется: ON. Платформа сама вписывает баннер сверху/снизу области игры в зависимости от устройства.

---

## 5. ИНИЦИАЛИЗАЦИЯ SDK

### index.html
```html
<script src="https://yandex.ru/games/sdk/v2"></script>
```

### src/yandex/sdk.ts (новый файл)
```ts
let ysdk: any = null
let initPromise: Promise<any> | null = null

export function initYandex() {
  if (initPromise) return initPromise
  initPromise = (window as any).YaGames
    ? (window as any).YaGames.init().then((sdk: any) => {
        ysdk = sdk
        // Сообщить платформе, что игра загружена
        sdk.features?.LoadingAPI?.ready?.()
        return sdk
      })
    : Promise.resolve(null)
  return initPromise
}

export function getYsdk() { return ysdk }
```

### main.ts
```ts
import { initYandex } from '@/yandex/sdk'
initYandex()
```

---

## 6. ОБЩИЕ ПРАВИЛА UX

1. **Глушить звук** перед каждым показом и возвращать после `onClose`/`onError` — без этого аудио продолжит играть поверх рекламы (правило Yandex).
2. **Ставить игру на паузу**: `cancelAnimationFrame(raf)` в HomeView, возобновить в `onClose`. Иначе `passivePerSec` накапливается во время рекламы — игрок чувствует, что время идёт впустую.
3. **Никакого автозапуска rewarded** — только по явному клику игрока на видимую кнопку.
4. **Кнопки rewarded**: иконка 📺 + ясная награда («+5 💎», «x2 60с»). Не «Смотреть» в вакууме.
5. **Cooldown UI**: если rewarded ещё на кулдауне (5 мин на бустер), показываем `📺 (4:23)` вместо активной кнопки.
6. **Fallback при ошибке/отсутствии SDK**: в локальной разработке `ysdk === null` → кнопки rewarded в dev-режиме выдают награду сразу (флаг `import.meta.env.DEV`). Interstitials в dev-режиме просто пропускаются.
7. **Не показывать ad в первые 60 секунд** игры — это правило Yandex и просто хорошая UX-практика.
8. **Не показывать ad подряд**. Между interstitial и rewarded — минимум 30 секунд.

---

## 7. ИЗМЕРИМЫЕ ЦЕЛИ

| Метрика | Целевое значение |
|---|---|
| Interstitials per session (среднее) | 4–6 |
| Rewarded views per session (среднее) | 8–12 |
| Время между interstitials | 90–180 сек |
| % сессий, где смотрели хотя бы 1 rewarded | > 60% |
| Время до первой рекламы | 60–90 сек |

---

## 8. ROADMAP ВНЕДРЕНИЯ

1. **Этап 1 (фундамент)**: подключить SDK, создать `useAds()` composable с `showInterstitial()` / `showRewarded()`, dev-stub.
2. **Этап 2 (rewarded — money makers)**: x2 офлайн-награда, бесплатные бустеры в магазине, х2 награда заказа.
3. **Этап 3 (interstitial — естественные паузы)**: закрытие модалок улучшений/заказов/ForgeView с cooldown 90s.
4. **Этап 4 (rewarded — гриндовые точки)**: ежедневный сундук «открыть сейчас», +5 💎 каждые 10 мин, х2 содержимое сундука.
5. **Этап 5 (Prestige + ивенты)**: rewarded на удвоение душ, ивентовые баннеры.
6. **Этап 6 (тюнинг)**: посмотреть метрики на Яндекс.Метрике/Яндекс Играх (`gamesAPI.metrica`), отрегулировать cooldowns.

---

## 9. ЧЕКЛИСТ ПЕРЕД ПУБЛИКАЦИЕЙ

- [ ] Yandex SDK подключён, `LoadingAPI.ready()` вызывается
- [ ] Звук глушится на время рекламы
- [ ] Игровой цикл (`requestAnimationFrame`) ставится на паузу
- [ ] Все rewarded-кнопки выдают награду **только** через `onRewarded` callback
- [ ] Dev-mode не падает при отсутствии `window.YaGames`
- [ ] Interstitial не показывается в первые 60 сек и не чаще 1 в 90 сек
- [ ] В настройках есть тумблер «Звук» / «Музыка» (требование Yandex) — ✅ уже есть
- [ ] Sticky banner включён в кабинете
- [ ] Протестировано на yandex.com/games/draft перед публикацией
