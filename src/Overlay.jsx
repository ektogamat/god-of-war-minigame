import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { clearCheatNotice, clearHoldHint, getDisplayPlaythrough, state } from './store/store'
import { gsap } from 'gsap'
import OrbTally from './Components/OrbTally/OrbTally'
import { MAX_ROUNDS } from './utils/forgeScoring'

const FORGE_SUBTITLE = {
  1: 'Craft your Leviathan',
  2: 'Craft your Blade of Chaos',
  3: 'Unleash your rage',
}

export default function Overlay() {
  const {
    clicked,
    progress,
    phase,
    playthrough,
    lastHitMessage,
    holdHint,
    power,
    mark,
    roundIndex,
    roundTimeLeft,
    zones,
    zonePulse,
    zoneMissPulse,
    nextZoneOrder,
    cheatNotice,
    impactFlash,
    aimX,
    aimY,
    hitPopup,
    orbTally,
  } = useSnapshot(state)

  const [showMessage, setShowMessage] = useState(false)
  const [showHoldHint, setShowHoldHint] = useState(false)
  const [showCheatNotice, setShowCheatNotice] = useState(false)
  const [holdHintText, setHoldHintText] = useState('')
  const [flashVisible, setFlashVisible] = useState(false)
  const [activeHitPopup, setActiveHitPopup] = useState(null)
  const prevHitMessage = useRef('')

  let showTimer, hideTimer

  const currentTarget = useMemo(
    () => zones.find((zone) => zone.order === nextZoneOrder) ?? null,
    [zones, nextZoneOrder]
  )

  const recentMiss = useMemo(() => {
    const now = Date.now()
    return Object.values(zoneMissPulse).some((at) => now - at < 450)
  }, [zoneMissPulse])

  useEffect(() => {
    if (!lastHitMessage || lastHitMessage === prevHitMessage.current) return

    prevHitMessage.current = lastHitMessage
    setShowMessage(false)

    showTimer = setTimeout(() => {
      setShowMessage(true)
    }, 100)

    hideTimer = setTimeout(() => {
      setShowMessage(false)
    }, 1500)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [lastHitMessage])

  useEffect(() => {
    if (!holdHint) return

    setHoldHintText(holdHint)
    setShowHoldHint(true)
    const hide = setTimeout(() => {
      setShowHoldHint(false)
      clearHoldHint()
    }, 2200)

    return () => clearTimeout(hide)
  }, [holdHint])

  useEffect(() => {
    if (!cheatNotice) return

    setShowCheatNotice(true)
    const hide = setTimeout(() => {
      setShowCheatNotice(false)
      clearCheatNotice()
    }, 3200)

    return () => clearTimeout(hide)
  }, [cheatNotice])

  useEffect(() => {
    if (!clicked) return
    setShowHoldHint(false)
  }, [clicked])

  useEffect(() => {
    if (!impactFlash) return
    setFlashVisible(true)
    const hide = setTimeout(() => setFlashVisible(false), 160)
    return () => clearTimeout(hide)
  }, [impactFlash])

  useEffect(() => {
    if (!hitPopup) return

    setActiveHitPopup(hitPopup)
    const hide = setTimeout(() => setActiveHitPopup(null), 700)
    return () => clearTimeout(hide)
  }, [hitPopup])

  useEffect(() => {
    if (phase !== 'playing') return

    const tl = gsap.timeline()

    tl.fromTo(
      '.animated-title span',
      { opacity: 0, y: 80 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'elastic.out(1, 0.6)',
        delay: 0.3,
      }
    ).fromTo(
      '.instruction',
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: 0.5,
      }
    )
  }, [phase])

  const renderAnimatedTitle = (title) => {
    return title.split('').map((char, index) => {
      if (char === ' ') {
        return (
          <span
            key={index}
            style={{ display: 'inline-block', width: '0.5em' }}
          />
        )
      }
      return (
        <span key={index} style={{ display: 'inline-block' }}>
          {char}
        </span>
      )
    })
  }

  const showGameplayHud = phase === 'playing'
  const hideChrome = clicked || !showGameplayHud || orbTally
  const timerSeconds = Math.max(0, roundTimeLeft)
  const timerWhole = Math.floor(timerSeconds)
  const timerMs = Math.floor((timerSeconds % 1) * 1000)
  const timerDisplay = `${timerWhole}.${String(timerMs).padStart(3, '0')}`
  const timerUrgent = timerSeconds <= 2
  const forgeSubtitle = FORGE_SUBTITLE[getDisplayPlaythrough(playthrough)]

  return (
    <>
      <OrbTally />
      <div
        className={`impact-flash ${flashVisible ? 'impact-flash--active' : ''}`}
        style={{ opacity: impactFlash || 0.6 }}
        aria-hidden='true'
      />
      <div
        className={`cheat-notice ${showCheatNotice ? 'show' : 'hide'}`}
        aria-live='polite'
      >
        <p className='cheat-notice-title'>CHEAT ENABLED</p>
        <p className='cheat-notice-body'>{cheatNotice}</p>
        <p className='cheat-notice-sub'>The forge bends to your will.</p>
      </div>
      {showGameplayHud && (
        <>
          <header className={hideChrome ? 'hidden' : 'visible'}>
            <img className='hud-logo' src='gow_logo.png' alt='Logo' />
          </header>
          <footer className={hideChrome ? 'hidden' : 'visible'}>
            <h1 className='animated-title'>
              <span className='animated-title-line'>
                {renderAnimatedTitle('HOLD AND')}
              </span>
              <span className='animated-title-line animated-title-line--second'>
                {renderAnimatedTitle('SWEEP')}
              </span>
            </h1>
            <p className='instruction instruction-subtitle'>
              {forgeSubtitle}
            </p>
          </footer>

          <div className='power-bar-wrap'>
            <p className='power-round'>
              ROUND {roundIndex}/{MAX_ROUNDS}
            </p>
            <div className='power-bar'>
              <div
                className='power-fill'
                style={{ height: `${power}%` }}
              />
              <div
                className='power-mark'
                style={{ bottom: `${mark}%` }}
              >
                <span className='power-mark-arrow' />
              </div>
            </div>
          </div>

          {clicked && (
            <>
              <div
                className={`charge-timer ${timerUrgent ? 'charge-timer--urgent' : ''}`}
              >
                <span className='charge-timer-plate' aria-hidden='true' />
                <p className='charge-timer-label'>TIME LEFT</p>
                <p className='charge-timer-value'>{timerDisplay}</p>
              </div>

              {currentTarget && (
                <svg
                  className={`aim-line ${recentMiss ? 'aim-line--wrong' : ''}`}
                  viewBox='0 0 100 100'
                  preserveAspectRatio='none'
                  aria-hidden='true'
                >
                  <line
                    x1={aimX * 100}
                    y1={aimY * 100}
                    x2={currentTarget.x * 100}
                    y2={currentTarget.y * 100}
                    className='aim-line-segment'
                  />
                </svg>
              )}

              {zones.map((zone) => {
                const pulsed = zonePulse[zone.id]
                const missed = zoneMissPulse[zone.id]
                const isPulsing = pulsed && Date.now() - pulsed < 300
                const isWrong = missed && Date.now() - missed < 450
                const isCurrent = zone.order === nextZoneOrder
                const isUpcoming = zone.order === nextZoneOrder + 1
                const isInactive =
                  !isCurrent && !isUpcoming

                return (
                  <div
                    key={zone.id}
                    className={`hot-zone ${isPulsing ? 'hit' : ''} ${isWrong ? 'hot-zone--wrong' : ''} ${isCurrent ? 'hot-zone--current' : ''} ${isUpcoming ? 'hot-zone--upcoming' : ''} ${isInactive ? 'hot-zone--inactive' : ''}`}
                    style={{
                      left: `${zone.x * 100}%`,
                      top: `${zone.y * 100}%`,
                      width: `${zone.r * 200}vmin`,
                      height: `${zone.r * 200}vmin`,
                    }}
                  >
                    <span className='hot-zone-order'>{zone.order}</span>
                  </div>
                )
              })}

              {activeHitPopup && (
                <div
                  className='hit-popup'
                  style={{
                    left: `${activeHitPopup.x * 100}%`,
                    top: `${activeHitPopup.y * 100}%`,
                  }}
                  aria-live='polite'
                >
                  HIT
                  {activeHitPopup.combo > 1
                    ? ` x${activeHitPopup.combo}`
                    : ''}
                </div>
              )}
            </>
          )}

          {clicked && (
            <p className='charge-hint'>
              <span className='charge-hint-desktop'>
                HIT SPARKS IN ORDER — RELEASE PAST THE ARROW
              </span>
              <span className='charge-hint-mobile'>
                ORDERED SPARKS · RELEASE PAST ARROW
              </span>
            </p>
          )}

          <div
            className={`hold-hint ${showHoldHint ? 'show' : 'hide'}`}
            aria-live='polite'
          >
            <p className='hold-hint-title'>HOLD TO CHARGE</p>
            <p className='hold-hint-body'>{holdHintText}</p>
          </div>

          <div
            className={`results ${showMessage ? 'show' : 'hide'} ${orbTally ? 'results--tally-active' : ''}`}
          >
            <h1>{lastHitMessage}</h1>
            <p>{`${Math.floor(progress)}% forged`}</p>
          </div>

          <div className='forge-progress'>
            <div className='forge-progress-meter'>
              <div
                className='forge-progress-fill'
                style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }}
              >
                <img src='axe.svg' className='hud-axe-icon' alt='' />
              </div>
              <div className='forge-progress-ghost'>
                <img src='axe.svg' className='hud-axe-icon' alt='Axe progress' />
              </div>
            </div>
            <p className='forge-progress-value'>{`${Math.floor(progress)}%`}</p>
          </div>
        </>
      )}
    </>
  )
}
