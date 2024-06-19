import { useEffect, useMemo, useRef } from 'react'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useSnapshot } from 'valtio'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import * as THREE from 'three'
import { state } from '../store/store'

const HAMMER_SCALE = 0.25
const AXE_ROTATION = [Math.PI / 2, -Math.PI / 2, 0]
const BLADES_ROTATION = [Math.PI - 1.9, Math.PI - 0.6, Math.PI / 2 + 0.1]
const AXE_SIZE_RATIO = 2
const BLADES_SIZE_RATIO = 1.1
const WINDUP_PITCH = -1
const IDLE_CAMERA = { x: 0, y: 30, z: -35, fov: 25 }

function buildToolLayout(scene, hammerGltf, sizeRatio) {
  const object = scene.clone(true)
  object.traverse((child) => {
    if (child.isMesh) child.castShadow = true
  })
  object.updateWorldMatrix(true, true)

  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const hammerGeometry = hammerGltf.nodes.Object001__0.geometry
  hammerGeometry.computeBoundingBox()
  const hammerSize = hammerGeometry.boundingBox.getSize(new THREE.Vector3())

  const toolMax = Math.max(size.x, size.y, size.z)
  const hammerMax =
    Math.max(hammerSize.x, hammerSize.y, hammerSize.z) * HAMMER_SCALE

  return {
    object,
    scale: (hammerMax / toolMax) * sizeRatio,
    offset: [-center.x, -center.y, -center.z],
  }
}

export function ForgeTool() {
  const hammerGltf = useGLTF('/hammer.glb')
  const axeGltf = useGLTF('/leviathan_axe-transformed.glb')
  const bladesGltf = useGLTF('/blades.glb')
  const controlsRef = useRef()
  const toolRef = useRef()
  const poseRef = useRef()
  const axeWrapRef = useRef()
  const bladesWrapRef = useRef()
  const revealPlayed = useRef(null)
  const v = useRef(new THREE.Vector3())
  const shakeRef = useRef({ intensity: 0, time: 0 })
  const { clicked, phase, activeTool, strikeImpact } = useSnapshot(state)
  const playing = phase === 'playing'
  const charging = clicked && playing
  const pointerActive = playing || phase === 'won'

  const axe = useMemo(
    () => buildToolLayout(axeGltf.scene, hammerGltf, AXE_SIZE_RATIO),
    [axeGltf.scene, hammerGltf.nodes]
  )

  const blades = useMemo(
    () => buildToolLayout(bladesGltf.scene, hammerGltf, BLADES_SIZE_RATIO),
    [bladesGltf.scene, hammerGltf.nodes]
  )

  useEffect(() => {
    if (!strikeImpact) return
    shakeRef.current = {
      intensity: state.impactFlash || 0.75,
      time: Date.now(),
    }
  }, [strikeImpact])

  useEffect(() => {
    if (!strikeImpact || !poseRef.current) return

    gsap.killTweensOf(poseRef.current.rotation)
    gsap
      .timeline()
      .to(poseRef.current.rotation, {
        x: 0.75,
        duration: 0.07,
        ease: 'power4.in',
      })
      .to(poseRef.current.rotation, {
        x: 0,
        duration: 0.32,
        ease: 'back.out(2.4)',
      })
  }, [strikeImpact])

  useFrame((frameState, delta) => {
    if (!toolRef.current) return

    const dt = Math.min(delta, 0.05)
    const pointer = pointerActive ? frameState.pointer : { x: 0, y: 0 }

    let shakeX = 0
    let shakeY = 0
    const shake = shakeRef.current
    if (shake.intensity > 0) {
      const elapsed = (Date.now() - shake.time) / 1000
      if (elapsed < 0.38) {
        const decay = 1 - elapsed / 0.38
        shakeX = (Math.random() - 0.5) * shake.intensity * 1.6 * decay
        shakeY = (Math.random() - 0.5) * shake.intensity * 1.1 * decay
      } else {
        shake.intensity = 0
      }
    }

    v.current.copy({
      x: pointer.x,
      y: pointer.y * 6,
      z: pointer.y,
    })
    v.current.unproject(frameState.camera)

    if (charging && state.chargeStartTime) {
      const elapsed = (Date.now() - state.chargeStartTime) / 1000
      const spinSpeed = 1.4 + elapsed * 2.2
      toolRef.current.rotation.z += spinSpeed * dt
    } else {
      toolRef.current.rotation.z = THREE.MathUtils.lerp(
        toolRef.current.rotation.z,
        0,
        pointerActive ? 0.96 : 0.12
      )
    }

    const followLerp = pointerActive
      ? charging
        ? 0.1
        : 0.46
      : 0.06
    const pitchLerp = pointerActive ? (charging ? 0.06 : 0.16) : 0.05

    toolRef.current.rotation.y = THREE.MathUtils.lerp(
      toolRef.current.rotation.y,
      pointer.x,
      followLerp
    )
    toolRef.current.rotation.x = THREE.MathUtils.lerp(
      toolRef.current.rotation.x,
      charging ? -1.7 : pointerActive ? -pointer.y * 0.35 : 0,
      pitchLerp
    )

    toolRef.current.position.set(
      -v.current.x * 2,
      charging ? v.current.y - 20 : 15,
      v.current.y - (charging ? 35 : 50)
    )

    const targetFov = pointerActive
      ? charging
        ? 55
        : 25
      : IDLE_CAMERA.fov
    frameState.camera.fov = THREE.MathUtils.lerp(
      frameState.camera.fov,
      targetFov,
      pointerActive ? (charging ? 0.005 : 0.5) : 0.08
    )

    const cameraTarget = pointerActive
      ? {
          x: pointer.x * 6 + shakeX,
          y: (charging ? 28 : 30 + pointer.y * 9.5) + shakeY,
          z: charging ? -32 : -35,
        }
      : IDLE_CAMERA

    frameState.camera.position.lerp(
      cameraTarget,
      pointerActive ? (charging ? 0.025 : 0.2) : 0.08
    )
    frameState.camera.updateProjectionMatrix()
  })

  useGSAP(
    () => {
      if (!poseRef.current) return

      const tl = gsap.timeline()
      gsap.killTweensOf(poseRef.current.rotation)

      if (charging) {
        tl.to(poseRef.current.rotation, {
          x: WINDUP_PITCH,
          duration: 2,
        })
      } else if (playing || phase === 'won') {
        tl.to(poseRef.current.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.8,
          ease: 'elastic.out(1.5,0.1)',
        })
      }

      return () => tl.kill()
    },
    { dependencies: [charging, playing, phase] }
  )

  useEffect(() => {
    if (activeTool === 'hammer') {
      revealPlayed.current = null
    }
  }, [activeTool])

  useEffect(() => {
    const wrapRef =
      activeTool === 'axe'
        ? axeWrapRef
        : activeTool === 'blades'
          ? bladesWrapRef
          : null

    if (!wrapRef?.current || phase !== 'won') return

    if (revealPlayed.current === activeTool) {
      wrapRef.current.scale.setScalar(1)
      return
    }

    revealPlayed.current = activeTool
    wrapRef.current.scale.setScalar(0.2)
    gsap.to(wrapRef.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.8,
      ease: 'back.out(1.25)',
    })
  }, [phase, activeTool])

  return (
    <>
      <mesh visible={false} onPointerMove={() => null}>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
      </mesh>

      <group ref={toolRef} dispose={null}>
        <group ref={poseRef}>
          {activeTool === 'hammer' && (
            <mesh
              castShadow
              geometry={hammerGltf.nodes.Object001__0.geometry}
              material={hammerGltf.materials['Scene_-_Root']}
              scale={HAMMER_SCALE}
            />
          )}

          {activeTool === 'axe' && (
            <group ref={axeWrapRef}>
              <group rotation={AXE_ROTATION} scale={axe.scale}>
                <group position={axe.offset}>
                  <primitive object={axe.object} />
                </group>
              </group>
            </group>
          )}

          {activeTool === 'blades' && (
            <group ref={bladesWrapRef}>
              <group rotation={BLADES_ROTATION} scale={blades.scale}>
                <group
                  position={[
                    blades.offset[0] + 0.2,
                    blades.offset[1] - 0.1,
                    blades.offset[2] + 0.2,
                  ]}
                >
                  <primitive object={blades.object} />
                </group>
              </group>
            </group>
          )}
        </group>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          ref={controlsRef}
          makeDefault
        />
      </group>
    </>
  )
}

useGLTF.preload('/hammer.glb')
useGLTF.preload('/leviathan_axe-transformed.glb')
useGLTF.preload('/blades.glb')
