/**
 * Генерирует .{slot}.webp рядом с исходными PNG — под реальный размер UI-слотов.
 * Запуск: npm run images
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = path.join(ROOT, 'src', 'assets')

/** @type {Record<string, import('../src/constants/imageSlots.ts').IMAGE_SLOT_PX[keyof typeof import('../src/constants/imageSlots.ts').IMAGE_SLOT_PX]>} */
const SLOTS = {
  card: { width: 280, height: 387, fit: 'cover', position: 'top' },
  gallery: { width: 240, height: 320, fit: 'cover', position: 'center' },
  avatar: { width: 128, height: 128, fit: 'cover', position: 'top' },
  preview: { width: 280, maxHeight: 520, fit: 'inside' },
}

function variantPath(inputPath, slot) {
  const dir = path.dirname(inputPath)
  const base = path.basename(inputPath, path.extname(inputPath))
  return path.join(dir, `${base}.${slot}.webp`)
}

async function isUpToDate(inputPath, outputPath) {
  try {
    const [inStat, outStat] = await Promise.all([fs.stat(inputPath), fs.stat(outputPath)])
    return outStat.mtimeMs >= inStat.mtimeMs
  } catch {
    return false
  }
}

async function generateVariant(inputPath, slot) {
  const outputPath = variantPath(inputPath, slot)
  if (await isUpToDate(inputPath, outputPath)) {
    return { outputPath, status: 'skip' }
  }

  const cfg = SLOTS[slot]
  let pipeline = sharp(inputPath)

  if (cfg.fit === 'inside') {
    pipeline = pipeline.resize(cfg.width, cfg.maxHeight ?? undefined, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  } else {
    pipeline = pipeline.resize(cfg.width, cfg.height, {
      fit: 'cover',
      position: cfg.position ?? 'center',
    })
  }

  await pipeline.webp({ quality: 82, effort: 4 }).toFile(outputPath)
  return { outputPath, status: 'ok' }
}

async function processFile(inputPath, slots) {
  const results = []
  for (const slot of slots) {
    results.push(await generateVariant(inputPath, slot))
  }
  return results
}

async function processGirls() {
  const girlsDir = path.join(ASSETS, 'girls')
  let dirs = []
  try {
    dirs = await fs.readdir(girlsDir, { withFileTypes: true })
  } catch {
    return []
  }

  const all = []
  for (const ent of dirs) {
    if (!ent.isDirectory()) continue
    const id = ent.name
    const dir = path.join(girlsDir, id)

    const bg = path.join(dir, 'bg.jpg')
    try {
      await fs.access(bg)
      all.push(...(await processFile(bg, ['card', 'preview'])))
    } catch {
      /* no bg */
    }

    const portrait = path.join(dir, `${id}.webp`)
    try {
      await fs.access(portrait)
      all.push(...(await processFile(portrait, ['avatar', 'preview'])))
    } catch {
      /* no portrait */
    }

    const galleryDir = path.join(dir, 'gallery')
    try {
      const files = await fs.readdir(galleryDir)
      for (const name of files.filter((f) => f.endsWith('.jpg'))) {
        all.push(...(await processFile(path.join(galleryDir, name), ['gallery'])))
      }
    } catch {
      /* no gallery */
    }
  }
  return all
}

async function processMeetings() {
  const meetingDir = path.join(ASSETS, 'meeting')
  let dirs = []
  try {
    dirs = await fs.readdir(meetingDir, { withFileTypes: true })
  } catch {
    return []
  }

  const all = []
  for (const ent of dirs) {
    if (!ent.isDirectory()) continue
    const id = ent.name
    const file = path.join(meetingDir, id, `${id}.jpg`)
    try {
      await fs.access(file)
      all.push(...(await processFile(file, ['card'])))
    } catch {
      /* skip */
    }
  }
  return all
}

const results = [...(await processGirls()), ...(await processMeetings())]
const ok = results.filter((r) => r.status === 'ok').length
const skip = results.filter((r) => r.status === 'skip').length
console.log(`image variants: ${ok} created/updated, ${skip} up-to-date`)
