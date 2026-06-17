/**
 * Статический аудит геймплея и премиума (запуск: node scripts/audit-game.mjs)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'src')

function read(path) {
  return readFileSync(join(src, path), 'utf8')
}

const PREMIUM_GIRLS = [4, 7, 11, 13, 15, 18, 20]
const PREMIUM_LOCATIONS = [4, 5, 6]
const TOTAL_GIRLS = 20

const checks = []

function pass(name, detail = '') {
  checks.push({ status: 'ok', name, detail })
}
function fail(name, detail = '') {
  checks.push({ status: 'fail', name, detail })
}
function warn(name, detail = '') {
  checks.push({ status: 'warn', name, detail })
}

// 1. No browser dialogs
const vueFiles = []
function walk(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (ent.name.endsWith('.vue') || ent.name.endsWith('.ts'))
      vueFiles.push(p)
  }
}
walk(src)
let dialogHits = []
for (const f of vueFiles) {
  const c = readFileSync(f, 'utf8')
  if (/\b(window\.)?(alert|confirm|prompt)\s*\(/.test(c))
    dialogHits.push(f.replace(src, ''))
}
if (dialogHits.length) fail('Нет alert/confirm/prompt', dialogHits.join(', '))
else pass('Нет alert/confirm/prompt')

// 2. Premium content constants
const premiumContent = read('constants/premiumContent.ts')
if (PREMIUM_GIRLS.every((id) => premiumContent.includes(String(id))))
  pass('Премиум-девушки в premiumContent', `${PREMIUM_GIRLS.length} id`)
else fail('Премиум-девушки в premiumContent')

// 3. Shop benefits vs code hooks
const shop = read('../src/views/ShopView.vue'.replace('../src/', ''))
const benefits = [
  ['Бесплатные ответы', 'isPremiumOwned|isPremium.value'],
  ['Безлимитная энергия', 'isPremium'],
  ['Удвоенный ежедневный', 'DAILY_REWARD_AD_MULTIPLIER|todayClaimMultiplier|isPremium'],
  ['Премиум-значок', 'nick-badge--premium|isPremium'],
  ['Смена аватара', 'openPremiumShop|isPremium'],
  ['Без рекламы', 'setAdsDisabled'],
]
for (const [label, pattern] of benefits) {
  if (!shop.includes(label.split(' ')[0])) warn(`Бенефит в магазине: ${label}`, 'текст не найден')
  const re = new RegExp(pattern)
  const found = vueFiles.some((f) => re.test(readFileSync(f, 'utf8')))
  if (found) pass(`Реализация: ${label}`)
  else fail(`Реализация: ${label}`, `нет совпадения ${pattern}`)
}

// 4. Exclusive dialogs claim
const dialogDirs = readdirSync(join(src, 'assets/girls')).filter((d) =>
  existsSync(join(src, 'assets/girls', d, 'dialog.md')),
)
const premiumDialogDirs = PREMIUM_GIRLS.filter((id) =>
  existsSync(join(src, 'assets/girls', String(id), 'dialog.md')),
)
if (premiumDialogDirs.length === PREMIUM_GIRLS.length) {
  warn(
    '«Эксклюзивные диалоги» в магазине',
    `У премиум-девушек те же dialog.md, что у остальных (${premiumDialogDirs.length}). Отдельных premium-веток в данных нет — риск модерации Яндекс.`,
  )
} else {
  pass('Премиум-девушки без отдельных dialog.md', 'частично')
}

// 5. Premium dates locations
const meetings = readdirSync(join(src, 'assets/meeting')).filter((d) =>
  existsSync(join(src, 'assets/meeting', d, 'dialog.md')),
)
for (const loc of PREMIUM_LOCATIONS) {
  if (meetings.includes(String(loc))) pass(`Премиум-локация ${loc} есть`)
  else fail(`Премиум-локация ${loc}`, 'нет dialog.md')
}

// 6. Yandex SDK hooks
const main = read('main.ts')
const app = read('App.vue')
const sdk = read('yandex/sdk.ts')
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8')
if (indexHtml.includes('sdk.js')) pass('sdk.js в index.html')
else fail('sdk.js в index.html')
if (sdk.includes('LoadingAPI?.ready') && app.includes('signalLoadingReady')) pass('LoadingAPI.ready()')
else fail('LoadingAPI.ready()')
if (main.includes('gameplayInit') && main.includes('gameplayPause'))
  pass('GameplayAPI pause/resume')
else fail('GameplayAPI')

// 7. Context menu disabled (Yandex UX)
if (main.includes('contextmenu')) pass('Отключён contextmenu')
else warn('contextmenu')

// 8. ConfirmDialog exists
if (existsSync(join(src, 'components/ConfirmDialog.vue'))) pass('Кастомный ConfirmDialog')
else fail('ConfirmDialog')

// 9. IAP
const payments = read('yandex/payments.ts')
if (payments.includes('processPendingPurchases')) pass('Обработка pending IAP')
else fail('pending IAP')
if (payments.includes('getCatalog')) pass('Каталог IAP')

// 10. Adaptive phone-scaler
if (app.includes('phone-scaler') && app.includes('100cqh')) pass('Адаптив phone-scaler')
else fail('Адаптив')

const ok = checks.filter((c) => c.status === 'ok').length
const fails = checks.filter((c) => c.status === 'fail')
const warns = checks.filter((c) => c.status === 'warn')

console.log('\n=== Аудит игры ===\n')
for (const c of checks) {
  const icon = c.status === 'ok' ? '✓' : c.status === 'fail' ? '✗' : '⚠'
  console.log(`${icon} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`)
}
console.log(`\nИтого: ${ok} OK, ${fails.length} FAIL, ${warns.length} WARN`)
if (fails.length) process.exitCode = 1
