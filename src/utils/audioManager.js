const bufferCache = new Map()
const loadPromises = new Map()
const activeLooping = new Map()
const activeOneShots = new Map()

const DEFAULT_MAX_CONCURRENT = 8
const ZONE_HIT_MAX_CONCURRENT = 6

let context = null

function getContext() {
  if (typeof window === 'undefined') return null

  if (!context) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return null
    context = new AudioContext()
  }

  return context
}

export async function resumeAudio() {
  const ctx = getContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    await ctx.resume().catch(() => {})
  }
}

export async function loadAudio(src) {
  if (bufferCache.has(src)) return bufferCache.get(src)

  const pending = loadPromises.get(src)
  if (pending) return pending

  const promise = (async () => {
    const ctx = getContext()
    if (!ctx) return null

    const response = await fetch(src)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    bufferCache.set(src, audioBuffer)
    loadPromises.delete(src)
    return audioBuffer
  })()

  loadPromises.set(src, promise)
  return promise
}

export async function preloadAudio(sources) {
  await resumeAudio()
  await Promise.all(sources.map((src) => loadAudio(src)))
}

function stopLoopVoice(src) {
  const active = activeLooping.get(src)
  if (!active) return

  try {
    active.source.stop()
    active.source.disconnect()
    active.gain.disconnect()
  } catch {
    // already stopped
  }

  activeLooping.delete(src)
}

function trimOneShots(src, maxConcurrent) {
  const set = activeOneShots.get(src)
  if (!set || set.size < maxConcurrent) return

  const overflow = set.size - maxConcurrent + 1
  const entries = [...set]

  for (let i = 0; i < overflow; i++) {
    const entry = entries[i]
    try {
      entry.source.stop()
      entry.source.disconnect()
      entry.gain.disconnect()
    } catch {
      // already stopped
    }
    set.delete(entry)
  }
}

async function playAudioAsync(
  src,
  { volume = 0.9, loop = false, maxConcurrent = DEFAULT_MAX_CONCURRENT } = {}
) {
  await resumeAudio()

  const buffer = await loadAudio(src)
  if (!buffer) return

  const ctx = getContext()
  if (!ctx) return

  if (loop) {
    stopLoopVoice(src)
  } else {
    trimOneShots(src, maxConcurrent)
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = loop

  const gain = ctx.createGain()
  gain.gain.value = volume

  source.connect(gain)
  gain.connect(ctx.destination)

  if (loop) {
    source.start(0)
    activeLooping.set(src, { source, gain })
    source.onended = () => {
      if (activeLooping.get(src)?.source === source) {
        activeLooping.delete(src)
      }
    }
    return
  }

  if (!activeOneShots.has(src)) {
    activeOneShots.set(src, new Set())
  }

  const voices = activeOneShots.get(src)
  const entry = { source, gain }
  voices.add(entry)

  source.onended = () => {
    try {
      source.disconnect()
      gain.disconnect()
    } catch {
      // already disconnected
    }
    voices.delete(entry)
  }

  source.start(0)
}

export function playAudio(src, options = {}) {
  playAudioAsync(src, options).catch(() => {})
}

export function stopAudio(src) {
  stopLoopVoice(src)
}

if (typeof window !== 'undefined') {
  const unlock = () => {
    resumeAudio()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }

  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

export { ZONE_HIT_MAX_CONCURRENT }
