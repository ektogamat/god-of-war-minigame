import { proxy } from 'valtio'
import {
  MAX_ROUNDS,
  getDifficulty,
  getMarkForRound,
  getRoundTime,
  resolveStrike,
} from '../utils/forgeScoring'
import {
  playAudio,
  preloadAudio,
  stopAudio,
  ZONE_HIT_MAX_CONCURRENT,
} from '../utils/audioManager'

const MUSIC_PREF_KEY = 'gow-minigame-music-enabled'

const MIN_ZONE_DIST = 0.22
const LEFT_BAR_MARGIN = 0.14
const ZONE_X_MIN = 0.18
const ZONE_X_MAX = 0.9
const ZONE_Y_MIN = 0.14
const ZONE_Y_MAX = 0.86

const STRIKE_SFX_SRC = '/impact.mp3'
const STRIKE_SFX_FROST_SRC =
  '/yodguard-a-massive-axe-impact-hitting-metal-3-450254.mp3'
const STRIKE_SFX_CHAOS_SRC =
  '/yodguard-a-massive-axe-impact-hitting-metal-4-450252.mp3'
const BEGIN_SFX_SRC = '/you-challenge-me-mortal.mp3'
const CHARGE_SFX_SRC = '/soundreality-riser-the-plane-391179.mp3'
const ZONE_HIT_SFX_SRC = '/freesound_community-swoosh-12-46747.mp3'
const BUTTON_HOVER_SFX_SRC =
  '/yodguard-a-massive-axe-impact-hitting-metal-1-450251.mp3'
const ORB_COLLECT_SFX_SRC = '/yodguard-energy-beam-blast-1-482513.mp3'
const CONTINUE_FORGING_SFX_SRC =
  '/phatphrogstudio-oni-demon-voice-demonic-laughter-477923.mp3'
const FINAL_VICTORY_SFX_SRC =
  '/freesound_community-possessed-laugh-laugh-stereo-95060.mp3'
const MIN_CHARGE_HOLD_MS = 350
const HOLD_HINT_MESSAGE =
  'Press and hold — do not release to charge the forge energy'
const WRONG_ORDER_POWER_PENALTY = 3
const COMBO_POWER_CAP = 4
const COMBO_POWER_SCALE = 1.0
const ORB_PROGRESS_RATIO = 0.25
const MAX_ORB_PROGRESS_PER_ROUND = 10

const ALL_SFX = [
  STRIKE_SFX_SRC,
  STRIKE_SFX_FROST_SRC,
  STRIKE_SFX_CHAOS_SRC,
  BEGIN_SFX_SRC,
  CHARGE_SFX_SRC,
  ZONE_HIT_SFX_SRC,
  BUTTON_HOVER_SFX_SRC,
  ORB_COLLECT_SFX_SRC,
  CONTINUE_FORGING_SFX_SRC,
  FINAL_VICTORY_SFX_SRC,
]

if (typeof window !== 'undefined') {
  const preloadOnce = () => {
    preloadAudio(ALL_SFX).catch(() => {})
    window.removeEventListener('pointerdown', preloadOnce)
    window.removeEventListener('keydown', preloadOnce)
  }

  window.addEventListener('pointerdown', preloadOnce)
  window.addEventListener('keydown', preloadOnce)
}

function readMusicPreference() {
  try {
    const stored = localStorage.getItem(MUSIC_PREF_KEY)
    if (stored === null) return true
    return stored === 'true'
  } catch {
    return true
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function randomDriftVelocity(speed) {
  const angle = Math.random() * Math.PI * 2
  const magnitude = speed * (0.75 + Math.random() * 0.5)
  return {
    vx: Math.cos(angle) * magnitude,
    vy: Math.sin(angle) * magnitude,
  }
}

const state = proxy({
  clicked: false,
  progress: 0,
  finishedMainLoading: false,
  phase: 'intro',
  playthrough: 1,
  activeTool: 'hammer',
  lastHitQuality: null,
  lastHitMessage: '',
  musicEnabled: readMusicPreference(),
  forgeHeat: 0,
  power: 0,
  mark: getMarkForRound(1, 1),
  roundIndex: 1,
  roundTimeLeft: getRoundTime(1),
  zones: [],
  zonePulse: {},
  zoneMissPulse: {},
  nextZoneOrder: 1,
  zoneDriftTimer: 0,
  chargeStartTime: null,
  holdHint: '',
  victoryStage: null,
  easyDifficultyCheat: false,
  cheatNotice: '',
  strikeImpact: 0,
  impactFlash: 0,
  aimX: 0.5,
  aimY: 0.5,
  chargeCombo: 0,
  hitPopup: null,
  roundOrbHits: [],
  orbTally: null,
  orbBurst: null,
  orbBurstSeq: 0,
})

export function getOrbTargetUV() {
  if (typeof document === 'undefined') return { x: 0.92, y: 0.5 }

  const canvas = document.querySelector('canvas')
  const meter = document.querySelector('.forge-progress-meter')
  if (!canvas || !meter) return { x: 0.92, y: 0.5 }

  const canvasRect = canvas.getBoundingClientRect()
  const meterRect = meter.getBoundingClientRect()

  return {
    x:
      (meterRect.left + meterRect.width * 0.5 - canvasRect.left) /
      canvasRect.width,
    y:
      (meterRect.top + meterRect.height * 0.5 - canvasRect.top) /
      canvasRect.height,
  }
}

export function triggerOrbBurst({
  mode,
  count,
  origins,
  target = null,
  playthrough = state.playthrough,
}) {
  const nextSeq = state.orbBurstSeq + 1
  state.orbBurstSeq = nextSeq
  state.orbBurst = {
    mode,
    seq: nextSeq,
    count,
    origins,
    target: target ?? getOrbTargetUV(),
    playthrough,
    at: Date.now(),
  }

  if (mode === 'collect' || mode === 'tally') {
    playOrbCollectSfx()
  }
}

export function clearOrbBurst() {
  state.orbBurst = null
}

function triggerOrbCollectBurst(origin, isVictory = false) {
  const count = isVictory ? 50 : 30
  const baseX = origin?.x ?? 0.5
  const baseY = origin?.y ?? 0.5
  const spread = isVictory ? 0.28 : 0.18
  const origins = Array.from({ length: count }, () => ({
    x: clamp(baseX + (Math.random() - 0.5) * spread, 0.05, 0.95),
    y: clamp(baseY + (Math.random() - 0.5) * spread, 0.05, 0.95),
  }))

  triggerOrbBurst({
    mode: 'collect',
    count,
    origins,
  })
}

/** Difficulty playthrough for scoring/zones. Konami easy mode locks PT1–3 to PT1. */
function getDifficultyPlaythrough() {
  if (state.easyDifficultyCheat && state.playthrough <= 3) return 1
  return state.playthrough
}

function applyEasyDifficultyToActiveCharge() {
  if (!state.easyDifficultyCheat || state.playthrough > 3) return

  const config = getDifficulty(1)
  for (const zone of state.zones) {
    zone.r = config.zoneRadius
    assignZoneMotion(zone, config)
  }

  if (state.clicked) {
    state.mark = getMarkForRound(state.roundIndex, 1)
  }
}

export function activateEasyDifficultyCheat() {
  if (state.easyDifficultyCheat) return
  state.easyDifficultyCheat = true
  applyEasyDifficultyToActiveCharge()
  state.cheatNotice = 'EASY MODE ACTIVATED'
}

export function clearCheatNotice() {
  state.cheatNotice = ''
}

function getStrikeSfx(playthrough) {
  if (playthrough === 2) return STRIKE_SFX_FROST_SRC
  if (playthrough >= 3) return STRIKE_SFX_CHAOS_SRC
  return STRIKE_SFX_SRC
}

function randomZonePosition(existing = []) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = ZONE_X_MIN + Math.random() * (ZONE_X_MAX - ZONE_X_MIN)
    const y = ZONE_Y_MIN + Math.random() * (ZONE_Y_MAX - ZONE_Y_MIN)
    const ok = existing.every((z) => {
      const dx = x - z.x
      const dy = y - z.y
      return Math.hypot(dx, dy) >= MIN_ZONE_DIST
    })
    if (ok && x > LEFT_BAR_MARGIN) return { x, y }
  }
  return {
    x: 0.35 + Math.random() * 0.45,
    y: 0.2 + Math.random() * 0.55,
  }
}

const zoneInside = new Map()

function assignZoneMotion(zone, config) {
  if (!config.zoneDrift) {
    zone.vx = 0
    zone.vy = 0
    return
  }

  const drift = randomDriftVelocity(config.zoneDriftSpeed)
  zone.vx = drift.vx
  zone.vy = drift.vy
}

function spawnZones() {
  zoneInside.clear()
  const config = getDifficulty(getDifficultyPlaythrough())
  const zones = []

  for (let i = 0; i < config.zoneCount; i++) {
    const pos = randomZonePosition(zones)
    const zone = {
      id: i,
      order: i + 1,
      x: pos.x,
      y: pos.y,
      r: config.zoneRadius,
      vx: 0,
      vy: 0,
    }
    assignZoneMotion(zone, config)
    zones.push(zone)
  }

  state.zones = zones
  state.zonePulse = {}
  state.zoneMissPulse = {}
  state.nextZoneOrder = 1
  state.zoneDriftTimer = 0
}

function repositionZone(zoneId, newOrder = null) {
  const config = getDifficulty(getDifficultyPlaythrough())
  const others = state.zones.filter((z) => z.id !== zoneId)
  const pos = randomZonePosition(others)

  state.zones = state.zones.map((z) => {
    if (z.id !== zoneId) return z
    const next = { ...z, x: pos.x, y: pos.y }
    if (newOrder != null) next.order = newOrder
    assignZoneMotion(next, config)
    return next
  })
  state.zonePulse = { ...state.zonePulse, [zoneId]: Date.now() }
  zoneInside.set(zoneId, false)
}

function tickZoneDrift(dt) {
  const config = getDifficulty(getDifficultyPlaythrough())
  if (!config.zoneDrift) return

  for (const zone of state.zones) {
    zone.x += zone.vx * dt
    zone.y += zone.vy * dt

    if (zone.x <= ZONE_X_MIN || zone.x >= ZONE_X_MAX) {
      zone.vx *= -1
      zone.x = clamp(zone.x, ZONE_X_MIN, ZONE_X_MAX)
    }
    if (zone.y <= ZONE_Y_MIN || zone.y >= ZONE_Y_MAX) {
      zone.vy *= -1
      zone.y = clamp(zone.y, ZONE_Y_MIN, ZONE_Y_MAX)
    }
  }

  if (!config.zoneAutoRepositionSec) return

  state.zoneDriftTimer += dt
  if (state.zoneDriftTimer < config.zoneAutoRepositionSec) return

  state.zoneDriftTimer = 0
  if (state.clicked) return

  for (const zone of state.zones) {
    repositionZone(zone.id)
  }
}

export function playButtonHoverSfx() {
  playAudio(BUTTON_HOVER_SFX_SRC, { volume: 0.45 })
}

export function playOrbCollectSfx() {
  playAudio(ORB_COLLECT_SFX_SRC, { volume: 0.75 })
}

export function playFinalVictorySfx() {
  playAudio(FINAL_VICTORY_SFX_SRC, { volume: 0.9 })
}

export function continueForging() {
  playAudio(CONTINUE_FORGING_SFX_SRC, { volume: 0.85 })
  resetForge()
}

export function continueFromIntro() {
  state.phase = 'howto'
}

export function startPlaying() {
  playAudio(BEGIN_SFX_SRC, { volume: 0.85 })
  state.phase = 'playing'
}

export function toggleMusic() {
  state.musicEnabled = !state.musicEnabled
  try {
    localStorage.setItem(MUSIC_PREF_KEY, String(state.musicEnabled))
  } catch {
    // ignore storage failures
  }
}

function clearChargeVisuals() {
  state.clicked = false
  state.zones = []
  state.zonePulse = {}
  state.zoneMissPulse = {}
  state.nextZoneOrder = 1
  state.zoneDriftTimer = 0
  state.power = 0
  state.chargeStartTime = null
  state.chargeCombo = 0
  state.hitPopup = null
  state.aimX = 0.5
  state.aimY = 0.5
  zoneInside.clear()
}

function computeOrbExtraProgress(totalBonus) {
  const remaining = 100 - state.progress
  const scaled = Math.round(totalBonus * ORB_PROGRESS_RATIO)
  return Math.min(remaining, MAX_ORB_PROGRESS_PER_ROUND, scaled)
}

function triggerVictory() {
  state.victoryStage = state.playthrough

  if (state.playthrough === 1) {
    state.activeTool = 'axe'
    state.playthrough = 2
  } else if (state.playthrough === 2) {
    state.activeTool = 'blades'
    state.playthrough = 3
  } else if (state.playthrough === 3) {
    state.playthrough = 4
  } else if (state.playthrough === 4) {
    state.playthrough = 5
  } else if (state.playthrough === 5) {
    state.playthrough = 6
  }

  state.phase = 'won'
}

export function getDisplayPlaythrough(playthrough = state.playthrough) {
  return Math.min(playthrough, 3)
}

function triggerStrikeImpact(quality) {
  const intensity =
    quality === 'full' ? 1 : quality === 'weak' ? 0.55 : 0.25
  state.strikeImpact = Date.now()
  state.impactFlash = intensity
  setTimeout(() => {
    state.impactFlash = 0
  }, 200)
}

function cancelShortCharge() {
  stopAudio(CHARGE_SFX_SRC)
  clearChargeVisuals()
  state.holdHint = HOLD_HINT_MESSAGE
}

export function clearHoldHint() {
  state.holdHint = ''
}

export function startCharge() {
  if (state.phase !== 'playing' || state.clicked || state.orbTally) return

  const difficultyPt = getDifficultyPlaythrough()
  const config = getDifficulty(difficultyPt)

  state.holdHint = ''
  state.roundOrbHits = []
  state.clicked = true
  state.power = 0
  state.mark = getMarkForRound(state.roundIndex, difficultyPt)
  state.roundTimeLeft = config.roundTimeSec
  state.chargeStartTime = Date.now()
  state.chargeCombo = 0
  state.hitPopup = null
  state.aimX = 0.5
  state.aimY = 0.5
  spawnZones()
  playAudio(CHARGE_SFX_SRC, { volume: 0.75, loop: true })
}

export function tickCharge(dt, pointerX, pointerY) {
  if (!state.clicked) return

  const config = getDifficulty(getDifficultyPlaythrough())

  state.aimX = pointerX
  state.aimY = pointerY
  state.roundTimeLeft = Math.max(0, state.roundTimeLeft - dt)
  state.power = Math.max(
    0,
    state.power - config.powerDecayPerSec * dt
  )
  tickZoneDrift(dt)

  for (const zone of state.zones) {
    const dx = pointerX - zone.x
    const dy = pointerY - zone.y
    const dist = Math.hypot(dx, dy)
    const inside = dist <= zone.r
    const wasInside = zoneInside.get(zone.id) ?? false

    if (inside && !wasInside) {
      if (zone.order !== state.nextZoneOrder) {
        state.zoneMissPulse = {
          ...state.zoneMissPulse,
          [zone.id]: Date.now(),
        }
        state.power = Math.max(0, state.power - WRONG_ORDER_POWER_PENALTY)
        state.chargeCombo = 0
      } else {
        const gain =
          config.zonePowerMin +
          Math.floor(
            Math.random() * (config.zonePowerMax - config.zonePowerMin + 1)
          )
        state.chargeCombo += 1
        const comboBonus = Math.min(
          COMBO_POWER_CAP,
          Math.floor(state.chargeCombo * COMBO_POWER_SCALE)
        )
        state.power = Math.min(100, state.power + gain + comboBonus)
        state.forgeHeat = Math.min(1, state.forgeHeat + 0.12)
        state.roundOrbHits.push({
          value: gain + comboBonus,
          x: pointerX,
          y: pointerY,
        })
        state.hitPopup = {
          combo: state.chargeCombo,
          x: pointerX,
          y: pointerY,
          at: Date.now(),
        }
        playAudio(ZONE_HIT_SFX_SRC, {
          volume: 0.8,
          maxConcurrent: ZONE_HIT_MAX_CONCURRENT,
        })
        state.nextZoneOrder += 1
        const newOrder = state.nextZoneOrder + state.zones.length - 1
        repositionZone(zone.id, newOrder)
      }
    }

    zoneInside.set(zone.id, inside)
  }

  if (state.roundTimeLeft <= 0) {
    endCharge()
  }
}

export function endCharge() {
  if (!state.clicked) return

  const heldMs = state.chargeStartTime
    ? Date.now() - state.chargeStartTime
    : 0

  if (heldMs < MIN_CHARGE_HOLD_MS) {
    cancelShortCharge()
    return
  }

  stopAudio(CHARGE_SFX_SRC)
  playAudio(getStrikeSfx(state.playthrough), { volume: 0.9 })

  const releaseCombo = state.chargeCombo
  const { quality, message, newProgress } = resolveStrike(
    state.power,
    state.mark,
    state.progress,
    releaseCombo
  )

  triggerStrikeImpact(quality)
  clearChargeVisuals()
  state.lastHitQuality = quality
  state.lastHitMessage = message
  const prevProgress = state.progress
  state.progress = newProgress
  state.forgeHeat = Math.max(0, state.forgeHeat - 0.2)

  if (newProgress >= 100) {
    state.roundOrbHits = []
    triggerOrbCollectBurst(
      { x: state.aimX, y: state.aimY },
      true
    )
    triggerVictory()
    return
  }

  if (state.roundIndex >= MAX_ROUNDS) {
    state.roundOrbHits = []
    state.phase = 'failed'
    return
  }

  if (state.roundOrbHits.length === 0) {
    if (newProgress > prevProgress) {
      triggerOrbCollectBurst({ x: state.aimX, y: state.aimY })
    }
    state.roundIndex += 1
    return
  }

  const totalBonus = state.roundOrbHits.reduce((sum, hit) => sum + hit.value, 0)
  const extraProgress = computeOrbExtraProgress(totalBonus)

  if (extraProgress <= 0) {
    if (newProgress > prevProgress) {
      triggerOrbCollectBurst({ x: state.aimX, y: state.aimY })
    }
    state.roundOrbHits = []
    state.roundIndex += 1
    return
  }

  state.orbTally = {
    hits: [...state.roundOrbHits],
    totalBonus,
    extraProgress,
    startProgress: state.progress,
  }

  triggerOrbBurst({
    mode: 'tally',
    count: state.roundOrbHits.length,
    origins: state.roundOrbHits.map((hit) => ({ x: hit.x, y: hit.y })),
  })
}

export function completeOrbTally() {
  if (!state.orbTally) return

  const { extraProgress } = state.orbTally
  const prevProgress = state.progress
  state.progress = Math.min(100, state.progress + extraProgress)
  state.orbTally = null
  state.roundOrbHits = []

  if (state.progress >= 100) {
    triggerOrbCollectBurst({ x: 0.5, y: 0.52 }, true)
    triggerVictory()
    return
  }

  if (state.progress > prevProgress) {
    triggerOrbCollectBurst({ x: 0.5, y: 0.52 })
  }

  if (state.roundIndex >= MAX_ROUNDS) {
    state.phase = 'failed'
    return
  }

  state.roundIndex += 1
}

export function resetForge() {
  stopAudio(CHARGE_SFX_SRC)
  zoneInside.clear()

  if (state.victoryStage === 6) {
    state.playthrough = 1
    state.activeTool = 'hammer'
  }

  state.victoryStage = null
  state.progress = 0
  state.clicked = false
  state.lastHitQuality = null
  state.lastHitMessage = ''
  state.holdHint = ''
  state.forgeHeat = 0
  state.power = 0
  state.mark = getMarkForRound(1, getDifficultyPlaythrough())
  state.roundIndex = 1
  state.roundTimeLeft = getRoundTime(getDifficultyPlaythrough())
  state.zones = []
  state.zonePulse = {}
  state.zoneMissPulse = {}
  state.nextZoneOrder = 1
  state.zoneDriftTimer = 0
  state.chargeStartTime = null
  state.strikeImpact = 0
  state.impactFlash = 0
  state.chargeCombo = 0
  state.hitPopup = null
  state.roundOrbHits = []
  state.orbTally = null
  state.orbBurst = null
  state.aimX = 0.5
  state.aimY = 0.5
  state.phase = 'playing'
}

export { state }
