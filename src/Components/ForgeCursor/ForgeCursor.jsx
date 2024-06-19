import { useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { state } from '../../store/store'
import './forgeCursor.css'

export default function ForgeCursor() {
  const { phase, clicked } = useSnapshot(state)
  const cursorRef = useRef(null)
  const pos = useRef({ x: -100, y: -100 })
  const raf = useRef(0)
  const active = phase === 'playing'

  useEffect(() => {
    const el = cursorRef.current
    if (!el || !active) return

    const apply = () => {
      raf.current = 0
      el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`
    }

    const onMove = (event) => {
      pos.current.x = event.clientX
      pos.current.y = event.clientY
      if (!raf.current) raf.current = requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [active])

  useEffect(() => {
    const container = document.getElementById('container')
    if (!container) return

    container.classList.toggle('forge-cursor-active', active)
    return () => container.classList.remove('forge-cursor-active')
  }, [active])

  if (!active) return null

  return (
    <div
      ref={cursorRef}
      className={`forge-cursor ${clicked ? 'forge-cursor--charging' : ''}`}
      aria-hidden='true'
    >
      <span className='forge-cursor-ring' />
      <span className='forge-cursor-line forge-cursor-line--h' />
      <span className='forge-cursor-line forge-cursor-line--v' />
      <span className='forge-cursor-dot' />
    </div>
  )
}
