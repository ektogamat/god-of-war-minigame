import { Canvas, useFrame } from '@react-three/fiber'
import Experience from './Experience.jsx'
import { Suspense } from 'react'
import * as THREE from 'three'
import { endCharge, startCharge, state, tickCharge } from './store/store.js'

function ChargeLoop() {
  useFrame((frameState, delta) => {
    if (!state.clicked) return

    const px = (frameState.pointer.x + 1) * 0.5
    const py = (1 - frameState.pointer.y) * 0.5
    tickCharge(Math.min(delta, 0.05), px, py)
  })

  return null
}

export default function MainCanvas() {
  return (
    <Canvas
      gl={{
        powerPreference: 'high-performance',
        alpha: false,
        antialias: false,
        toneMapping: THREE.LinearToneMapping,
        toneMappingExposure: 1.5,
      }}
      dpr={0.7}
      camera={{
        fov: 55,
        near: 0.1,
        far: 1000,
        position: [0, 4, -8],
      }}
      dispose={null}
      onPointerDown={() => {
        if (state.phase !== 'playing' || state.orbTally) return
        startCharge()
      }}
      onPointerUp={() => {
        if (state.orbTally) return
        endCharge()
      }}
    >
      <Suspense fallback={null}>
        <Experience />
        <ChargeLoop />
      </Suspense>
    </Canvas>
  )
}
