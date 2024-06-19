import { useVideoTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useSnapshot } from 'valtio'
import { getTheme } from '../theme/forgeTheme'
import { state } from '../store/store'

export default function FakeFire() {
  const meshRef = useRef()
  const { playthrough, clicked, forgeHeat } = useSnapshot(state)
  const theme = getTheme(playthrough)
  const videoTexture = useVideoTexture('video_texture.mp4')
  videoTexture.flipY = false

  const fireScale = playthrough >= 3 ? 16 : 20
  const baseIntensity = theme.fakeFireIntensity

  useFrame(() => {
    const mat = meshRef.current?.material
    if (!mat) return

    const heat = clicked ? forgeHeat : 0
    const chargeDim = clicked ? 0.22 + heat * 0.08 : 1
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      baseIntensity * chargeDim,
      clicked ? 0.12 : 0.08
    )
  })

  return (
    <mesh ref={meshRef} scale={[fireScale, fireScale, fireScale]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        map={videoTexture}
        color={theme.fakeFireColor}
        emissive={theme.fakeFireEmissive}
        emissiveIntensity={baseIntensity}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
