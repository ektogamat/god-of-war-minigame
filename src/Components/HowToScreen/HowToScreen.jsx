import { useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { gsap } from 'gsap'
import {
  playButtonHoverSfx,
  startPlaying,
  state,
} from '../../store/store'
import KeyPrompt, { useConfirmKey } from '../KeyPrompt/KeyPrompt'
import './howToScreen.css'

const RULES = [
  'Hold and drag through the sparks in numbered order',
  'Chain ordered hits for combo power before you release',
  'Reach 100% in 3 solid rounds to forge each weapon',
  'Flawless strikes need a long hit streak and a full bar',
  'Complete all three weapons to finish the trial',
]

export default function HowToScreen() {
  const { phase } = useSnapshot(state)
  const panelRef = useRef(null)
  const ready = phase === 'howto'

  useConfirmKey(startPlaying, ready)

  useEffect(() => {
    if (!ready || !panelRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.55, ease: 'power2.out' }
      )
      gsap.fromTo(
        '.howto-panel > *',
        { opacity: 0, y: 22 },
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

  const handleStart = () => {
    playButtonHoverSfx()
    startPlaying()
  }

  return (
    <div className='howto-screen' ref={panelRef}>
      <div className='howto-panel'>
        <p className='howto-eyebrow'>Prepare yourself</p>
        <h1 className='howto-title'>FORGE RULES</h1>
        <ol className='howto-steps'>
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
        <button
          className='howto-cta'
          type='button'
          onClick={handleStart}
          onMouseEnter={playButtonHoverSfx}
        >
          <KeyPrompt />
          <span>BEGIN FORGING</span>
        </button>
      </div>
    </div>
  )
}
