import { useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { state } from '../../store/store'

const THEME_CLASSES = [
  'theme-ember',
  'theme-frost',
  'theme-chaos',
  'theme-tide',
  'theme-moss',
  'theme-violet',
]

function getThemeClass(playthrough) {
  if (playthrough === 6) return 'theme-violet'
  if (playthrough === 5) return 'theme-moss'
  if (playthrough === 4) return 'theme-tide'
  if (playthrough >= 3) return 'theme-chaos'
  if (playthrough === 2) return 'theme-frost'
  return 'theme-ember'
}

export default function ThemeSync() {
  const { playthrough } = useSnapshot(state)

  useEffect(() => {
    const container = document.getElementById('container')
    if (!container) return

    container.classList.remove(...THEME_CLASSES)
    container.classList.add(getThemeClass(playthrough))
  }, [playthrough])

  return null
}
