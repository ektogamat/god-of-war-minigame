import { useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { gsap } from 'gsap'
import { DISCLAIMER } from '../../copy/disclaimer'
import {
  continueFromIntro,
  playButtonHoverSfx,
  state,
} from '../../store/store'
import KeyPrompt, { useConfirmKey } from '../KeyPrompt/KeyPrompt'
import './introScreen.css'

export default function IntroScreen() {
  const { finishedMainLoading, phase } = useSnapshot(state)
  const panelRef = useRef(null)
  const ready = finishedMainLoading && phase === 'intro'

  useConfirmKey(continueFromIntro, ready)

  useEffect(() => {
    if (!ready || !panelRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out' }
      )
      gsap.fromTo(
        '.intro-panel > *',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.12,
          ease: 'power2.out',
          delay: 0.2,
        }
      )
      gsap.fromTo(
        '.intro-footer',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 1.1 }
      )
    }, panelRef)

    return () => ctx.revert()
  }, [ready])

  if (!ready) return null

  const handleContinue = () => {
    playButtonHoverSfx()
    continueFromIntro()
  }

  return (
    <div className='intro-screen' ref={panelRef}>
      <div className='intro-scroll'>
        <div className='intro-stack'>
          <div className='intro-panel'>
            <img className='intro-logo' src='gow_logo.png' alt='God of War' />
            <p className='intro-eyebrow'>The forge awaits</p>
            <h1 className='intro-title'>
              <span>AWAKEN YOUR</span>
              <span>RELIC</span>
            </h1>
            <p className='intro-tagline'>
              Test your might at the forge and complete the legendary axe. Forge
              all three weapons and prove your worth to the gods of Olympus —
              only then shall the source code be unlocked.
            </p>
            <button
              className='intro-cta'
              type='button'
              onClick={handleContinue}
              onMouseEnter={playButtonHoverSfx}
            >
              <KeyPrompt />
              <span>BEGIN FORGING</span>
            </button>
          </div>
        </div>
        <footer className='intro-footer'>
          <p className='intro-credit'>Created by Anderson Mancini</p>
          <p className='intro-disclaimer intro-disclaimer--desktop'>
            {DISCLAIMER}
          </p>
          <details className='intro-legal intro-legal--mobile'>
            <summary className='intro-legal-summary'>Legal notice</summary>
            <p className='intro-disclaimer'>{DISCLAIMER}</p>
          </details>
        </footer>
      </div>
    </div>
  )
}
