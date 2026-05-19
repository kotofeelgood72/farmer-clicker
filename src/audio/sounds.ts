export type SfxName = string

const SFX_URLS: Record<SfxName, string> = {}

const SFX_VOLUMES: Record<SfxName, number> = {}

// Minimum gap between repeated plays of the same SFX (ms).
const MIN_INTERVAL: Record<SfxName, number> = {}

const lastPlayedAt: Record<SfxName, number> = {}

let sfxEnabled = true
let musicEnabled = true
let masterSfxVolume = 0.9
let masterMusicVolume = 0.35

let audioCtx: AudioContext | null = null
let masterSfxGain: GainNode | null = null

const sfxBuffers: Partial<Record<SfxName, AudioBuffer>> = {}
const sfxLoading: Partial<Record<SfxName, Promise<void>>> = {}

// Set to a URL (e.g. `import bgmUrl from '@/assets/audio/theme.mp3'`) to
// enable background music. Left null in the template.
const bgmUrl: string | null = null

let bgmBuffer: AudioBuffer | null = null
let bgmLoading: Promise<void> | null = null
let bgmSource: AudioBufferSourceNode | null = null
let bgmGain: GainNode | null = null
let bgmShouldPlay = false

let visibilityBound = false
let unlocked = false

function getCtx(): AudioContext | null {
  if (audioCtx) return audioCtx
  const Ctor: typeof AudioContext | undefined =
    (window as any).AudioContext || (window as any).webkitAudioContext
  if (!Ctor) return null
  audioCtx = new Ctor()
  masterSfxGain = audioCtx.createGain()
  masterSfxGain.gain.value = masterSfxVolume
  masterSfxGain.connect(audioCtx.destination)
  return audioCtx
}

function suppressMediaSession() {
  // Chrome/Android: explicitly tell the browser we don't want a media session.
  const ms = (navigator as any).mediaSession
  if (!ms) return
  try {
    ms.metadata = null
    const actions = [
      'play',
      'pause',
      'stop',
      'seekbackward',
      'seekforward',
      'previoustrack',
      'nexttrack',
      'seekto',
    ]
    for (const a of actions) {
      try {
        ms.setActionHandler(a, null)
      } catch {}
    }
    try {
      ms.playbackState = 'none'
    } catch {}
  } catch {}
}

async function loadSfxBuffer(name: SfxName): Promise<void> {
  if (sfxBuffers[name]) return
  const ctx = getCtx()
  if (!ctx) return
  const url = SFX_URLS[name]
  if (!url) return
  if (!sfxLoading[name]) {
    sfxLoading[name] = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        sfxBuffers[name] = decoded
      })
      .catch(() => {
        // swallow — sfx just won't play
      })
  }
  await sfxLoading[name]
}

async function loadBgmBuffer(): Promise<void> {
  if (bgmBuffer || !bgmUrl) return
  const ctx = getCtx()
  if (!ctx) return
  if (!bgmLoading) {
    bgmLoading = fetch(bgmUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        bgmBuffer = decoded
      })
      .catch(() => {})
  }
  await bgmLoading
}

function stopBgmSource() {
  if (bgmSource) {
    try {
      bgmSource.stop()
    } catch {}
    try {
      bgmSource.disconnect()
    } catch {}
    bgmSource = null
  }
}

function startBgmSource() {
  const ctx = getCtx()
  if (!ctx || !bgmBuffer || bgmSource) return
  if (!bgmGain) {
    bgmGain = ctx.createGain()
    bgmGain.connect(ctx.destination)
  }
  bgmGain.gain.value = masterMusicVolume
  const src = ctx.createBufferSource()
  src.buffer = bgmBuffer
  src.loop = true
  src.connect(bgmGain)
  src.start(0)
  bgmSource = src
}

function bindVisibility() {
  if (visibilityBound) return
  visibilityBound = true
  document.addEventListener('visibilitychange', () => {
    const ctx = getCtx()
    if (!ctx) return
    if (document.hidden) {
      void ctx.suspend()
    } else if (bgmShouldPlay && musicEnabled) {
      void ctx.resume()
    }
  })
  window.addEventListener('pagehide', () => {
    const ctx = getCtx()
    if (ctx && ctx.state === 'running') void ctx.suspend()
  })
}

export function preloadAudio() {
  suppressMediaSession()
  bindVisibility()
  for (const k of Object.keys(SFX_URLS) as SfxName[]) {
    void loadSfxBuffer(k)
  }
  if (bgmUrl) void loadBgmBuffer()
}

export function playSfx(name: SfxName) {
  if (!sfxEnabled) return
  if (document.hidden) return
  const now = performance.now()
  const gap = MIN_INTERVAL[name] ?? 0
  if (gap > 0 && now - (lastPlayedAt[name] ?? 0) < gap) return
  const ctx = getCtx()
  if (!ctx || !masterSfxGain) return
  const buffer = sfxBuffers[name]
  if (!buffer) {
    void loadSfxBuffer(name)
    return
  }
  lastPlayedAt[name] = now
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.value = SFX_VOLUMES[name] ?? 1
  src.connect(gain).connect(masterSfxGain)
  src.start(0)
  src.onended = () => {
    try {
      src.disconnect()
      gain.disconnect()
    } catch {}
  }
}

export async function startMusic() {
  bgmShouldPlay = true
  if (!musicEnabled || !bgmUrl) return
  if (document.hidden) return
  const ctx = getCtx()
  if (!ctx) return
  await loadBgmBuffer()
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {}
  }
  startBgmSource()
  suppressMediaSession()
}

export function stopMusic() {
  bgmShouldPlay = false
  stopBgmSource()
}

export function setSfxEnabled(v: boolean) {
  sfxEnabled = v
}

export function setMusicEnabled(v: boolean) {
  musicEnabled = v
  if (!v) stopBgmSource()
  else void startMusic()
}

export function setSfxVolume(v: number) {
  masterSfxVolume = Math.max(0, Math.min(1, v))
  if (masterSfxGain) masterSfxGain.gain.value = masterSfxVolume
}

export function setMusicVolume(v: number) {
  masterMusicVolume = Math.max(0, Math.min(1, v))
  if (bgmGain) bgmGain.gain.value = masterMusicVolume
}

export function unlockAudioOnGesture() {
  if (unlocked) return
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  if (musicEnabled) void startMusic()
  const events = [
    'pointerdown',
    'pointerup',
    'mousedown',
    'click',
    'keydown',
    'touchstart',
    'touchend',
    'wheel',
    'contextmenu',
  ] as const
  const handler = () => {
    unlocked = true
    preloadAudio()
    const c = getCtx()
    if (c && c.state === 'suspended') void c.resume()
    if (musicEnabled) void startMusic()
    suppressMediaSession()
    for (const e of events) window.removeEventListener(e, handler)
  }
  for (const e of events) {
    window.addEventListener(e, handler, { passive: true })
  }
}
