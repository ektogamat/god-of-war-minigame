import { useEffect, useRef } from 'react'
import { activateEasyDifficultyCheat } from '../../store/store'

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
]

export default function KonamiCode() {
  const step = useRef(0)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat) return

      const expected = KONAMI_SEQUENCE[step.current]
      if (event.code === expected) {
        step.current += 1
        if (step.current >= KONAMI_SEQUENCE.length) {
          step.current = 0
          activateEasyDifficultyCheat()
        }
        return
      }

      step.current = event.code === KONAMI_SEQUENCE[0] ? 1 : 0
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return null
}
