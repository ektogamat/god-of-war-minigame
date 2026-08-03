import { useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { gsap } from 'gsap'
import {
  playButtonHoverSfx,
  continueForging,
  playFinalVictorySfx,
  resetForge,
  state,
} from '../../store/store'
import KeyPrompt, { useConfirmKey } from '../KeyPrompt/KeyPrompt'
import { revealMeetingUrl } from '../../utils/meetingReveal'
import './victoryScreen.css'

const VICTORY_COPY = {
  1: {
    title: 'LEVIATHAN FORGED',
    tagline: 'The blade is complete. Brok and Sindri would be proud.',
  },
  2: {
    title: 'BLADES FORGED',
    tagline:
      'Twin blades tempered in chaos. The frost-forge bows to your mastery.',
  },
  3: {
    eyebrow: 'CONGRATULATIONS',
    title: 'YOU ARE THE GOD OF WAR!',
    tagline:
      'You conquered the frost-forge and mastered the Leviathan. Thank you for playing — may your legend echo through the nine realms.',
    afterSource:
      'The source is yours to study — yet the forge is not finished. Keep striking, and you may earn an audience with the mage who shaped this realm.',
    buttonLabel: 'CONTINUE FORGING',
  },
  4: {
    title: 'THE FORGE STILL BURNS',
    tagline: 'Something deeper waits in the embers of the nine realms.',
  },
  5: {
    title: 'DEEPER STILL',
    tagline: 'The blades remember what mortals forget.',
  },
  6: {
    eyebrow: 'ULTIMATUM PASSED',
    title: 'THE GODS ARE LISTENING',
    tagline:
      'You forged what few even knew existed. Claim your audience with the smith who shaped this realm.',
    buttonLabel: 'RESTART',
  },
}

export default function VictoryScreen() {
  const { phase, victoryStage } = useSnapshot(state)
  const panelRef = useRef(null)
  const ready = phase === 'won'
  const isPublicFinale = victoryStage === 3
  const isUltimatumFinale = victoryStage === 6
  const isFinaleScreen = isPublicFinale || isUltimatumFinale
  const onConfirm = isUltimatumFinale ? resetForge : continueForging

  useConfirmKey(onConfirm, ready)

  useEffect(() => {
    if (!ready || !panelRef.current) return

    let sfxTimer
    if (isFinaleScreen) {
      sfxTimer = setTimeout(() => {
        playFinalVictorySfx()
      }, 900)
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.out', delay: 1.2 }
      )
      gsap.fromTo(
        '.victory-panel > *',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power2.out',
          delay: 1.6,
        }
      )
    }, panelRef)

    return () => {
      if (sfxTimer) clearTimeout(sfxTimer)
      ctx.revert()
    }
  }, [ready, isFinaleScreen])

  if (!ready) return null

  const copy = VICTORY_COPY[victoryStage] ?? VICTORY_COPY[1]
  const buttonLabel = copy.buttonLabel ?? 'CONTINUE FORGING'

  return (
    <div
      className={`victory-screen ${isFinaleScreen ? 'victory-screen--final' : ''}`}
      ref={panelRef}
    >
      <div
        className={`victory-panel ${isFinaleScreen ? 'victory-panel--final' : ''}`}
      >
        {copy.eyebrow && (
          <p className='victory-eyebrow'>{copy.eyebrow}</p>
        )}
        <h1
          className={`victory-title ${isFinaleScreen ? 'victory-title--final' : ''}`}
        >
          {copy.title}
        </h1>
        <p
          className={`victory-tagline ${isFinaleScreen ? 'victory-tagline--final' : ''}`}
        >
          {copy.tagline}
        </p>
        {isPublicFinale && (
          <>
            <a
              className='victory-source-link'
              href='https://github.com/ektogamat/god-of-war-minigame'
              target='_blank'
              rel='noopener noreferrer'
              onMouseEnter={playButtonHoverSfx}
              onClick={playButtonHoverSfx}
            >
              View source code
            </a>
            {copy.afterSource && (
              <p className='victory-after-source'>{copy.afterSource}</p>
            )}
          </>
        )}
        {isUltimatumFinale && (
          <a
            className='victory-source-link victory-meeting-link'
            href={revealMeetingUrl()}
            target='_blank'
            rel='noopener noreferrer'
            onMouseEnter={playButtonHoverSfx}
            onClick={playButtonHoverSfx}
          >
            Schedule a meeting
          </a>
        )}
        <button
          type='button'
          className={isFinaleScreen ? 'victory-button--final' : ''}
          onClick={() => {
            if (isUltimatumFinale) {
              playButtonHoverSfx()
              resetForge()
              return
            }
            continueForging()
          }}
          onMouseEnter={playButtonHoverSfx}
        >
          <KeyPrompt />
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  )
}
