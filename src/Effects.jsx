import { useEffect, useRef, useState } from 'react'
import {
  EffectComposer,
  Bloom,
  TiltShift2,
  Vignette,
  ChromaticAberration,
  ShockWave,
  BrightnessContrast,
  Noise,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useControls } from 'leva'
import { state } from './store/store'
import { useSnapshot } from 'valtio'

export default function Effects() {
  const { strikeImpact } = useSnapshot(state)

  const { AllEffects } = useControls({
    AllEffects: true,
  })

  const composerRef = useRef()
  const [effectsState] = useState(true)
  const shockwaveRef = useRef()

  useEffect(() => {
    if (!strikeImpact || !shockwaveRef.current) return
    shockwaveRef.current.explode()
  }, [strikeImpact])

  if (AllEffects) {
    return (
      <EffectComposer
        ref={composerRef}
        multisampling={0}
        disableNormalPass
        stencilBuffer={false}
        enabled={effectsState}
        autoClear={false}
      >
        <Bloom
          luminanceThreshold={0.5}
          intensity={5}
          levels={5}
          radius={0.85}
          mipmapBlur
          luminanceSmoothing={0}
          opacity={0.4}
        />
        <Bloom
          luminanceThreshold={0.1}
          intensity={10}
          levels={7}
          radius={0.5}
          mipmapBlur
          luminanceSmoothing={0.3}
          opacity={0.3}
        />
        <ShockWave
          ref={shockwaveRef}
          amplitude={2.2}
          speed={9}
          waveSize={2.4}
          maxRadius={75}
        />
        <Vignette eskil={false} offset={0.22} darkness={0.55} />
        <TiltShift2 taper={0.85} blur={0.35} samples={4} />
        <ChromaticAberration
          offset={[0.008, 0.011]}
          radialModulation
          modulationOffset={0.45}
        />
        <Noise opacity={0.06} blendFunction={BlendFunction.OVERLAY} />
        <BrightnessContrast contrast={0.05} brightness={-0.04} />
      </EffectComposer>
    )
  }
}
