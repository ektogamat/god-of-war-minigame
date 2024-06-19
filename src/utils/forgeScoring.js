export const MAX_ROUNDS = 3
export const POWER_DECAY_PER_SEC = 4

export const FULL_STRIKE_CAP = 42
export const WEAK_STRIKE_CAP = 16
export const FLAWLESS_COMBO_MIN = 4

export const DIFFICULTY = {
  1: {
    roundTimeSec: 10,
    zoneCount: 2,
    zoneRadius: 0.07,
    zonePowerMin: 8,
    zonePowerMax: 12,
    zoneDrift: false,
    zoneDriftSpeed: 0,
    zoneAutoRepositionSec: null,
    markBase: 48,
    markStep: 14,
    powerDecayPerSec: POWER_DECAY_PER_SEC,
  },
  2: {
    roundTimeSec: 9,
    zoneCount: 2,
    zoneRadius: 0.05,
    zonePowerMin: 8,
    zonePowerMax: 11,
    zoneDrift: true,
    zoneDriftSpeed: 0.08,
    zoneAutoRepositionSec: 2.2,
    markBase: 58,
    markStep: 13,
    powerDecayPerSec: 4.5,
  },
  3: {
    roundTimeSec: 8,
    zoneCount: 3,
    zoneRadius: 0.045,
    zonePowerMin: 6,
    zonePowerMax: 9,
    zoneDrift: true,
    zoneDriftSpeed: 0.15,
    zoneAutoRepositionSec: 1.4,
    markBase: 65,
    markStep: 13,
    powerDecayPerSec: 5,
  },
  4: {
    roundTimeSec: 7.5,
    zoneCount: 3,
    zoneRadius: 0.043,
    zonePowerMin: 6,
    zonePowerMax: 9,
    zoneDrift: true,
    zoneDriftSpeed: 0.16,
    zoneAutoRepositionSec: 1.35,
    markBase: 66,
    markStep: 13,
    powerDecayPerSec: 5.2,
  },
  5: {
    roundTimeSec: 7,
    zoneCount: 3,
    zoneRadius: 0.041,
    zonePowerMin: 6,
    zonePowerMax: 8,
    zoneDrift: true,
    zoneDriftSpeed: 0.17,
    zoneAutoRepositionSec: 1.25,
    markBase: 67,
    markStep: 13,
    powerDecayPerSec: 5.4,
  },
  6: {
    roundTimeSec: 6.5,
    zoneCount: 3,
    zoneRadius: 0.039,
    zonePowerMin: 5,
    zonePowerMax: 8,
    zoneDrift: true,
    zoneDriftSpeed: 0.18,
    zoneAutoRepositionSec: 1.15,
    markBase: 68,
    markStep: 12,
    powerDecayPerSec: 5.6,
  },
}

export function getDifficulty(playthrough = 1) {
  return DIFFICULTY[playthrough] ?? DIFFICULTY[1]
}

export function getRoundTime(playthrough = 1) {
  return getDifficulty(playthrough).roundTimeSec
}

/** Target mark on the power bar for each round (1–3). */
export function getMarkForRound(roundIndex, playthrough = 1) {
  const d = getDifficulty(playthrough)
  return Math.min(95, d.markBase + (roundIndex - 1) * d.markStep)
}

export function resolveStrike(power, mark, currentProgress, chargeCombo = 0) {
  let quality
  let message
  let delta

  if (power <= 0 || mark <= 0) {
    quality = 'miss'
    message = 'Missed!'
    delta = 0
  } else {
    const ratio = power / mark

    if (ratio >= 1) {
      quality = 'full'

      if (ratio >= 1.15) {
        delta = Math.round(Math.pow(ratio, 2.4) * 38)
      } else {
        delta = Math.round(28 + Math.pow(ratio - 1 + 0.35, 1.6) * 42)
      }

      delta = Math.min(delta, FULL_STRIKE_CAP)

      const flawless =
        ratio >= 1.15 &&
        power >= mark + 15 &&
        chargeCombo >= FLAWLESS_COMBO_MIN
      message = flawless ? 'Flawless!' : 'Superb!'
    } else if (ratio >= 0.45) {
      quality = 'weak'
      message = 'Weak strike!'
      delta = Math.min(
        WEAK_STRIKE_CAP,
        Math.round(6 + Math.pow(ratio, 1.8) * 18)
      )
    } else {
      quality = 'weak'
      message = 'Weak strike!'
      delta = Math.min(WEAK_STRIKE_CAP, Math.round(ratio * 10))
    }
  }

  const remaining = 100 - currentProgress
  delta = Math.min(delta, remaining)

  const newProgress = Math.min(100, currentProgress + delta)

  return { quality, message, delta, newProgress }
}
