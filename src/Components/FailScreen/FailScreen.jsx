import { useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { gsap } from 'gsap'
import { playButtonHoverSfx, continueForging, getDisplayPlaythrough, state } from '../../store/store'
import KeyPrompt, { useConfirmKey } from '../KeyPrompt/KeyPrompt'
import './failScreen.css'

const FAIL_TAGLINE = {
  1: 'The Leviathan needs more strikes. Try again — fill past the arrow each round.',
  2: 'The Blade of Chaos is not yet tempered. Try again — fill past the arrow each round.',
  3: 'Your rage has not forged the final relic. Try again — fill past the arrow each round.',
}

export default function FailScreen() {
  const { phase, playthrough } = useSnapshot(state)
  const panelRef = useRef(null)
  const ready = phase === 'failed'

  useConfirmKey(continueForging, ready)

  useEffect(() => {
    if (!ready || !panelRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out' }
      )
      gsap.fromTo(
        '.fail-panel > *',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.12,
          ease: 'power2.out',
          delay: 0.15,
        }
      )
    }, panelRef)

    return () => ctx.revert()
  }, [ready])

  if (!ready) return null

  const failTagline = FAIL_TAGLINE[getDisplayPlaythrough(playthrough)]

  return (
    <div className='fail-screen' ref={panelRef}>
      <div className='fail-panel'>
        <h1 className='fail-title'>FORGE INCOMPLETE</h1>
        <p className='fail-tagline'>{failTagline}</p>
        <button
          type='button'
          onClick={continueForging}
          onMouseEnter={playButtonHoverSfx}
        >
          <KeyPrompt />
          <span>CONTINUE FORGING</span>
        </button>
      </div>
    </div>
  )
}
