import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Hud, OrthographicCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useSnapshot } from 'valtio'
import * as THREE from 'three'
import { state, clearOrbBurst, getOrbTargetUV } from '../store/store'
import { getTheme } from '../theme/forgeTheme'

const MAX_ORBS = 64
const COLLECT_DURATION = 0.85
const TALLY_DURATION = 0.55
const TALLY_PARTICLES_PER_HIT = 4

const vertexShader = /* glsl */ `
  attribute vec2 aOrigin;
  attribute vec2 aTarget;
  attribute float aDelay;
  attribute float aSize;
  attribute float aArc;

  uniform float uTime;
  uniform float uDuration;
  uniform vec2 uResolution;

  varying float vAlpha;

  vec2 uvToPos(vec2 uv) {
    return vec2((uv.x - 0.5) * uResolution.x, (0.5 - uv.y) * uResolution.y);
  }

  // Accelerate into the target (suck-in feel)
  float easeInCubic(float t) {
    return t * t * t;
  }

  void main() {
    float local = uTime - aDelay;

    if (local < 0.0) {
      vAlpha = 0.0;
      gl_PointSize = 0.0;
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }

    float t = clamp(local / max(uDuration, 0.001), 0.0, 1.0);
    float eased = easeInCubic(t);

    vec2 from = uvToPos(aOrigin);
    vec2 to = uvToPos(aTarget);
    vec2 mid = mix(from, to, 0.5);
    // Slight arc so the path isn't a rigid line
    mid += vec2(-(to.y - from.y), to.x - from.x) * aArc * 0.18;

    // Quadratic bezier: origin → arc → target
    vec2 a = mix(from, mid, eased);
    vec2 b = mix(mid, to, eased);
    vec2 pos = mix(a, b, eased);

    // Pop in, then dissolve hard as they hit the meter
    float appear = smoothstep(0.0, 0.08, t);
    float fade = 1.0 - smoothstep(0.76, 0.94, t);
    vAlpha = appear * fade;
    if (t >= 0.95) vAlpha = 0.0;

    // Shrink into the indicator (not grow)
    float sizeScale = mix(1.15, 0.08, eased);
    gl_PointSize = max(aSize * sizeScale, 0.0);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uCoreColor;

  varying float vAlpha;

  void main() {
    if (vAlpha < 0.02) discard;

    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float glow = exp(-d * 3.6);
    float core = exp(-d * 13.0);
    vec3 col = mix(uColor, uCoreColor, core) * 2.2;
    gl_FragColor = vec4(col, min(1.0, vAlpha * glow * 1.5));
  }
`

function OrbBurstPoints() {
  const { orbBurst } = useSnapshot(state)
  const { size } = useThree()
  const materialRef = useRef()
  const startTimeRef = useRef(0)
  const readyRef = useRef(false)
  const endAtRef = useRef(0)
  const colorRef = useRef(new THREE.Color())
  const coreColorRef = useRef(new THREE.Color())

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'aOrigin',
      new THREE.BufferAttribute(new Float32Array(MAX_ORBS * 2), 2)
    )
    geo.setAttribute(
      'aTarget',
      new THREE.BufferAttribute(new Float32Array(MAX_ORBS * 2), 2)
    )
    geo.setAttribute(
      'aDelay',
      new THREE.BufferAttribute(new Float32Array(MAX_ORBS), 1)
    )
    geo.setAttribute(
      'aSize',
      new THREE.BufferAttribute(new Float32Array(MAX_ORBS), 1)
    )
    geo.setAttribute(
      'aArc',
      new THREE.BufferAttribute(new Float32Array(MAX_ORBS), 1)
    )
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(MAX_ORBS * 3), 3)
    )
    geo.setDrawRange(0, 0)
    return geo
  }, [])

  useEffect(() => {
    if (!orbBurst || !geometry) return

    readyRef.current = false

    const originAttr = geometry.getAttribute('aOrigin')
    const targetAttr = geometry.getAttribute('aTarget')
    const delayAttr = geometry.getAttribute('aDelay')
    const sizeAttr = geometry.getAttribute('aSize')
    const arcAttr = geometry.getAttribute('aArc')
    const isTally = orbBurst.mode === 'tally'
    const sourceCount = Math.max(1, orbBurst.count)
    const count = Math.min(
      isTally ? sourceCount * TALLY_PARTICLES_PER_HIT : sourceCount,
      MAX_ORBS
    )
    const target = getOrbTargetUV()
    const duration = isTally ? TALLY_DURATION : COLLECT_DURATION
    const theme = getTheme(orbBurst.playthrough ?? 1)
    colorRef.current.set(theme.particleEmissive)
    coreColorRef.current.set(theme.particleColor)

    let maxEnd = 0

    for (let i = 0; i < MAX_ORBS; i++) {
      if (i < count) {
        const sourceIndex = isTally
          ? Math.floor(i / TALLY_PARTICLES_PER_HIT)
          : i
        const copyIndex = isTally ? i % TALLY_PARTICLES_PER_HIT : 0
        const origin =
          orbBurst.origins[sourceIndex] ??
          orbBurst.origins[0] ??
          { x: 0.5, y: 0.5 }
        const tallySequence =
          sourceCount > 1 ? sourceIndex / (sourceCount - 1) : 0
        const delay = isTally
          ? 0.3 + tallySequence * 0.35 + copyIndex * 0.025
          : i * 0.014
        const jitter = isTally ? (copyIndex - 1.5) * 0.006 : 0
        originAttr.setXY(i, origin.x + jitter, origin.y - jitter)
        targetAttr.setXY(i, target.x, target.y)
        delayAttr.setX(i, delay)
        sizeAttr.setX(i, isTally ? 62 + copyIndex * 7 : 34 + Math.random() * 24)
        arcAttr.setX(i, (Math.random() * 2 - 1) * (isTally ? 0.55 : 1))
        maxEnd = Math.max(maxEnd, delay + duration)
      } else {
        originAttr.setXY(i, 0, 0)
        targetAttr.setXY(i, 0, 0)
        delayAttr.setX(i, 99)
        sizeAttr.setX(i, 0)
        arcAttr.setX(i, 0)
      }
    }

    originAttr.needsUpdate = true
    targetAttr.needsUpdate = true
    delayAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
    arcAttr.needsUpdate = true
    geometry.setDrawRange(0, count)
    startTimeRef.current = performance.now() / 1000
    endAtRef.current = maxEnd + 0.05
    readyRef.current = true

    if (materialRef.current) {
      materialRef.current.uniforms.uDuration.value = duration
      materialRef.current.uniforms.uColor.value.copy(colorRef.current)
      materialRef.current.uniforms.uCoreColor.value.copy(coreColorRef.current)
      materialRef.current.uniforms.uResolution.value.set(
        size.width,
        size.height
      )
      materialRef.current.uniforms.uTime.value = 0
    }
  }, [geometry, orbBurst?.seq])

  useFrame(() => {
    if (!readyRef.current || !materialRef.current || !orbBurst) return

    const elapsed = performance.now() / 1000 - startTimeRef.current
    materialRef.current.uniforms.uTime.value = elapsed
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height)

    if (elapsed >= endAtRef.current) {
      readyRef.current = false
      clearOrbBurst()
    }
  })

  if (!orbBurst) return null

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uDuration: { value: COLLECT_DURATION },
          uResolution: {
            value: new THREE.Vector2(size.width, size.height),
          },
          uColor: { value: colorRef.current.clone() },
          uCoreColor: { value: coreColorRef.current.clone() },
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </points>
  )
}

function OrbBurstCamera() {
  const { size } = useThree()
  const cameraRef = useRef()

  useLayoutEffect(() => {
    const camera = cameraRef.current
    if (!camera) return
    camera.left = -size.width / 2
    camera.right = size.width / 2
    camera.top = size.height / 2
    camera.bottom = -size.height / 2
    camera.updateProjectionMatrix()
  }, [size.width, size.height])

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      manual
      left={-size.width / 2}
      right={size.width / 2}
      top={size.height / 2}
      bottom={-size.height / 2}
      near={0.1}
      far={1000}
      position={[0, 0, 100]}
    />
  )
}

export default function OrbBurst() {
  const { orbBurst } = useSnapshot(state)

  if (!orbBurst) return null

  return (
    <Hud renderPriority={3}>
      <OrbBurstCamera />
      <OrbBurstPoints />
    </Hud>
  )
}
