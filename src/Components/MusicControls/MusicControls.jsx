import { useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { state, toggleMusic } from '../../store/store'
import './musicControls.css'

const MUSIC_SRC = encodeURI('/22. Rage of Sparta.mp3')

export default function MusicControls() {
  const { musicEnabled } = useSnapshot(state)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC)
    audio.loop = true
    audio.volume = 0.55
    audio.preload = 'auto'
    audioRef.current = audio

    const tryPlay = () => {
      if (!state.musicEnabled || !audioRef.current) return
      audioRef.current.play().catch(() => {})
    }

    tryPlay()

    const unlock = () => {
      tryPlay()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }

    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (musicEnabled) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [musicEnabled])

  return (
    <div className='music-controls'>
      <button
        type='button'
        className='music-toggle'
        onClick={toggleMusic}
        aria-label={musicEnabled ? 'Mute music' : 'Unmute music'}
        title={musicEnabled ? 'Mute music' : 'Unmute music'}
      >
        {musicEnabled ? (
          <svg viewBox='0 0 24 24' width='18' height='18' aria-hidden='true'>
            <path
              fill='currentColor'
              d='M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z'
            />
          </svg>
        ) : (
          <svg viewBox='0 0 24 24' width='18' height='18' aria-hidden='true'>
            <path
              fill='currentColor'
              d='M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v4h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z'
            />
          </svg>
        )}
        <span>{musicEnabled ? 'Music on' : 'Music off'}</span>
      </button>
    </div>
  )
}
