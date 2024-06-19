import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { DISCLAIMER } from '../../copy/disclaimer'
import { playButtonHoverSfx, state } from '../../store/store'
import './helpScreen.css'

const RULES = [
  'Hold and drag through sparks in numbered order',
  'Chain ordered hits for combo power, then release past the arrow',
  'Reach 100% in 3 solid rounds to forge each weapon',
  'Flawless strikes need a long hit streak and a full bar',
  'Complete all three weapons to finish the trial',
]

const WEAPONS = [
  {
    id: 1,
    name: 'Leviathan',
    detail: 'The first relic — forge the axe and prove your craft.',
  },
  {
    id: 2,
    name: 'Blades of Chaos',
    detail: 'The second trial — temper the twin blades in frost.',
  },
  {
    id: 3,
    name: 'God of War',
    detail: 'The final trial — unleash your rage and conquer the forge.',
  },
]

function getWeaponsForged(playthrough, victoryStage) {
  if (victoryStage === 3) return 3
  return Math.min(3, Math.max(0, playthrough - 1))
}

function WeaponDots({ forged, size = 'sm' }) {
  return (
    <span
      className={`weapon-dots weapon-dots--${size}`}
      aria-label={`${forged} of 3 weapons forged`}
    >
      {WEAPONS.map((weapon) => {
        const filled = forged >= weapon.id
        return (
          <span
            key={weapon.id}
            className={`weapon-dot ${filled ? 'weapon-dot--filled' : ''}`}
            title={
              filled
                ? `${weapon.name} forged`
                : `${weapon.name} not yet forged`
            }
          />
        )
      })}
    </span>
  )
}

export default function HelpScreen() {
  const { playthrough, victoryStage } = useSnapshot(state)
  const [open, setOpen] = useState(false)
  const forged = getWeaponsForged(playthrough, victoryStage)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className='help-screen'>
      <button
        type='button'
        className='help-toggle'
        onClick={() => {
          playButtonHoverSfx()
          setOpen((value) => !value)
        }}
        onMouseEnter={playButtonHoverSfx}
        aria-expanded={open}
        aria-controls='help-panel'
        aria-label={
          open
            ? 'Close help'
            : `Open help. ${forged} of 3 weapons forged`
        }
        title={`Help · ${forged}/3 forged`}
      >
        <span className='help-toggle-icon' aria-hidden='true'>
          ?
        </span>
        <WeaponDots forged={forged} size='sm' />
        <span className='help-toggle-label'>Help</span>
      </button>

      {open && (
        <div
          className='help-backdrop'
          onClick={() => setOpen(false)}
          role='presentation'
        >
          <div
            id='help-panel'
            className='help-panel'
            role='dialog'
            aria-modal='true'
            aria-labelledby='help-title'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='help-panel-header'>
              <h2 id='help-title' className='help-title'>
                FORGE RULES
              </h2>
              <button
                type='button'
                className='help-close'
                onClick={() => {
                  playButtonHoverSfx()
                  setOpen(false)
                }}
                onMouseEnter={playButtonHoverSfx}
                aria-label='Close help'
              >
                ×
              </button>
            </div>

            <ol className='help-rules'>
              {RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>

            <div className='help-progress'>
              <div className='help-progress-header'>
                <p className='help-challenge-eyebrow'>Weapon progress</p>
                <WeaponDots forged={forged} size='lg' />
              </div>
              <p className='help-progress-summary'>
                {forged === 0 &&
                  'No weapons forged yet. Each filled mark tracks a conquered relic.'}
                {forged > 0 && forged < 3 &&
                  `${forged} of 3 weapons forged. Empty marks await the trials still ahead.`}
                {forged === 3 &&
                  'All three weapons forged. You have proven your worth to the gods.'}
              </p>
              <ul className='help-weapon-list'>
                {WEAPONS.map((weapon) => {
                  const filled = forged >= weapon.id
                  return (
                    <li
                      key={weapon.id}
                      className={`help-weapon-item ${filled ? 'help-weapon-item--forged' : ''}`}
                    >
                      <span
                        className={`weapon-dot ${filled ? 'weapon-dot--filled' : ''}`}
                        aria-hidden='true'
                      />
                      <div>
                        <p className='help-weapon-name'>
                          {weapon.name}
                          <span className='help-weapon-status'>
                            {filled ? 'Forged' : 'Locked'}
                          </span>
                        </p>
                        <p className='help-weapon-detail'>{weapon.detail}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className='help-challenge'>
              <p className='help-challenge-eyebrow'>The trial of the gods</p>
              <p className='help-challenge-text'>
                If you are able to forge all three weapons, you will prove your
                worth to the gods of Olympus — and access to the source code
                shall be unlocked.
              </p>
            </div>

            <p className='help-disclaimer'>{DISCLAIMER}</p>
          </div>
        </div>
      )}
    </div>
  )
}
