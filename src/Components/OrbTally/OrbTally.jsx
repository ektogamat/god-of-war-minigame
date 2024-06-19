import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { gsap } from 'gsap'
import { completeOrbTally, state } from '../../store/store'

const TALLY_DURATION_MS = 1500

export default function OrbTally() {
  const { orbTally } = useSnapshot(state)
  const labelRef = useRef(null)
  const sumRef = useRef(null)
  const [runningSum, setRunningSum] = useState(0)

  useEffect(() => {
    if (!orbTally) return

    setRunningSum(0)
    const timers = []
    const sumStepMs = 600 / Math.max(1, orbTally.hits.length)

    const ctx = gsap.context(() => {
      gsap.fromTo(
        labelRef.current,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          delay: 0.35,
          ease: 'power2.out',
        }
      )

      orbTally.hits.forEach((_, index) => {
        const partialSum = orbTally.hits
          .slice(0, index + 1)
          .reduce((sum, entry) => sum + entry.value, 0)

        timers.push(
          setTimeout(() => {
            setRunningSum(partialSum)
            if (sumRef.current) {
              gsap.fromTo(
                sumRef.current,
                { scale: 1.15 },
                { scale: 1, duration: 0.2, ease: 'back.out(2)' }
              )
            }
          }, 500 + index * sumStepMs)
        )
      })

      timers.push(
        setTimeout(() => {
          completeOrbTally()
        }, TALLY_DURATION_MS)
      )
    })

    return () => {
      ctx.revert()
      timers.forEach(clearTimeout)
    }
  }, [orbTally?.totalBonus, orbTally?.startProgress])

  if (!orbTally) return null

  return (
    <div className='orb-tally' aria-live='polite'>
      <div className='orb-tally-hud'>
        <p className='orb-tally-label' ref={labelRef}>
          SPARK BONUS +{orbTally.extraProgress}%
        </p>
        <p className='orb-tally-sum' ref={sumRef}>
          +{runningSum}
        </p>
      </div>
    </div>
  )
}
