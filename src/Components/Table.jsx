import {
  Circle,
  MeshReflectorMaterial,
  Sphere,
  useVideoTexture,
} from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useSnapshot } from 'valtio'
import { getTheme } from '../theme/forgeTheme'
import { state } from '../store/store'

export default function Table() {
  const videoTexture = useVideoTexture('video_texture.mp4')
  videoTexture.flipY = true

  const fakeFireRef = useRef()
  const { clicked, forgeHeat, playthrough } = useSnapshot(state)
  const theme = getTheme(playthrough)

  useEffect(() => {
    if (!fakeFireRef.current?.material) return
    fakeFireRef.current.material.emissive.set(theme.tableEmissive)
  }, [theme.tableEmissive])

  useFrame((frameState) => {
    if (!fakeFireRef.current) return

    const heat = clicked ? forgeHeat : 0

    fakeFireRef.current.position.lerp(
      { x: 0, y: clicked ? 45 - heat * 6 : -25, z: clicked ? -35 : -5 },
      0.3
    )

    fakeFireRef.current.rotation.y = THREE.MathUtils.lerp(
      fakeFireRef.current.rotation.y,
      clicked ? Math.PI : 0,
      0.7
    )

    const mat = fakeFireRef.current.material
    mat.opacity = clicked ? 0.025 + heat * 0.035 : 1
    mat.emissiveIntensity = clicked ? 0.35 + heat * 0.25 : 2

    frameState.camera.zoom = THREE.MathUtils.lerp(
      frameState.camera.zoom,
      clicked ? 0.7 : 0.95,
      clicked ? 0.025 : 0.75
    )
  })

  return (
    <>
      <Circle
        args={[90, 16]}
        position={[0, 0, 0]}
        receiveShadow
        rotation-x={-Math.PI / 2}
      >
        <MeshReflectorMaterial
          resolution={512}
          blur={[200, 30]}
          mixBlur={1}
          mixStrength={1}
          roughness={1}
          depthScale={0.4}
          mirror
          minDepthThreshold={0.1}
          maxDepthThreshold={0.4}
          color='#a485f0'
          metalness={0}
          receiveShadow
        />
      </Circle>
      <Sphere
        args={[43, 16, 16, 0, Math.PI, 0, -Math.PI / 2]}
        position={[0, -15, -15]}
        rotation-x={Math.PI / 2}
        ref={fakeFireRef}
      >
        <meshStandardMaterial
          map={videoTexture}
          emissive={theme.tableEmissive}
          emissiveIntensity={2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          opacity={1}
          transparent
        />
      </Sphere>
    </>
  )
}
