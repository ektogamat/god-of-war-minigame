import './loadingScreen.css'

import { useEffect, useRef } from 'react'

import { useProgress } from '@react-three/drei'

import { state } from '../../store/store'
import { useSnapshot } from 'valtio'

export default function LoadingScreen() {
  const { progress } = useProgress()
  const { finishedMainLoading } = useSnapshot(state)

  const progressRef = useRef()

  useEffect(() => {
    if (progressRef && progressRef.current)
      //   progressRef.current.style.transform = `scaleX(${progress}%`
      document.documentElement.style.setProperty(
        '--progress',
        Math.floor(progress)
      )

    if (progress === 100) {
      state.finishedMainLoading = true
    }
  }, [progress])

  return (
    <>
      {!finishedMainLoading && (
        <div
          className={`loader-wrapper ${
            finishedMainLoading ? 'finished-loading' : ''
          }`}
        >
          <div className='main-loader' ref={progressRef}>
            {/* <p>Loading</p> */}
            <svg
              width='250'
              height='250'
              className='circular-progress'
              viewBox='0 0 250 250'
            >
              <circle cy={125} cx={125} r={121} className='bg'></circle>
              <circle cy={125} cx={125} r={121} className='fg'></circle>
            </svg>
            {/* <span ref={progressRef} className='progress-loader'></span> */}
          </div>
        </div>
      )}
    </>
  )
}
