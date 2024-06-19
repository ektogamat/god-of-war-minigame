import { useEffect } from 'react'
import './keyPrompt.css'

export function useConfirmKey(onConfirm, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event) => {
      if (event.repeat) return
      if (event.key !== 'x' && event.key !== 'X') return
      event.preventDefault()
      onConfirm()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onConfirm, enabled])
}

export default function KeyPrompt({ label = 'X' }) {
  return (
    <span className='key-prompt' aria-hidden='true'>
      <span className='key-prompt-glyph'>{label}</span>
    </span>
  )
}
