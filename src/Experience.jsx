import { useMemo, useRef } from 'react'
import Particles from './Components/Particles.jsx'
import Effects from './Effects.jsx'
import { Environment, shaderMaterial } from '@react-three/drei'
import { ForgeTool } from './Components/ForgeTool.jsx'
import Table from './Components/Table.jsx'
import { useBlending, useFluid, useSingleFBO } from '@hmng8/use-shader-fx'
import { useFrame, useThree, createPortal, extend } from '@react-three/fiber'
import * as THREE from 'three'
import GoldenNuggets from './Components/GoldenNuggets.jsx'
import FakeFire from './Components/FakeFire.jsx'
import OrbBurst from './Components/OrbBurst.jsx'
import { useSnapshot } from 'valtio'
import { state } from './store/store'
import { getTheme } from './theme/forgeTheme'

export default function Experience() {
  const fxRef = useRef()
  const { size, viewport, camera, gl } = useThree()
  const { clicked, forgeHeat, playthrough } = useSnapshot(state)
  const theme = getTheme(playthrough)
  const [updateFluid, setFluid] = useFluid({ size, dpr: viewport.dpr / 40 })
  const [updateBlending] = useBlending({
    size,
    dpr: 0.4,
  })

  const colorVec = useMemo(() => new THREE.Vector3(), [])

  const offscreenScene = useMemo(() => new THREE.Scene(), [])

  const [_, updateRenderTarget] = useSingleFBO({
    scene: offscreenScene,
    camera,
    size,
    dpr: viewport.dpr,
    samples: 2,
    depthBuffer: true,
  })

  useFrame((props) => {
    const heat = clicked ? forgeHeat : 0
    const isFrost = playthrough === 2
    const isChaos = playthrough >= 3 && playthrough <= 3
    const isSecret = playthrough >= 4
    const trailScale = isFrost ? 0.72 : isChaos || isSecret ? 0.78 : 1.05

    setFluid({
      density_dissipation: isFrost || isChaos || isSecret ? 0.93 : 0.9,
      velocity_dissipation: isFrost || isChaos || isSecret ? 0.93 : 0.9,
      velocity_acceleration: (12.0 + heat * 8) * trailScale,
      splat_radius: (0.0015 + heat * 0.0015) * trailScale,
      curl_strength: (5.0 + heat * 2) * trailScale,
      pressure_iterations: 9,
      fluid_color: (velocity) => theme.fluidColor(velocity, colorVec),
    })

    const fluid = updateFluid(props)
    const fx = updateBlending(props, {
      map: fluid,
      alphaMap: false,
    })
    fxRef.current.u_fx = fx
    fxRef.current.u_alpha = 0.0
    fxRef.current.u_texture = updateRenderTarget(gl)
    fxRef.current.u_fluidMix = isFrost
      ? 0.095
      : isChaos || isSecret
        ? 0.105
        : 0.165
    fxRef.current.u_fluidWarp = isFrost
      ? 0.088
      : isChaos || isSecret
        ? 0.098
        : 0.165
  })

  return (
    <>
      {createPortal(
        <>
          <fog attach='fog' args={[theme.fog, 35, 65]} />
          <color attach='background' args={[theme.background]} />
          <Environment
            frames={Infinity}
            environmentIntensity={clicked ? 0.42 : 0.85}
            environmentRotation={[0, -1.9, 0]}
          >
            <FakeFire />
          </Environment>

          <directionalLight
            intensity={5}
            castShadow
            position={[15, 10, -20]}
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
          />
          <Particles count={80} />
          <Table />
          <GoldenNuggets scale={0.01} />
          <ForgeTool />
        </>,
        offscreenScene
      )}

      <Effects />
      <OrbBurst />
      <mesh>
        <planeGeometry args={[2, 2]} />
        <fxMaterial transparent key={FxMaterial.key} ref={fxRef} />
      </mesh>
    </>
  )
}

export const FxMaterial = shaderMaterial(
  {
    u_fx: null,
    u_alpha: 1.0,
    u_texture: null,
    u_fluidMix: 0.14,
    u_fluidWarp: 0.14,
  },
  /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = vec4(position, 1.0);
		}
	`,
  /* glsl */ `
		precision highp float;
		varying vec2 vUv;
		uniform sampler2D u_fx;
		uniform float u_alpha;
    uniform sampler2D u_texture;
    uniform float u_fluidMix;
    uniform float u_fluidWarp;

		void main() {
            vec2 uv = vUv;
            vec4 color = texture2D(u_fx, uv);

            float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));

            color.rgb = clamp(color.rgb, 0.0, 1.0);

            vec3 nNoiseMap = color.rgb * 2.0 - 1.0;
            uv = uv * 2.0 - 1.0;
            uv *= mix(vec2(1.0), abs(nNoiseMap.rg), u_fluidWarp);
            uv = (uv + 1.0) / 2.0;

            gl_FragColor = mix(texture2D(u_texture, uv),vec4(color.rgb, luminance), u_fluidMix);

            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
	`
)

extend({ FxMaterial })
