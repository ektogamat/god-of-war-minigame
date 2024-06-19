import * as THREE from 'three'
import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSnapshot } from 'valtio'
import { getTheme } from '../theme/forgeTheme'
import { state } from '../store/store'

export default function Particles({ count }) {
  const mesh = useRef()
  const materialRef = useRef()
  const { playthrough } = useSnapshot(state)
  const theme = getTheme(playthrough)

  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100
      const factor = 20 + Math.random() * 200
      const speed = 0.001 + Math.random() / 200
      const xFactor = -15 + Math.random() * 30
      const yFactor = -5 + Math.random() * 10
      const zFactor = -15 + Math.random() * 30
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 })
    }
    return temp
  }, [count])

  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.color.set(theme.particleColor)
    materialRef.current.emissive.set(theme.particleEmissive)
  }, [theme.particleColor, theme.particleEmissive])

  useFrame((frameState) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle
      t = particle.t += speed / 2
      const a = Math.cos(t) + Math.sin(t * 1) / 10
      const b = Math.sin(t) + Math.cos(t * 2) / 10
      const s = Math.cos(t)
      particle.mx += (frameState.pointer.x - particle.mx) * 1.8
      particle.my += frameState.pointer.y * 8 * -1 - particle.my
      dummy.position.set(
        (particle.mx / 10) * a +
          xFactor +
          Math.cos((t / 10) * factor) +
          (Math.sin(t * 1) * factor) / 10,
        (particle.my / 2) * b +
          yFactor +
          Math.sin((t / 10) * factor) +
          (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b +
          zFactor +
          Math.cos((t / 10) * factor) +
          (Math.sin(t * 3) * factor) / 10
      )
      dummy.scale.set(s, s, s)
      dummy.rotation.set(s * 5, s * 5, s * 5)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <dodecahedronGeometry args={[0.1, 0]} />
      <meshPhongMaterial
        ref={materialRef}
        color={theme.particleColor}
        emissive={theme.particleEmissive}
        emissiveIntensity={1}
      />
    </instancedMesh>
  )
}
