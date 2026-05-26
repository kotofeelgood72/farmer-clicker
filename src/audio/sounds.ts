import bgmUrl from '@/assets/audio/Blacksmith Village Theme.mp3'
import hammerUrl from '@/assets/audio/hammer_click.mp3'
import criticalUrl from '@/assets/audio/critical.mp3'
import openUrl from '@/assets/audio/open.mp3'
import uiClickUrl from '@/assets/audio/ui_click.mp3'

// Yandex Games audio requirements:
//   1. Audio must pause when the tab is hidden.
//   2. The game must NOT surface in OS-level media controls
//      (Chrome global media panel, Android notification, lock-screen player).
//
// HTML5 <audio>/<video> elements register with the browser's Media Session
// API automatically, so even a single Audio() in the page triggers the
// playback player. To satisfy both requirements we route 100% of sound
// (SFX + BGM) through Web Audio API — no <audio> elements created at all —
// and additionally clear navigator.mediaSession.

export type SfxName = 'hammer' | 'critical' | 'open' | 'ui'

const SFX_URLS: Record<SfxName, string> = {
  hammer: hammerUrl,
  critical: criticalUrl,
  open: openUrl,
  ui: uiClickUrl,
}

const SFX_VOLUMES: Record<SfxName, number> = {
  hammer: 0.55,
  critical: 0.75,
  open: 0.8,
  ui: 0.45,
}

// Minimum gap between repeated plays of the same SFX (ms).
const MIN_INTERVAL: Record<SfxName, number> = {
  hammer: 0,
  critical: 0,
  open: 0,
  ui: 60,
}

const lastPlayedAt: Record<SfxName, number> = {
  hammer: 0,
  critical: 0,
  open: 0,
  ui: 0,
}

let sfxEnabled = true
let musicEnabled = true
let masterSfxVolume = 0.9
let masterMusicVolume = 0.35

let audioCtx: AudioContext | null = null
let masterSfxGain: GainNode | null = null

const sfxBuffers: Partial<Record<SfxName, AudioBuffer>> = {}
const sfxLoading: Partial<Record<SfxName, Promise<void>>> = {}

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
  if (!sfxLoading[name]) {
    sfxLoading[name] = fetch(SFX_URLS[name])
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
  if (bgmBuffer) return
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
  // Eagerly decode SFX so the first click has zero latency.
  for (const k of Object.keys(SFX_URLS) as SfxName[]) {
    void loadSfxBuffer(k)
  }
  void loadBgmBuffer()
}

export function playSfx(name: SfxName) {
  if (!sfxEnabled) return
  if (document.hidden) return
  const now = performance.now()
  const gap = MIN_INTERVAL[name]
  if (gap > 0 && now - lastPlayedAt[name] < gap) return
  const ctx = getCtx()
  if (!ctx || !masterSfxGain) return
  const buffer = sfxBuffers[name]
  if (!buffer) {
    // First time — kick off load, will be ready next time.
    void loadSfxBuffer(name)
    return
  }
  lastPlayedAt[name] = now
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.value = SFX_VOLUMES[name]
  src.connect(gain).connect(masterSfxGain)
  src.start(0)
  // Auto-clean once finished.
  src.onended = () => {
    try {
      src.disconnect()
      gain.disconnect()
    } catch {}
  }
}

export async function startMusic() {
  bgmShouldPlay = true
  if (!musicEnabled) return
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
  // Try an optimistic resume immediately — works on platforms with autoplay
  // permission (Yandex Games SDK iframe, sites with prior engagement, or
  // localhost when the user has whitelisted sound in chrome://settings).
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {
      // Blocked — wait for a real user gesture below.
    })
  }
  if (musicEnabled) void startMusic()
  // Fallback: any user input releases the autoplay lock.
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
